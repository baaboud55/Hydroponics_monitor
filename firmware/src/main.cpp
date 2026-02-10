#include <Arduino.h>
#include <WiFiManager.h> // https://github.com/tzapu/WiFiManager
#include <HydroActuators.h>
#include <HydroMQTT.h>

// Shift Register Pins
#define PIN_SR_DATA 26
#define PIN_SR_CLOCK 27
#define PIN_SR_LATCH 14
#define PIN_SR_CLEAR 12

// MQTT Settings (Hardcoded for now, should be dynamic later)
#define MQTT_SERVER "test.mosquitto.org"
#define MQTT_PORT 1883
#define DEVICE_ID "hydro-misc-01"

HydroActuators actuators(PIN_SR_DATA, PIN_SR_CLOCK, PIN_SR_LATCH, PIN_SR_CLEAR);
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
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\nHydroponic Automation System - Booting...");

  // Initialize Actuators
  actuators.begin();
  actuators.setDebugLed(true);
  actuators.commit();
  Serial.println("Actuators Initialized");

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
  }
}

void loop() {
  mqtt.loop();

  // Blink Debug LED to show activity
  static bool ledState = false;
  static unsigned long lastBlink = 0;
  
  if (millis() - lastBlink > 1000) {
      lastBlink = millis();
      ledState = !ledState;
      actuators.setDebugLed(ledState);
      actuators.commit();
      
      // Publish uptime
      if (mqtt.isConnected()) {
          mqtt.publishSensor("uptime", millis() / 1000.0);
          
          // Read and Publish Sensors (Raw values for now)
          // pH and EC
          mqtt.publishSensor("ph1_raw", analogRead(36));
          mqtt.publishSensor("ph2_raw", analogRead(39));
          mqtt.publishSensor("ec1_raw", analogRead(34));
          mqtt.publishSensor("ec2_raw", analogRead(33));
      }
  }
}
