from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import paho.mqtt.client as mqtt
from contextlib import asynccontextmanager
from typing import Dict, Any

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
    }
}

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
    # Startup
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
    return system_state

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Push state updates every second
            await websocket.send_json(system_state)
            await asyncio.sleep(1)
    except Exception as e:
        print(f"WebSocket disconnect: {e}")
