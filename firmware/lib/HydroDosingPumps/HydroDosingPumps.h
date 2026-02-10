#ifndef HYDRO_DOSING_PUMPS_H
#define HYDRO_DOSING_PUMPS_H

#include <Arduino.h>

class HydroDosingPumps {
public:
    HydroDosingPumps(int pinA, int pinB, int pinPH, int pinAux);
    void begin();
    
    // Continuous speed control (0-100%)
    void setSpeed(uint8_t index, uint8_t speed);
    
    // Timed dosing - run pump for duration (milliseconds)
    void dose(uint8_t index, unsigned long duration);
    
    // Stop specific pump
    void stop(uint8_t index);
    
    // Emergency stop all pumps
    void stopAll();
    
    // Update - call in loop() for timed dosing
    void update();
    
    // Get current speed (0-100%)
    uint8_t getSpeed(uint8_t index);
    
    // Check if pump is currently dosing
    bool isDosing(uint8_t index);

private:
    int _pins[4];
    uint8_t _channels[4];
    uint8_t _speeds[4];
    unsigned long _doseEndTime[4];
    
    void _setPWM(uint8_t index, uint8_t dutyCycle);
    
    static const int PWM_FREQ = 1000;      // 1 kHz
    static const int PWM_RESOLUTION = 8;   // 8-bit (0-255)
};

#endif
