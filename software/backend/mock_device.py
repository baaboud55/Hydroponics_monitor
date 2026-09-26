"""
Mock MQTT Device — HydroMonitor
================================
Simulates an ESP32 hydroponic controller over MQTT.

Usage:
    python mock_device.py
    python mock_device.py --broker localhost --port 1883
    python mock_device.py --device-id hydro-misc-02

Topics published (sensor status):
    hydro/status/<device_id>/ph
    hydro/status/<device_id>/ec
    hydro/status/<device_id>/water_temp
    hydro/status/<device_id>/water_level
    hydro/status/<device_id>/air_temp
    hydro/status/<device_id>/humidity
    hydro/status/<device_id>/power_current

Topics subscribed (actuator control):
    hydro/<device_id>/control/solenoid/+
    hydro/<device_id>/control/pump/+
    hydro/<device_id>/control/main_pump
    hydro/<device_id>/control/dosing/+/dose
    hydro/<device_id>/control/dosing/+/speed
"""

import argparse
import math
import random
import time
import sys
import threading
import paho.mqtt.client as mqtt

# ── Colour helpers for pretty terminal output ───────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RED    = "\033[91m"
RESET  = "\033[0m"
BOLD   = "\033[1m"


# ── Sensor simulation state ─────────────────────────────────────────────────
class SensorSim:
    """Maintains a slow sinusoidal walk of realistic sensor values."""

    def __init__(self):
        self.tick = 0.0
        # Dose-effect offsets  (cleared gradually after a dose)
        self._ph_offset = 0.0
        self._ec_offset = 0.0

    def step(self):
        """Advance simulation by one step (call every publish interval)."""
        self.tick += 0.05
        # Slowly decay dose effects
        self._ph_offset *= 0.95
        self._ec_offset *= 0.95

    def ph(self) -> float:
        val = 6.0 + 0.4 * math.sin(self.tick * 0.7) + self._ph_offset
        val += random.uniform(-0.02, 0.02)         # noise
        return round(max(4.0, min(8.0, val)), 2)

    def ec(self) -> float:
        val = 1.5 + 0.3 * math.sin(self.tick * 0.5 + 1.0) + self._ec_offset
        val += random.uniform(-0.01, 0.01)
        return round(max(0.0, min(4.0, val)), 2)

    def water_temp(self) -> float:
        return round(22.0 + 1.5 * math.sin(self.tick * 0.3) + random.uniform(-0.1, 0.1), 1)

    def water_level(self) -> int:
        return int(75 + 10 * math.sin(self.tick * 0.1))

    def air_temp(self) -> float:
        return round(24.0 + 2.0 * math.sin(self.tick * 0.2 + 0.5) + random.uniform(-0.1, 0.1), 1)

    def humidity(self) -> float:
        return round(65.0 + 8.0 * math.sin(self.tick * 0.15 + 2.0) + random.uniform(-0.5, 0.5), 1)

    def power_current(self) -> float:
        return round(2.5 + 0.8 * abs(math.sin(self.tick * 0.4)) + random.uniform(-0.05, 0.05), 2)

    def apply_dose(self, pump_index: int, duration_ms: int):
        """Simulate the effect of a dosing event on sensor values."""
        ml_estimate = duration_ms / 1000.0   # assume 1 ml/s
        if pump_index == 2:     # pH pump — drives pH up
            self._ph_offset += 0.05 * ml_estimate
        elif pump_index == 0:   # Nutrient A — raises EC
            self._ec_offset += 0.03 * ml_estimate
        elif pump_index == 1:   # Nutrient B — raises EC
            self._ec_offset += 0.03 * ml_estimate


# ── Actuator state ───────────────────────────────────────────────────────────
class ActuatorState:
    def __init__(self):
        self.solenoids = [False] * 8
        self.pumps     = [False] * 6
        self.main_pump = False
        self.dosing_speed = [0] * 4

    def summary(self) -> str:
        sol = "".join("█" if v else "░" for v in self.solenoids)
        pmp = "".join("█" if v else "░" for v in self.pumps)
        mp  = "█" if self.main_pump else "░"
        return f"Solenoids[{sol}] Pumps[{pmp}] Main[{mp}]"


# ── MQTT callbacks ───────────────────────────────────────────────────────────
def make_on_connect(device_id: str, actuators: ActuatorState):
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print(f"{GREEN}{BOLD}[CONNECTED]{RESET} broker={client._host}  device={device_id}")
            control_root = f"hydro/{device_id}/control/#"
            client.subscribe(control_root)
            print(f"{CYAN}[SUBSCRIBED]{RESET} {control_root}")
        else:
            print(f"{RED}[CONNECT FAILED]{RESET} rc={rc}")
    return on_connect


def make_on_message(device_id: str, actuators: ActuatorState, sim: SensorSim):
    def on_message(client, userdata, msg):
        topic   = msg.topic
        payload = msg.payload.decode().strip()

        # Strip control root prefix: hydro/<device_id>/control/...
        prefix  = f"hydro/{device_id}/control/"
        if not topic.startswith(prefix):
            return
        sub = topic[len(prefix):]           # e.g. "solenoid/3" or "dosing/0/dose"
        parts = sub.split("/")

        tag = ""
        if parts[0] == "solenoid" and len(parts) == 2:
            idx   = int(parts[1])
            state = payload in ("1", "true", "ON")
            actuators.solenoids[idx] = state
            tag   = f"solenoid/{idx} → {'ON' if state else 'OFF'}"

        elif parts[0] == "pump" and len(parts) == 2:
            idx   = int(parts[1])
            state = payload in ("1", "true", "ON")
            actuators.pumps[idx] = state
            tag   = f"pump/{idx} → {'ON' if state else 'OFF'}"

        elif parts[0] == "main_pump":
            state = payload in ("1", "true", "ON")
            actuators.main_pump = state
            tag   = f"main_pump → {'ON' if state else 'OFF'}"

        elif parts[0] == "dosing" and len(parts) == 3:
            pump_idx = int(parts[1])
            cmd      = parts[2]
            if cmd == "speed":
                actuators.dosing_speed[pump_idx] = int(payload)
                tag = f"dosing/{pump_idx}/speed → {payload}%"
            elif cmd == "dose":
                duration_ms = int(payload)
                sim.apply_dose(pump_idx, duration_ms)
                tag = f"dosing/{pump_idx}/dose → {duration_ms}ms  (effect applied)"

        if tag:
            print(f"{YELLOW}[CMD]{RESET} {tag}   {actuators.summary()}")

    return on_message


def make_on_disconnect():
    def on_disconnect(client, userdata, rc):
        if rc != 0:
            print(f"{RED}[DISCONNECTED]{RESET} rc={rc} — will retry…")
    return on_disconnect


# ── Publish loop (runs in its own thread) ────────────────────────────────────
def publish_loop(client, device_id: str, sim: SensorSim, interval: float):
    status_root = f"hydro/status/{device_id}"
    print(f"{CYAN}[PUBLISH]{RESET} Sending sensor data every {interval}s → {status_root}/#\n")

    while True:
        sim.step()
        readings = {
            "ph":            str(sim.ph()),
            "ec":            str(sim.ec()),
            "water_temp":    str(sim.water_temp()),
            "water_level":   str(sim.water_level()),
            "air_temp":      str(sim.air_temp()),
            "humidity":      str(sim.humidity()),
            "power_current": str(sim.power_current()),
        }

        for sensor, value in readings.items():
            client.publish(f"{status_root}/{sensor}", value, qos=0, retain=False)

        # Compact one-line status
        ts = time.strftime("%H:%M:%S")
        print(
            f"[{ts}]  pH={readings['ph']}  EC={readings['ec']} mS/cm  "
            f"T_water={readings['water_temp']}°C  T_air={readings['air_temp']}°C  "
            f"Humidity={readings['humidity']}%  Level={readings['water_level']}%  "
            f"Current={readings['power_current']}A",
            flush=True,
        )

        time.sleep(interval)


# ── Entry point ──────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="HydroMonitor Mock MQTT Device")
    parser.add_argument("--broker",    default="test.mosquitto.org", help="MQTT broker host")
    parser.add_argument("--port",      type=int, default=1883,        help="MQTT broker port")
    parser.add_argument("--device-id", default="hydro-misc-01",       help="Device ID")
    parser.add_argument("--interval",  type=float, default=2.0,       help="Publish interval (seconds)")
    args = parser.parse_args()

    sim       = SensorSim()
    actuators = ActuatorState()

    client = mqtt.Client(client_id=f"mock-{args.device_id}-{int(time.time())}")
    client.on_connect    = make_on_connect(args.device_id, actuators)
    client.on_message    = make_on_message(args.device_id, actuators, sim)
    client.on_disconnect = make_on_disconnect()

    print(f"\n{BOLD}HydroMonitor Mock MQTT Device{RESET}")
    print(f"  broker   : {args.broker}:{args.port}")
    print(f"  device   : {args.device_id}")
    print(f"  interval : {args.interval}s")
    print(f"  Press Ctrl+C to stop\n")

    try:
        client.connect(args.broker, args.port, keepalive=60)
    except Exception as e:
        print(f"{RED}[ERROR]{RESET} Could not connect to broker: {e}")
        sys.exit(1)

    # Start MQTT network loop in background thread
    client.loop_start()

    # Wait until connected before publishing
    timeout = 10
    while not client.is_connected() and timeout > 0:
        time.sleep(0.5)
        timeout -= 0.5
    if not client.is_connected():
        print(f"{RED}[ERROR]{RESET} Timed out waiting for connection.")
        sys.exit(1)

    try:
        publish_loop(client, args.device_id, sim, args.interval)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}[STOPPED]{RESET} Mock device shutting down.")
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
