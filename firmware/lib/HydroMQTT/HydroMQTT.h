#ifndef HYDRO_MQTT_H
#define HYDRO_MQTT_H

#include <Arduino.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

class HydroMQTT {
public:
    HydroMQTT(Client& netClient, const char* server, int port, const char* deviceId);
    
    void begin();
    void loop();
    bool isConnected();
    
    // Publishing
    void publishSensor(const char* sensorName, float value);
    void publishState(const char* attribute, const char* state);
    
    // Discovery (Home Assistant)
    void sendDiscovery(const char* component, const char* sensorId, const char* friendlyName, const char* unit, const char* deviceClass);

    // Callbacks
    void setCallback(MQTT_CALLBACK_SIGNATURE);

private:
   PubSubClient _client;
   const char* _server;
   int _port;
   const char* _deviceId;
   
   void reconnect();
};

#endif
