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
// EC Probe on pH BNC #1 (EC probe plugged into second pH BNC connector)
#define PIN_SENSOR_EC 39

HydroActuators actuators(PIN_SR_DATA, PIN_SR_CLOCK, PIN_SR_LATCH, PIN_SR_CLEAR);
HydroDosingPumps dosingPumps(PIN_DOSING_A, PIN_DOSING_B, PIN_DOSING_PH, PIN_DOSING_AUX);
HydroSensors sensors(PIN_SENSOR_DS18B20, PIN_SENSOR_DHT, PIN_SENSOR_LEVEL, PIN_SENSOR_CURRENT, PIN_SENSOR_PH, PIN_SENSOR_EC);

HydroControl hydroControl(sensors, dosingPumps);
WebServer server(80);
HTTPUpdateServer httpUpdater;

void handleApiState() {
    StaticJsonDocument<512> doc;
    doc["ph"] = sensors.getPH();
    doc["ec"] = sensors.getEC();
    doc["water_temp"] = sensors.getWaterTemp();
    doc["air_temp"] = sensors.getAirTemp();
    doc["humidity"] = sensors.getHumidity();
    doc["power_current"] = sensors.getCurrent();
    doc["water_level"] = sensors.isWaterLevelOk() ? 100 : 0;
    
    // Pump statuses
    JsonArray pumps = doc.createNestedArray("pumps");
    for (int i=0; i<4; i++) {
        JsonObject pump = pumps.createNestedObject();
        pump["id"] = i;
        pump["speed"] = dosingPumps.getSpeed(i);
        pump["is_dosing"] = dosingPumps.isDosing(i);
    }

    String response;
    serializeJson(doc, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
}

void handleApiConfig() {
    // Stub for now, can implement config getting
    StaticJsonDocument<512> doc;
    doc["targets"]["ph"] = 6.0;
    doc["targets"]["ec"] = 1.5;
    doc["automation_enabled"]["ph"] = true;
    doc["automation_enabled"]["ec"] = false;

    String response;
    serializeJson(doc, response);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
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
