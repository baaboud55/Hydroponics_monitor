#include "HydroMQTT.h"

HydroMQTT::HydroMQTT(Client& netClient, const char* server, int port, const char* deviceId) {
    _client.setClient(netClient);
    _server = server;
    _port = port;
    _deviceId = deviceId;
}

void HydroMQTT::begin() {
    _client.setServer(_server, _port);
    // Callback should be set by main app
}

void HydroMQTT::setCallback(MQTT_CALLBACK_SIGNATURE) {
    _client.setCallback(callback);
}

void HydroMQTT::loop() {
    if (!_client.connected()) {
        reconnect();
    }
    _client.loop();
}

bool HydroMQTT::isConnected() {
    return _client.connected();
}

void HydroMQTT::reconnect() {
    static unsigned long lastReconnectAttempt = 0;
    unsigned long now = millis();
    
    if (now - lastReconnectAttempt > 5000) {
        lastReconnectAttempt = now;
        Serial.print("Attempting MQTT connection...");
        
        // Create a random client ID or use deviceId
        String clientId = String(_deviceId);
        
        if (_client.connect(clientId.c_str())) {
            Serial.println("connected");
            // Subscribe to control topics
            // Topic: hydro/<deviceId>/control/#
            String subscriptionTopic = String("hydro/") + _deviceId + "/control/#";
            _client.subscribe(subscriptionTopic.c_str());
            Serial.print("Subscribed to: ");
            Serial.println(subscriptionTopic);
        } else {
            Serial.print("failed, rc=");
            Serial.print(_client.state());
            Serial.println(" try again in 5 seconds");
        }
    }
}

void HydroMQTT::publishSensor(const char* sensorName, float value) {
    if (!_client.connected()) return;
    
    // Topic: hydro/status/<deviceId>/<sensorName>
    String topic = String("hydro/status/") + _deviceId + "/" + sensorName;
    String payload = String(value, 2);
    
    _client.publish(topic.c_str(), payload.c_str());
}

void HydroMQTT::publishState(const char* attribute, const char* state) {
     if (!_client.connected()) return;
     
     String topic = String("hydro/status/") + _deviceId + "/" + attribute;
     _client.publish(topic.c_str(), state);
}

void HydroMQTT::sendDiscovery(const char* component, const char* sensorId, const char* friendlyName, const char* unit, const char* deviceClass) {
    // Topic: homeassistant/<component>/<deviceId>/<sensorId>/config
    // Payload: JSON
    if (!_client.connected()) return;

    DynamicJsonDocument doc(1024);
    
    String uniqueId = String(_deviceId) + "_" + sensorId;
    String stateTopic = String("hydro/status/") + _deviceId + "/" + sensorId;

    doc["name"] = friendlyName;
    doc["uniq_id"] = uniqueId;
    doc["stat_t"] = stateTopic;
    if (unit) doc["unit_of_meas"] = unit;
    if (deviceClass) doc["dev_cla"] = deviceClass;
    
    // Device Info
    JsonObject device = doc.createNestedObject("dev");
    device["ids"] = _deviceId;
    device["name"] = "HydroMisc Controller";
    device["mf"] = "Antigravity";
    device["mdl"] = "ESP32-Hydro";

    String topic = String("homeassistant/") + component + "/" + _deviceId + "/" + sensorId + "/config";
    
    String payload;
    serializeJson(doc, payload);
    
    _client.publish(topic.c_str(), payload.c_str(), true); // Retain is important for discovery
}
