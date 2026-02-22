# HydroMonitor 🌿

An autonomous hydroponics monitoring and dosing system with a React dashboard, FastAPI backend, and ESP32 firmware.

## Features

- Real-time sensor monitoring (pH, EC, water temperature, water level, air temperature, humidity, VPD)
- Autonomous PID-based pH and EC dosing
- Live WebSocket dashboard
- MQTT-based communication with ESP32 firmware
- Configurable targets, tolerances, and automation rules

---

## Repository Structure

```
HydroMonitor/
├── software/
│   ├── backend/          # FastAPI server (Python)
│   │   ├── main.py
│   │   ├── config_manager.py
│   │   ├── control_engine.py
│   │   └── requirements.txt
│   └── frontend/         # React dashboard (Vite + Tailwind)
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   └── App.jsx
│       └── package.json
├── firmware/             # ESP32 PlatformIO firmware (C++)
│   ├── src/main.cpp
│   └── lib/
└── docs/                 # Documentation & scripts
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PlatformIO (for firmware)
- An MQTT broker (e.g. Mosquitto)

---

### Backend

```bash
cd software/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.  
WebSocket endpoint: `ws://localhost:8000/ws`

> **Note:** On first run, a default `config.json` is created automatically in the backend directory. This file is excluded from git (it contains machine-specific MQTT settings).

---

### Frontend

```bash
cd software/frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

To build for production:

```bash
npm run build
```

---

### Firmware (ESP32)

1. Install [PlatformIO](https://platformio.org/).
2. Open the `firmware/` folder in VS Code with PlatformIO extension.
3. Edit `firmware/src/main.cpp` to set your WiFi credentials and MQTT broker IP.
4. Build and upload:
   ```bash
   pio run --target upload
   ```

---

## Configuration

All system parameters (pH target, EC target, PID tuning, MQTT broker, etc.) can be configured via the **Configuration** tab in the dashboard or by directly editing `config.json` in the backend directory.

| Parameter | Default | Description |
|---|---|---|
| `ph.target` | 6.0 | Target pH |
| `ph.tolerance` | 0.2 | Acceptable pH deviation |
| `ec.target` | 1.5 mS/cm | Target EC |
| `ec.tolerance` | 0.1 mS/cm | Acceptable EC deviation |
| `mqtt.broker` | 192.168.1.100 | MQTT broker IP |

---

## License

MIT
