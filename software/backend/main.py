from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import asyncio
import math
import os
import paho.mqtt.client as mqtt
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional, List

# Import our custom modules
import database
from control_engine import DosingEngine, PIDParameters
from config_manager import get_config_manager, SystemConfiguration, ParameterConfig

# --- Configuration ---
# Set MQTT_ENABLED=true to connect to the real broker (and run mock_device.py).
# When false, the internal mock sensor simulation is used instead.
MQTT_ENABLED      = os.getenv("MQTT_ENABLED", "false").lower() == "true"
MQTT_BROKER       = os.getenv("MQTT_BROKER", "test.mosquitto.org")
MQTT_PORT         = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC_STATUS = "hydro/status/#"

# --- Global State ---
# Store latest sensor values in memory for the dashboard
system_state: Dict[str, Any] = {
    "ph": 6.0,
    "ec": 1.5,
    "do": 8.0,
    "water_temp": 22.0,
    "water_level": 75,
    "air_temp": 24.0,
    "humidity": 65.0,
    "vpd": 1.2,
    "power_current": 2.5,
    "pumps": {
        "dose_a": False,
        "dose_b": False
    },
    # Actuator states (kept in sync with hardware via MQTT)
    "solenoids": [False] * 8,       # 8 solenoid valves
    "circulation_pumps": [False] * 6,  # 6 circulation pumps
    "main_pump": False,
    "automation_active": False,
    "last_dose": None
}

# Initialize control system
config_mgr = get_config_manager()
dosing_engine = DosingEngine()

# Load configuration into dosing engine
dosing_engine.update_configuration({
    "targets": config_mgr.get_targets(),
    "tolerances": config_mgr.get_tolerances(),
    "automation_enabled": config_mgr.get_automation_status(),
    "safety_limits": config_mgr.config.safety,
    "bounds": {
        "ph": {"min": config_mgr.config.ph.min_value, "max": config_mgr.config.ph.max_value},
        "ec": {"min": config_mgr.config.ec.min_value, "max": config_mgr.config.ec.max_value}
    }
})

# --- MQTT Client ---
client = mqtt.Client(client_id=f"hydro-backend-{os.getpid()}")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[MQTT] Connected to {MQTT_BROKER}:{MQTT_PORT}")
        client.subscribe(MQTT_TOPIC_STATUS)
        print(f"[MQTT] Subscribed to {MQTT_TOPIC_STATUS}")
    else:
        print(f"[MQTT] Connection failed rc={rc}")

def on_message(client, userdata, msg):
    """
    Expected topic format from mock_device / firmware:
        hydro/status/<device_id>/<sensor>
    e.g. hydro/status/hydro-misc-01/ph
    """
    global system_state
    try:
        topic = msg.topic
        payload = msg.payload.decode().strip()
        print(f"[MQTT RX] {topic} → {payload}")

        # Extract the sensor name from the last path segment
        parts = topic.split("/")
        sensor = parts[-1]  # e.g. "ph", "ec", "water_temp" …

        sensor_map = {
            "ph":            ("ph",            float),
            "ec":            ("ec",            float),
            "do":            ("do",            float),
            "water_temp":    ("water_temp",    float),
            "air_temp":      ("air_temp",      float),
            "humidity":      ("humidity",      float),
            "water_level":   ("water_level",   lambda v: int(float(v))),
            "power_current": ("power_current", float),
        }

        if sensor in sensor_map:
            key, cast = sensor_map[sensor]
            system_state[key] = cast(payload)

    except Exception as e:
        print(f"[MQTT] Error parsing message: {e}")

client.on_connect = on_connect
client.on_message = on_message

# --- Mock Sensor Simulation ---
_mock_tick = 0.0

async def mock_sensor_loop():
    """Simulate slowly oscillating sensor values for testing without hardware."""
    global system_state, _mock_tick
    while True:
        _mock_tick += 0.05  # advances ~3°/s at 1 Hz updates

        # Gently oscillate around realistic baselines
        system_state["ph"] = 6.0 + 0.4 * math.sin(_mock_tick * 0.7)
        system_state["ec"] = 1.5 + 0.3 * math.sin(_mock_tick * 0.5 + 1.0)
        system_state["do"] = 8.0 + 0.5 * math.sin(_mock_tick * 0.2 + 0.5)
        system_state["water_temp"] = 22.0 + 1.5 * math.sin(_mock_tick * 0.3)
        system_state["water_level"] = int(75 + 10 * math.sin(_mock_tick * 0.1))
        system_state["air_temp"] = 24.0 + 2.0 * math.sin(_mock_tick * 0.2 + 0.5)
        system_state["humidity"] = 65.0 + 8.0 * math.sin(_mock_tick * 0.15 + 2.0)

        # VPD calculated from air temp & humidity
        T = system_state["air_temp"]
        RH = system_state["humidity"]
        svp = 0.6108 * math.exp(17.27 * T / (T + 237.3))
        system_state["vpd"] = round(svp * (1 - RH / 100), 2)

        system_state["power_current"] = 2.5 + 0.8 * abs(math.sin(_mock_tick * 0.4))

        await asyncio.sleep(1)

# --- FastAPI Lifecycle ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the SQLite Dosing History database
    database.init_db()

    # Startup: launch autonomous control loop
    asyncio.create_task(control_loop())
    print("Autonomous control loop started")

    if MQTT_ENABLED:
        # Real MQTT mode — data comes from mock_device.py or actual hardware
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
            client.loop_start()
            print(f"[MQTT] Client started — broker={MQTT_BROKER}:{MQTT_PORT}")
            print("[MQTT] Run 'python mock_device.py' in another terminal to feed sensor data.")
        except Exception as e:
            print(f"[MQTT] Failed to connect: {e}  — falling back to internal simulation")
            asyncio.create_task(mock_sensor_loop())
    else:
        # Internal simulation mode (default)
        asyncio.create_task(mock_sensor_loop())
        print("[SIM] Internal mock sensor loop running. Set MQTT_ENABLED=true to use real MQTT.")

    yield
    # Shutdown
    client.loop_stop()

app = FastAPI(lifespan=lifespan)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "system": "Hydroponic Automation Backend"}

@app.get("/api/state")
def get_state():
    """Get current system state including sensor readings and automation status"""
    state = system_state.copy()
    state["automation_config"] = {
        "targets": dosing_engine.targets,
        "tolerances": dosing_engine.tolerances,
        "enabled": dosing_engine.automation_enabled
    }
    return state

# Pydantic models for API requests
class ConfigUpdate(BaseModel):
    parameter: str  # 'ph' or 'ec'
    target: Optional[float] = None
    tolerance: Optional[float] = None
    enabled: Optional[bool] = None

class ManualDoseRequest(BaseModel):
    pump_index: int  # 0-3
    duration_ms: int  # milliseconds

class CalibrationRequest(BaseModel):
    sensor: str  # 'ph', 'ec', 'do'
    command: str # Payload for the request, e.g. "Cal,atm"

# Configuration endpoints
@app.get("/api/config")
def get_configuration():
    """Get complete system configuration"""
    return config_mgr.get_config().model_dump()

@app.post("/api/config/parameter")
def update_parameter_config(config: ConfigUpdate):
    """Update configuration for a specific parameter"""
    updates = {}
    if config.target is not None:
        updates["target"] = config.target
    if config.tolerance is not None:
        updates["tolerance"] = config.tolerance
    if config.enabled is not None:
        updates["enabled"] = config.enabled

    success = config_mgr.update_parameter(config.parameter, updates)
    if success:
        # Update dosing engine with new config
        dosing_engine.update_configuration({
            "targets": config_mgr.get_targets(),
            "tolerances": config_mgr.get_tolerances(),
            "automation_enabled": config_mgr.get_automation_status(),
            "safety_limits": config_mgr.config.safety,
            "bounds": {
                "ph": {"min": config_mgr.config.ph.min_value, "max": config_mgr.config.ph.max_value},
                "ec": {"min": config_mgr.config.ec.min_value, "max": config_mgr.config.ec.max_value}
            }
        })
        return {"status": "success", "message": f"Updated {config.parameter} configuration"}
    else:
        raise HTTPException(status_code=400, detail="Failed to update configuration")

@app.post("/api/config/automation/{parameter}/{enabled}")
def toggle_automation(parameter: str, enabled: bool):
    """Enable or disable automation for a parameter"""
    success = config_mgr.enable_automation(parameter, enabled)
    if success:
        dosing_engine.update_configuration({
            "automation_enabled": config_mgr.get_automation_status(),
            "safety_limits": config_mgr.config.safety,
            "bounds": {
                "ph": {"min": config_mgr.config.ph.min_value, "max": config_mgr.config.ph.max_value},
                "ec": {"min": config_mgr.config.ec.min_value, "max": config_mgr.config.ec.max_value}
            }
        })
        return {"status": "success", "enabled": enabled}
    raise HTTPException(status_code=400, detail="Invalid parameter")

# Dosing history and manual control
@app.get("/api/dosing/history")
def get_dosing_history(limit: int = 50):
    """Get recent dosing history"""
    return {"history": dosing_engine.get_history(limit)}

@app.post("/api/dosing/manual")
def manual_dose(request: ManualDoseRequest):
    """Manually trigger a dosing action"""
    topic = f"hydro/{config_mgr.config.mqtt['device_id']}/control/dosing/{request.pump_index}/dose"
    client.publish(topic, str(request.duration_ms))
    print(f"Manual dose command: pump={request.pump_index} duration={request.duration_ms}ms")
    return {
        "status": "command_sent",
        "pump": request.pump_index,
        "duration_ms": request.duration_ms
    }

@app.post("/api/dosing/reset")
def reset_controllers():
    """Reset PID controllers (use after manual intervention)"""
    dosing_engine.reset_controllers()
    return {"status": "controllers_reset"}

@app.post("/api/calibrate")
def send_calibration_command(request: CalibrationRequest):
    """Passes a calibration string direct to the ESP32"""
    # e.g., hydro/hydro-misc-01/control/calibrate/do
    topic = f"hydro/{config_mgr.config.mqtt['device_id']}/control/calibrate/{request.sensor}"
    client.publish(topic, request.command)
    print(f"Calibration command: sensor={request.sensor} command='{request.command}'")
    return {
        "status": "command_sent",
        "sensor": request.sensor,
        "command": request.command
    }

# --- Actuator Endpoints ---

@app.post("/api/actuators/solenoid/{index}/{state}")
def set_solenoid(index: int, state: bool):
    """Toggle a solenoid valve on or off"""
    if index < 0 or index > 7:
        raise HTTPException(status_code=400, detail="Solenoid index must be 0-7")
    system_state["solenoids"][index] = state
    topic = f"hydro/{config_mgr.config.mqtt['device_id']}/control/solenoid/{index}"
    client.publish(topic, "1" if state else "0")
    print(f"Solenoid {index} → {'ON' if state else 'OFF'}")
    return {"status": "ok", "solenoid": index, "state": state}

@app.post("/api/actuators/pump/{index}/{state}")
def set_pump(index: int, state: bool):
    """Toggle a circulation pump on or off"""
    if index < 0 or index > 5:
        raise HTTPException(status_code=400, detail="Pump index must be 0-5")
    system_state["circulation_pumps"][index] = state
    topic = f"hydro/{config_mgr.config.mqtt['device_id']}/control/pump/{index}"
    client.publish(topic, "1" if state else "0")
    print(f"Pump {index} → {'ON' if state else 'OFF'}")
    return {"status": "ok", "pump": index, "state": state}

@app.post("/api/actuators/main_pump/{state}")
def set_main_pump(state: bool):
    """Toggle the main circulation pump"""
    system_state["main_pump"] = state
    topic = f"hydro/{config_mgr.config.mqtt['device_id']}/control/main_pump"
    client.publish(topic, "1" if state else "0")
    print(f"Main Pump → {'ON' if state else 'OFF'}")
    return {"status": "ok", "state": state}

# Background task - Control Loop
async def control_loop():
    """Background task that runs the autonomous control logic"""
    while True:
        try:
            if any(dosing_engine.automation_enabled.values()):
                actions = dosing_engine.compute_dosing_action(system_state)

                if actions["ph_dose"]:
                    dose_info = actions["ph_dose"]
                    duration_ms = int(dose_info["amount_ml"] * 1000)
                    topic = f"hydro/{config_mgr.config.mqtt['device_id']}/control/dosing/{dose_info['pump_index']}/dose"
                    client.publish(topic, str(duration_ms))
                    system_state["last_dose"] = {
                        "type": "ph",
                        "amount_ml": dose_info["amount_ml"],
                        "reason": dose_info["reason"],
                        "timestamp": asyncio.get_event_loop().time()
                    }
                    print(f"AUTO-DOSE: pH {dose_info['amount_ml']:.1f}ml - {dose_info['reason']}")

                if actions["ec_dose"]:
                    dose_info = actions["ec_dose"]
                    duration_ms = int(dose_info["amount_ml"] * 1000)
                    topic = f"hydro/{config_mgr.config.mqtt['device_id']}/control/dosing/{dose_info['pump_index']}/dose"
                    client.publish(topic, str(duration_ms))
                    system_state["last_dose"] = {
                        "type": "ec",
                        "amount_ml": dose_info["amount_ml"],
                        "reason": dose_info["reason"],
                        "timestamp": asyncio.get_event_loop().time()
                    }
                    print(f"AUTO-DOSE: EC {dose_info['amount_ml']:.1f}ml - {dose_info['reason']}")

                for msg in actions["messages"]:
                    print(f"Control Loop: {msg}")

                system_state["automation_active"] = True
            else:
                system_state["automation_active"] = False

        except Exception as e:
            print(f"Error in control loop: {e}")

        await asyncio.sleep(5)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            enhanced_state = system_state.copy()
            enhanced_state["automation_status"] = {
                "targets": dosing_engine.targets,
                "current": {
                    "ph": system_state.get("ph", 0),
                    "ec": system_state.get("ec", 0)
                },
                "enabled": dosing_engine.automation_enabled
            }
            await websocket.send_json(enhanced_state)
            await asyncio.sleep(1)
    except Exception as e:
        print(f"WebSocket disconnect: {e}")
