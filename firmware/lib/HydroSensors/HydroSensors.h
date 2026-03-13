#ifndef HYDRO_SENSORS_H
#define HYDRO_SENSORS_H

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>

class HydroSensors {
public:
    HydroSensors(uint8_t oneWirePin, uint8_t dhtPin, uint8_t waterLevelPin, uint8_t currentPin);
    
    void begin();
    void update(); // Should be called periodically in loop() to refresh non-blocking sensors

    // Getters for latest sensor readings
    float getWaterTemp();
    float getAirTemp();
    float getHumidity();
    float getCurrent();
    float getDO();
    
    // Returns true if water level is OK, false if LOW/Empty
    bool isWaterLevelOk();

private:
    uint8_t _oneWirePin;
    uint8_t _dhtPin;
    uint8_t _waterLevelPin;
    uint8_t _currentPin;

    OneWire _oneWire;
    DallasTemperature _ds18b20;
    DHT _dht;

    // Cached readings
    float _waterTemp;
    float _airTemp;
    float _humidity;
    float _current;
    float _do;
    
    unsigned long _lastDhtRead;
    unsigned long _lastDs18b20Read;

    void _readDHT();
    void _readDS18B20();
    void _readCurrent();
    void _readDO();
};

#endif // HYDRO_SENSORS_H
