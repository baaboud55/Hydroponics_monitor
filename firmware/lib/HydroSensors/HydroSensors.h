#ifndef HYDRO_SENSORS_H
#define HYDRO_SENSORS_H

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <Preferences.h>

class HydroSensors {
public:
    HydroSensors(uint8_t oneWirePin, uint8_t dhtPin, uint8_t waterLevelPin, uint8_t currentPin, uint8_t phPin, uint8_t ecPin);
    
    void begin();
    void update(); // Should be called periodically in loop() to refresh non-blocking sensors

    // Getters for latest sensor readings
    float getWaterTemp();
    float getAirTemp();
    float getHumidity();
    float getCurrent();
    float getDO();
    float getPH();
    float getEC();
    
    // Returns true if water level is OK, false if LOW/Empty
    bool isWaterLevelOk();

    // Pass calibration commands to sensors
    void processCalibration(String sensor, String command);

private:
    uint8_t _oneWirePin;
    uint8_t _dhtPin;
    uint8_t _waterLevelPin;
    uint8_t _currentPin;
    uint8_t _phPin;
    uint8_t _ecPin;

    OneWire _oneWire;
    DallasTemperature _ds18b20;
    DHT _dht;
    Preferences _preferences;

    // Cached readings
    float _waterTemp;
    float _airTemp;
    float _humidity;
    float _current;
    float _do;
    float _ph;
    float _ec;
    
    // Calibration offsets
    float _phOffset;
    float _ecOffset;
    
    unsigned long _lastDhtRead;
    unsigned long _lastDs18b20Read;

    void _readDHT();
    void _readDS18B20();
    void _readCurrent();
    void _readDO();
    void _readPH();
    void _readEC();
};

#endif // HYDRO_SENSORS_H
