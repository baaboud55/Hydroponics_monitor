#include <Arduino.h>
#include <WiFiManager.h>
#include <WebServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>
#include <ESPmDNS.h>
#include <ArduinoOTA.h>
#include <HTTPUpdateServer.h>
#include <HydroActuators.h>
#include <HydroSensors.h>
#include <HydroDosingPumps.h>
#include <HydroControl.h>

// Shift Register Pins
#define PIN_SR_DATA 26
#define PIN_SR_CLOCK 27
#define PIN_SR_LATCH 14
#define PIN_SR_CLEAR 12

// Dosing Pump Pins
#define PIN_DOSING_A 18
#define PIN_DOSING_B 19
#define PIN_DOSING_PH 21
#define PIN_DOSING_AUX 22

// Digital Expansion Port 0: DS18B20 water temp (OneWire needs bidirectional - use Out pin)
#define PIN_SENSOR_DS18B20 4
// Digital Expansion Port 1: DHT21/AM2301 air temp+humidity (data pin)
#define PIN_SENSOR_DHT 17
// DC Resistance / Water Level
#define PIN_SENSOR_LEVEL 32
// Current Sense (built into pump headers)
#define PIN_SENSOR_CURRENT 35
// pH Probe on pH BNC #0
#define PIN_SENSOR_PH 36
#define PIN_SENSOR_EC 34 // EC_0 is on pin 34
#define PIN_EC_M_GATE 25
#define PIN_EC_P_GATE 15

HydroActuators actuators(PIN_SR_DATA, PIN_SR_CLOCK, PIN_SR_LATCH, PIN_SR_CLEAR);
HydroDosingPumps dosingPumps(PIN_DOSING_A, PIN_DOSING_B, PIN_DOSING_PH, PIN_DOSING_AUX);
HydroSensors sensors(PIN_SENSOR_DS18B20, PIN_SENSOR_DHT, PIN_SENSOR_LEVEL, PIN_SENSOR_CURRENT, PIN_SENSOR_PH, PIN_SENSOR_EC, PIN_EC_M_GATE, PIN_EC_P_GATE);

HydroControl hydroControl(sensors, dosingPumps);
WebServer server(80);
HTTPUpdateServer httpUpdater;

void handleApiState() {
    StaticJsonDocument<1024> doc;
    doc["ph"] = sensors.getPH();
    doc["ec"] = sensors.getEC();
    doc["waterTemp"] = sensors.getWaterTemp();
    doc["airTemp"] = sensors.getAirTemp();
    doc["humidity"] = sensors.getHumidity();
    doc["waterLevel"] = sensors.isWaterLevelOk() ? 100 : 0;
    doc["pumpState"] = 0;
    
    // Debug variables
    doc["ec_R"] = sensors.getLastEcR();
    doc["ec_V"] = sensors.getLastEcV();
    doc["ec_sum"] = sensors.getLastEcSum();
    
    // Pump statuses
    JsonArray pumps = doc.createNestedArray("pumps");
    for (int i=0; i<4; i++) {
        JsonObject pump = pumps.createNestedObject();
        pump["id"] = i;
        pump["speed"] = dosingPumps.getSpeed(i);
        pump["is_dosing"] = dosingPumps.isDosing(i);
    }

    // Automation Config
    JsonObject auto_config = doc.createNestedObject("automation_config");
    JsonObject targets = auto_config.createNestedObject("targets");
    targets["ph"] = hydroControl.getPhTarget();
    targets["ec"] = hydroControl.getEcTarget();
    
    JsonObject tolerances = auto_config.createNestedObject("tolerances");
    tolerances["ph"] = hydroControl.getPhTolerance();
    tolerances["ec"] = hydroControl.getEcTolerance();
    
    JsonObject enabled = auto_config.createNestedObject("enabled");
    enabled["ph"] = hydroControl.isPhEnabled();
    enabled["ec"] = hydroControl.isEcEnabled();
    
    auto_config["active_crop"] = "";

    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
}

void handleApiConfig() {
    StaticJsonDocument<512> doc;
    JsonObject targets = doc.createNestedObject("targets");
    targets["ph"] = hydroControl.getPhTarget();
    targets["ec"] = hydroControl.getEcTarget();
    
    JsonObject tolerances = doc.createNestedObject("tolerances");
    tolerances["ph"] = hydroControl.getPhTolerance();
    tolerances["ec"] = hydroControl.getEcTolerance();
    
    JsonObject enabled = doc.createNestedObject("enabled");
    enabled["ph"] = hydroControl.isPhEnabled();
    enabled["ec"] = hydroControl.isEcEnabled();

    String response;
    serializeJson(doc, response);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
}

void handleApiConfigParameter() {
    if (server.method() == HTTP_OPTIONS) {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.sendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
        server.send(204);
        return;
    }
    
    if (server.hasArg("plain") == false) {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(400, "text/plain", "Body not received");
        return;
    }
    
    String body = server.arg("plain");
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, body);
    
    if (error) {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(400, "text/plain", "Invalid JSON");
        return;
    }
    
    const char* parameter = doc["parameter"];
    if (!parameter) {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(400, "text/plain", "Missing parameter");
        return;
    }
    
    if (strcmp(parameter, "ph") == 0) {
        float target = doc.containsKey("target") ? doc["target"].as<float>() : hydroControl.getPhTarget();
        float tol = doc.containsKey("tolerance") ? doc["tolerance"].as<float>() : hydroControl.getPhTolerance();
        bool en = doc.containsKey("enabled") ? doc["enabled"].as<bool>() : hydroControl.isPhEnabled();
        
        hydroControl.setPhTarget(target, tol);
        hydroControl.enableAutomation(en, hydroControl.isEcEnabled());
        hydroControl.saveConfig();
    } 
    else if (strcmp(parameter, "ec") == 0) {
        float target = doc.containsKey("target") ? doc["target"].as<float>() : hydroControl.getEcTarget();
        float tol = doc.containsKey("tolerance") ? doc["tolerance"].as<float>() : hydroControl.getEcTolerance();
        bool en = doc.containsKey("enabled") ? doc["enabled"].as<bool>() : hydroControl.isEcEnabled();
        
        hydroControl.setEcTarget(target, tol);
        hydroControl.enableAutomation(hydroControl.isPhEnabled(), en);
        hydroControl.saveConfig();
    }
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"status\":\"ok\"}");
}

void setup() {
    Serial.begin(115200);
    Serial.println("\n\nHydroponic Standalone System - Booting...");

    // Initialize Hardware
    actuators.begin();
    dosingPumps.begin();
    sensors.begin();
    hydroControl.begin();

    // Mount LittleFS for the Web Dashboard
    if (!LittleFS.begin(true)) {
        Serial.println("An Error has occurred while mounting LittleFS");
    } else {
        Serial.println("LittleFS Mounted Successfully");
    }

    WiFiManager wm;
    bool res = wm.autoConnect("HydroMisc-Setup", "password");
    if(!res) {
        Serial.println("Failed to connect to WiFi");
    } else {
        Serial.print("Connected! IP Address: ");
        Serial.println(WiFi.localIP());
    }

    if (MDNS.begin("hydromonitor")) {
        Serial.println("MDNS responder started at http://hydromonitor.local");
        MDNS.addService("http", "tcp", 80);
    } else {
        Serial.println("Error setting up MDNS responder!");
    }

    // Configure ArduinoOTA
    ArduinoOTA.setHostname("hydromonitor");
    ArduinoOTA.onStart([]() {
        String type;
        if (ArduinoOTA.getCommand() == U_FLASH) {
            type = "sketch";
        } else { // U_SPIFFS / U_LITTLEFS
            type = "filesystem";
        }
        Serial.println("Start updating " + type);
    });
    ArduinoOTA.onEnd([]() {
        Serial.println("\nEnd");
    });
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
    });
    ArduinoOTA.onError([](ota_error_t error) {
        Serial.printf("Error[%u]: ", error);
        if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
        else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
        else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
        else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
        else if (error == OTA_END_ERROR) Serial.println("End Failed");
    });
    ArduinoOTA.begin();

    // Setup HTTP Web Updater on /update
    httpUpdater.setup(&server, "/update");


    // --- API Endpoints ---
    server.on("/api/state", HTTP_GET, handleApiState);
    server.on("/api/config", HTTP_GET, handleApiConfig);
    server.on("/api/config/parameter", HTTP_POST, handleApiConfigParameter);
    server.on("/api/config/parameter", HTTP_OPTIONS, handleApiConfigParameter);

    // Serve the frontend explicitly because serveStatic has a bug with index.html
    server.on("/", HTTP_GET, []() {
        File file = LittleFS.open("/index.html", "r");
        if (!file) {
            server.send(500, "text/plain", "Failed to open index.html");
            return;
        }
        server.streamFile(file, "text/html");
        file.close();
    });

    server.serveStatic("/", LittleFS, "/");

    server.begin();
    Serial.println("HTTP server started");
}

void loop() {
    server.handleClient();
    ArduinoOTA.handle();
    
    if (!sensors.isWaterLevelOk()) {
        actuators.setPump(0, false);
        actuators.commit();
    } else {
        dosingPumps.update();
    }

    sensors.update();
    hydroControl.update(); // Run autonomous PID loop

    // Status LED blink
    static unsigned long lastBlink = 0;
    static bool ledState = false;
    if (millis() - lastBlink > 1000) {
        lastBlink = millis();
        ledState = !ledState;
        actuators.setDebugLed(ledState);
        actuators.commit();
    }
}
