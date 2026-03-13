#include <Arduino.h>
#include <WiFiManager.h> // https://github.com/tzapu/WiFiManager
#include <HydroActuators.h>
#include <HydroMQTT.h>
#include <HydroDosingPumps.h>
#include <HydroSensors.h>

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

#define PIN_SENSOR_DS18B20 4
#define PIN_SENSOR_DHT 5
#define PIN_SENSOR_LEVEL 32
#define PIN_SENSOR_CURRENT 35
#define PIN_SENSOR_PH 36
#define PIN_SENSOR_EC 39

// MQTT Settings (Hardcoded for now, should be dynamic later)
#define MQTT_SERVER "test.mosquitto.org"
#define MQTT_PORT 1883
#define DEVICE_ID "hydro-misc-01"

HydroActuators actuators(PIN_SR_DATA, PIN_SR_CLOCK, PIN_SR_LATCH, PIN_SR_CLEAR);
HydroDosingPumps dosingPumps(PIN_DOSING_A, PIN_DOSING_B, PIN_DOSING_PH, PIN_DOSING_AUX);
HydroSensors sensors(PIN_SENSOR_DS18B20, PIN_SENSOR_DHT, PIN_SENSOR_LEVEL, PIN_SENSOR_CURRENT, PIN_SENSOR_PH, PIN_SENSOR_EC);
WiFiClient espClient;
HydroMQTT mqtt(espClient, MQTT_SERVER, MQTT_PORT, DEVICE_ID);

// Callback for incoming MQTT messages
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  String payloadStr = "";
  for (unsigned int i = 0; i < length; i++) {
    payloadStr += (char)payload[i];
  }
  
  Serial.print("Message arrived [");
  Serial.print(topicStr);
  Serial.print("] ");
  Serial.println(payloadStr);

  // Topic format: hydro/<device>/control/<type>/<index>
  // Example: hydro/hydro-misc-01/control/solenoid/0
  
  // Basic parsing (this can be improved)
  if (topicStr.indexOf("/control/solenoid/") > 0) {
      int lastSlash = topicStr.lastIndexOf('/');
      String indexStr = topicStr.substring(lastSlash + 1);
      int index = indexStr.toInt();
      bool state = (payloadStr == "1" || payloadStr == "ON" || payloadStr == "true");
      
      actuators.setSolenoid(index, state);
      actuators.commit();
      Serial.printf("Set Solenoid %d to %d\n", index, state);
  }
  else if (topicStr.indexOf("/control/pump/") > 0) {
      int lastSlash = topicStr.lastIndexOf('/');
      String indexStr = topicStr.substring(lastSlash + 1);
      int index = indexStr.toInt();
      bool state = (payloadStr == "1" || payloadStr == "ON" || payloadStr == "true");
      
      actuators.setPump(index, state);
      actuators.commit();
      Serial.printf("Set Pump %d to %d\n", index, state);
  }
  else if (topicStr.indexOf("/control/debug") > 0) {
       bool state = (payloadStr == "1" || payloadStr == "ON" || payloadStr == "true");
       actuators.setDebugLed(state);
       actuators.commit();
  }
  // Dosing pump control: hydro/hydro-misc-01/control/dosing/0/speed or /dose
  else if (topicStr.indexOf("/control/dosing/") > 0) {
      // Extract pump index
      int dosingIdx = topicStr.indexOf("/control/dosing/");
      String afterDosing = topicStr.substring(dosingIdx + 16); // "/control/dosing/" = 16 chars
      int slashPos = afterDosing.indexOf('/');
      int pumpIndex = afterDosing.substring(0, slashPos).toInt();
      String command = afterDosing.substring(slashPos + 1);
      
      if (command == "speed") {
          int speed = payloadStr.toInt();
          dosingPumps.setSpeed(pumpIndex, speed);
      }
      else if (command == "dose") {
          unsigned long duration = payloadStr.toInt();
          dosingPumps.dose(pumpIndex, duration);
      }
  }
  else if (topicStr.indexOf("/control/calibrate/") > 0) {
      int lastSlash = topicStr.lastIndexOf('/');
      String sensor = topicStr.substring(lastSlash + 1);
      
      sensors.processCalibration(sensor, payloadStr);
      Serial.printf("Received Calibration command for %s: %s\n", sensor.c_str(), payloadStr.c_str());
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\nHydroponic Automation System - Booting...");

  // Initialize Actuators
  actuators.begin();
  actuators.setDebugLed(true);
  actuators.commit();
  Serial.println("Actuators Initialized");
  
  // Initialize Dosing Pumps
  dosingPumps.begin();

  // Initialize Sensors
  sensors.begin();
  Serial.println("Sensors Initialized");

  WiFiManager wm;
  
  // wm.resetSettings(); // Uncomment to wipe settings for testing

  // Automatically connect using saved credentials,
  // if connection fails, it starts an access point with the specified name
  bool res = wm.autoConnect("HydroMisc-Setup", "password"); // AP Name, AP Password

  if(!res) {
      Serial.println("Failed to connect");
      // ESP.restart();
  } 
  else {
      //if you get here you have connected to the WiFi    
      Serial.println("connected...yeey :)");
      Serial.print("IP Address: ");
      Serial.println(WiFi.localIP());

      // Start MQTT
      mqtt.setCallback(mqttCallback); // Register callback
      mqtt.begin();
      // Send Discovery
      mqtt.sendDiscovery("sensor", "uptime", "Uptime", "s", "duration");
      mqtt.sendDiscovery("sensor", "do", "Dissolved Oxygen", "mg/L", "concentration");
      mqtt.sendDiscovery("sensor", "ph", "pH Level", "pH", "");
      mqtt.sendDiscovery("sensor", "ec", "Electrical Conductivity", "mS/cm", "conductivity");
  }
}

void loop() {
  mqtt.loop();
  
  // Safe Water Level Check
  if (!sensors.isWaterLevelOk()) {
      // Emergency Cutoff: Ensure circulating pumps and dosing stop if tank is empty
      // Example targets pump 0 (main pump) — expanding later
      actuators.setPump(0, false);
      actuators.commit();
      
      // We could also force dosingPumps to halt here if it had a hard stop method
      // For now, logging will show it's dry.
  } else {
      dosingPumps.update(); // Handle timed dosing normally
  }

  // Update Non-blocking sensors
  sensors.update();

  // Blink Debug LED to show activity
  static bool ledState = false;
  static unsigned long lastBlink = 0;
  
  if (millis() - lastBlink > 1000) {
      lastBlink = millis();
      ledState = !ledState;
      actuators.setDebugLed(ledState);
      actuators.commit();
      
      // Publish uptime and real sensors
      if (mqtt.isConnected()) {
          mqtt.publishSensor("uptime", millis() / 1000.0);
          
          mqtt.publishSensor("water_temp", sensors.getWaterTemp());
          mqtt.publishSensor("air_temp", sensors.getAirTemp());
          mqtt.publishSensor("humidity", sensors.getHumidity());
          mqtt.publishSensor("power_current", sensors.getCurrent());
          mqtt.publishSensor("do", sensors.getDO());
          mqtt.publishSensor("ph", sensors.getPH());
          mqtt.publishSensor("ec", sensors.getEC());
          
          // Publish Water Level (float switch maps to 100% or 0% for the UI)
          mqtt.publishSensor("water_level", sensors.isWaterLevelOk() ? 100.0 : 0.0);
          
          // Publish Dosing Pump Status (Speed percent)
          for (int i = 0; i < 4; i++) {
              String pumpName = "dosing" + String(i) + "_speed";
              mqtt.publishSensor(pumpName.c_str(), dosingPumps.getSpeed(i));
          }

          // Safety alert via MQTT if critical
          if (!sensors.isWaterLevelOk()) {
             mqtt.publishState("alert", "WATER_LEVEL_CRITICAL");
          }
      }
  }
}
