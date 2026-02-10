#ifndef HYDRO_ACTUATORS_H
#define HYDRO_ACTUATORS_H

#include <Arduino.h>

class HydroActuators {
public:
    HydroActuators(int dataPin, int clockPin, int latchPin, int clearPin);
    void begin();
    
    // Control individual actuators
    void setSolenoid(uint8_t index, bool state); // 0-7
    void setPump(uint8_t index, bool state);     // 0-5
    void setBigPump(bool state);
    void setDebugLed(bool state);
    
    // Commit changes to shift register
    void commit();
    
    // Direct actuator control
    void allOff();

private:
    int _dataPin;
    int _clockPin;
    int _latchPin;
    int _clearPin;
    
    uint16_t _registerState; // 16 bits for the shift register
    
    void _setBit(uint8_t bit, bool state);
};

#endif
