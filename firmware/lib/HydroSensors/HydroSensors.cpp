#include "HydroSensors.h"

// Read intervals to avoid blocking the main loop
#define DHT_READ_INTERVAL_MS 2000
#define DS18B20_READ_INTERVAL_MS 1000

// Specify DHT Type
#define DHTTYPE DHT21 // AM2301 is compatible with DHT21

HydroSensors::HydroSensors(uint8_t oneWirePin, uint8_t dhtPin, uint8_t waterLevelPin, uint8_t currentPin, uint8_t phPin, uint8_t ecPin)
    : _oneWirePin(oneWirePin), 
      _dhtPin(dhtPin), 
      _waterLevelPin(waterLevelPin), 
      _currentPin(currentPin),
      _phPin(phPin),
      _ecPin(ecPin),
      _oneWire(oneWirePin),
      _ds18b20(&_oneWire),
      _dht(dhtPin, DHTTYPE) 
{
    _waterTemp = 0.0;
    _airTemp = 0.0;
    _humidity = 0.0;
    _current = 0.0;
    _do = 0.0;
    _ph = 7.0; // Default safe ph
    _ec = 1.0; // Default safe ec
    _phOffset = 0.0;
    _ecOffset = 0.0;
    _lastDhtRead = 0;
    _lastDs18b20Read = 0;
}

void HydroSensors::begin() {
    // Load saved calibration values
    _preferences.begin("hydro_cal", false);
    _phOffset = _preferences.getFloat("ph_offset", 0.0);
    _ecOffset = _preferences.getFloat("ec_offset", 0.0);

    // Initialize DS18B20
    _ds18b20.begin();
    // Don't wait for conversion to avoid blocking
    _ds18b20.setWaitForConversion(false); 

    // Initialize DHT
    _dht.begin();

    // Initialize Water Level Float Switch (using internal pull-up)
    // HIGH = Water level OK, LOW = Empty/Critical
    pinMode(_waterLevelPin, INPUT_PULLUP);

    pinMode(_currentPin, INPUT);
    // Note: analogReadResolution() and attenuation are set globally or left to ESP32 defaults (12-bit)

    // Init pH and EC pins
    pinMode(_phPin, INPUT);
    pinMode(_ecPin, INPUT);

    // Initialize DO Sensor Serial (Serial2) on dig_0 pins (RX=16, TX=17)
    // Adjust baud rate (e.g. 9600) matching your specific DO sensor
    Serial2.begin(9600, SERIAL_8N1, 16, 17);

    // Initial reads
    _ds18b20.requestTemperatures();
}

void HydroSensors::update() {
    unsigned long currentMillis = millis();

    // Non-blocking DS18B20 update
    // Request temperature, wait interval, read it, then request again
    if (currentMillis - _lastDs18b20Read >= DS18B20_READ_INTERVAL_MS) {
        _readDS18B20();
        _ds18b20.requestTemperatures(); // Trigger next conversion
        _lastDs18b20Read = currentMillis;
    }

    // Non-blocking DHT update
    if (currentMillis - _lastDhtRead >= DHT_READ_INTERVAL_MS) {
        _readDHT();
        _lastDhtRead = currentMillis;
    }

    // Update current (can be read fast/frequently, but we'll read it every update cycle)
    _readCurrent();

    // Read analog pH and EC
    _readPH();
    _readEC();

    // Read DO from Serial if available
    _readDO();
}

void HydroSensors::_readDHT() {
    float h = _dht.readHumidity();
    float t = _dht.readTemperature();

    // Check if any reads failed and exit early (to keep previous known good values)
    if (isnan(h) || isnan(t)) {
        Serial.println(F("Failed to read from DHT sensor!"));
        return;
    }

    _humidity = h;
    _airTemp = t;
}

void HydroSensors::_readDS18B20() {
    // We assume requestTemperatures() was called previously
    float t = _ds18b20.getTempCByIndex(0);
    
    // -127 is the error value returned by DallasTemperature
    if (t != DEVICE_DISCONNECTED_C) {
        _waterTemp = t;
    } else {
        Serial.println(F("Failed to read from DS18B20 sensor!"));
    }
}

void HydroSensors::_readCurrent() {
    // Example logic for generic analog current sensor (e.g., ACS712 or generic CT sensor)
    // This formula will need calibration based on the specific sensor hardware!
    
    const int adc_bits = 4095;
    const float max_voltage = 3.3;
    
    int rawVal = analogRead(_currentPin);
    float voltage = (rawVal / (float)adc_bits) * max_voltage;
    
    // Very naive mapping for ACS712 5A (approx 185mV/A, 1.65V zero point if shifting)
    // You should tune this scaling factor based on real-world measurements with a multimeter.
    // For now, we return a rough approximation or just the raw voltage mapped to some amps.
    // Assuming simple linear mapping 0-3.3V -> 0-10A for example purposes
    float amps = (voltage / max_voltage) * 10.0; 
    
    // Simple EWMA (Exponential Weighted Moving Average) filter to smooth readings
    _current = (0.1 * amps) + (0.9 * _current); 
}

void HydroSensors::_readDO() {
    // Read from UART/Serial2 if data is available (e.g., from Atlas Scientific DO sensor)
    if (Serial2.available() > 0) {
        String data = Serial2.readStringUntil('\r');
        if (data.length() > 0) {
           float doValue = data.toFloat();
           if (doValue > 0) {
               _do = doValue;
           }
        }
    }
}

void HydroSensors::_readPH() {
    // Read raw analog value (0-4095)
    int rawVal = analogRead(_phPin);
    
    // y = mx + b
    // For a typical ESP32 3.3V ADC and standard industrial pH probe:
    // Voltage goes down as pH goes up. A rough slope is -5.7.
    // Assuming 1.65V = pH 7, 4095 = 3.3V
    float voltage = (rawVal / 4095.0) * 3.3;
    float uncalibrated_ph = 7.0 + (voltage - 1.65) * -5.7; 
    
    // Apply user calibration offset
    float calculated_ph = uncalibrated_ph + _phOffset;
    
    // EWMA Smoothing
    _ph = (0.1 * calculated_ph) + (0.9 * _ph);
}

void HydroSensors::_readEC() {
    // Read raw analog value (0-4095)
    int rawVal = analogRead(_ecPin);
    
    // y = mx + b
    // Rough estimation for EC mapping an analog voltage.
    float voltage = (rawVal / 4095.0) * 3.3;
    float uncalibrated_ec = voltage * 1.5; // Dummy slope (e.g. 1V = 1.5 mS/cm)
    
    // Apply user calibration offset
    float calculated_ec = uncalibrated_ec + _ecOffset;
    
    // EWMA Smoothing
    _ec = (0.1 * calculated_ec) + (0.9 * _ec);
}

float HydroSensors::getWaterTemp() {
    return _waterTemp;
}

float HydroSensors::getAirTemp() {
    return _airTemp;
}

float HydroSensors::getHumidity() {
    return _humidity;
}

float HydroSensors::getCurrent() {
    return _current;
}

float HydroSensors::getDO() {
    return _do;
}

float HydroSensors::getPH() {
    return _ph;
}

float HydroSensors::getEC() {
    return _ec;
}

bool HydroSensors::isWaterLevelOk() {
    // Assuming normally open float switch connected between Pin and GND.
    // With INPUT_PULLUP: Switch OPEN (water OK) -> HIGH. Switch CLOSED (water empty) -> LOW.
    // Adjust logic here if switch acts inversely.
    return digitalRead(_waterLevelPin) == HIGH;
}

void HydroSensors::processCalibration(String sensor, String command) {
    if (sensor == "do") {
        // DO sensor uses UART directly
        Serial2.print(command);
        Serial2.print('\r');
        Serial.printf("Sent to DO UART: %s\\n", command.c_str());
    } else if (sensor == "ph") {
        if (command.startsWith("cal,7,")) {
            // Wait, the frontend might not append the reading properly if it simulates.
            // Let's rely entirely on the firmware's internal reading when we get "cal,7"
        }
        
        if (command == "cal,7") {
            // We want the final _ph to equal 7.0.
            // _ph = uncalibrated_ph + _phOffset. 
            // So _phOffset = 7.0 - uncalibrated_ph
            // Uncalibrated pH is our current reading minus the old offset
            float uncalibrated_ph = _ph - _phOffset;
            _phOffset = 7.0 - uncalibrated_ph;
            _preferences.putFloat("ph_offset", _phOffset);
        } else if (command == "cal,clear") {
            _phOffset = 0.0;
            _preferences.putFloat("ph_offset", _phOffset);
        }
        Serial.printf("Updated pH offset: %.2f\\n", _phOffset);
    } else if (sensor == "ec") {
        if (command == "cal,custom") {
            // Example EC calibration if needed
        } else if (command == "cal,clear") {
            _ecOffset = 0.0;
            _preferences.putFloat("ec_offset", _ecOffset);
        }
        Serial.printf("Updated EC offset: %.2f\\n", _ecOffset);
    }
}
