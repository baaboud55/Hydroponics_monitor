#ifndef HYDRO_SENSORS_H
#define HYDRO_SENSORS_H

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <Preferences.h>

class HydroSensors {
public:
    HydroSensors(int ds18b20Pin, int dhtPin, int waterLevelPin, int currentPin, int phPin, int ecPin, int ecMGatePin = -1, int ecPGatePin = -1);
    
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
    int getWaterLevel();
    
    // Debug
    float getLastEcR() { return _lastEcR; }
    float getLastEcV() { return _lastEcV; }
    float getLastEcSum() { return _lastEcSum; }
    
    // Returns true if water level is OK, false if LOW/Empty
    bool isWaterLevelOk();

    // Pass calibration commands to sensors
    void processCalibration(String sensor, String command);

private:
    int _oneWirePin;
    int _dhtPin;
    int _waterLevelPin;
    int _currentPin;
    int _phPin;
    int _ecPin;
    int _ecMGatePin;
    int _ecPGatePin;

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
    
    // Calibration parameters
    float _phIntercept; // Voltage at pH 7.0
    float _phSlope;     // pH per Volt
    float _lastPhVoltage;

    float _ecIntercept; // Voltage in dry air
    float _ecSlope;     // mS/cm per Volt
    float _lastEcVoltage;
    
    // Debug variables
    float _lastEcR;
    float _lastEcV;
    float _lastEcSum;
    
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
