from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import asyncio
import paho.mqtt.client as mqtt
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional, List

# Import our custom modules
from control_engine import DosingEngine, PIDParameters
from config_manager import get_config_manager, SystemConfiguration, ParameterConfig

# --- Configuration ---
MQTT_BROKER = "192.168.1.100" # Placeholder, user will configure
MQTT_PORT = 1883
MQTT_TOPIC_STATUS = "hydro/status/#"

# --- Global State ---
# Store latest sensor values in memory for the dashboard
system_state: Dict[str, Any] = {
    "ph": 0.0,
    "ec": 0.0,
    "water_temp": 0.0,
    "water_level": 0,
    "air_temp": 0.0,   # New
    "humidity": 0.0,   # New
    "vpd": 0.0,        # New (Calculated)
    "power_current": 0.0, # New (Amps)
    "pumps": {
        "dose_a": False,
        "dose_b": False
    },
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
    "automation_enabled": config_mgr.get_automation_status()
})

# --- MQTT Client ---
client = mqtt.Client()

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT Broker with result code {rc}")
    client.subscribe(MQTT_TOPIC_STATUS)

def on_message(client, userdata, msg):
    global system_state
    try:
        topic = msg.topic
        payload = msg.payload.decode()
        print(f"MQTT RX: {topic} -> {payload}")
        
        # Simple parsing logic
        if "ph" in topic:
            system_state["ph"] = float(payload)
        elif "ec" in topic:
            system_state["ec"] = float(payload)
        elif "temp" in topic:
            system_state["temp"] = float(payload)
            
    except Exception as e:
        print(f"Error parsing MQTT message: {e}")

client.on_connect = on_connect
client.on_message = on_message

# --- FastAPI Lifecycle ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background control loop
    asyncio.create_task(control_loop())
    print("Autonomous control loop started")
    try:
        # client.connect(MQTT_BROKER, MQTT_PORT, 60)
        # client.loop_start()
        print("MQTT Client Initialized (Mock Mode - Broker not connected yet)")
    except Exception as e:
        print(f"Failed to connect to MQTT: {e}")
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
            "automation_enabled": config_mgr.get_automation_status()
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
            "automation_enabled": config_mgr.get_automation_status()
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
    # Publish MQTT command to firmware
    topic = f"hydro/{config_mgr.config.mqtt['device_id']}/control/dosing/{request.pump_index}/dose"
    client.publish(topic, str(request.duration_ms))
    
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

# Background task - Control Loop
async def control_loop():
    """Background task that runs the autonomous control logic"""
    while True:
        try:
            # Check if any automation is enabled
            if any(dosing_engine.automation_enabled.values()):
                # Compute dosing actions based on current sensor data
                actions = dosing_engine.compute_dosing_action(system_state)
                
                # Execute pH dosing if needed
                if actions["ph_dose"]:
                    dose_info = actions["ph_dose"]
                    # Convert ml to duration (ms) - this should be calibrated
                    # Assuming 1ml/sec flow rate for example
                    duration_ms = int(dose_info["amount_ml"] * 1000)
                    
                    # Publish to MQTT
                    topic = f"hydro/{config_mgr.config.mqtt['device_id']}/control/dosing/{dose_info['pump_index']}/dose"
                    client.publish(topic, str(duration_ms))
                    
                    system_state["last_dose"] = {
                        "type": "ph",
                        "amount_ml": dose_info["amount_ml"],
                        "reason": dose_info["reason"],
                        "timestamp": asyncio.get_event_loop().time()
                    }
                    print(f"AUTO-DOSE: pH {dose_info['amount_ml']:.1f}ml - {dose_info['reason']}")
                
                # Execute EC dosing if needed
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
                
                # Log any messages
                for msg in actions["messages"]:
                    print(f"Control Loop: {msg}")
                    
                system_state["automation_active"] = True
            else:
                system_state["automation_active"] = False
                
        except Exception as e:
            print(f"Error in control loop: {e}")
        
        # Run control loop every 5 seconds
        await asyncio.sleep(5)

# NOTE: control loop is started inside the lifespan context manager above.

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Push state updates every second
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

