# Hydroponic Automation System - Implementation Plan

## Goal Description
Build a system to automate and monitor a hydroponic growing setup. The system should read sensor data (pH, EC, water level, etc.) and control actuators (pumps, lights) based on defined rules or manual input.

## User Review Required
> [!IMPORTANT]
> **Architecture Confirmation**
> We are proceeding with **New Firmware** (PlatformIO/Arduino) and **MQTT** for connectivity.
>
> **Next Steps:**
> 1.  **Pinout Research**: I need to find the specific GPIO pin mapping for the Hydromisc PCB (Solenoids, Pumps, Sensors) to write the firmware.
> 2.  **Environment Setup**: I will create a `firmware` folder (PlatformIO) and a `software` folder (Backend/Frontend).
>
> **Request**: If you have the Hydromisc schematics or pinout documentation handy, please share it. Otherwise, I will search for it in the open-source repo.

## Proposed Architecture
### 1. Hardware / Firmware (ESP32)
-   **Framework**: PlatformIO (Arduino Core) for easy library management.
-   **Communication**: connect to WiFi -> Connect to MQTT Broker.
-   **Logic**:
    -   Publish Sensor Data (e.g., `hydro/status/ph`, `hydro/status/ec`) every X seconds.
    -   Subscribe to Control Topics (e.g., `hydro/control/pump_a`) to toggle relays.
    -   Safety: Hard-coded safety limits (e.g., auto-off pump if run too long).

### 2. Backend / Broker (The "Brain")
-   **Broker**: Mosquitto (standard MQTT broker).
-   **Controller**: Python (FastAPI) service.
    -   Listens to sensor topics.
    -   Logs data to SQLite/TimescaleDB.
    -   Runs automation rules (e.g., "If pH < 5.5, dose pH Up").

### 3. Frontend (The "Face")
-   **Tech**: React (Vite) + TailwindCSS.
-   **Features**:
    -   Real-time Dashboard (Gauges/Charts).
    -   Manual Override Switches.
    -   Settings (Thresholds, WiFi Config).

## Verification Plan
### Automated Tests
- Unit tests for control logic (e.g., "Does pump turn off when water full?").
### Manual Verification
- Simulate sensor readings and verify dashboard updates.
- Verify manual override controls.
