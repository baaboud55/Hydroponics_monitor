#include "HydroDosingPumps.h"

HydroDosingPumps::HydroDosingPumps(int pinA, int pinB, int pinPH, int pinAux) {
    _pins[0] = pinA;
    _pins[1] = pinB;
    _pins[2] = pinPH;
    _pins[3] = pinAux;
    
    // LEDC channels 0-3 (channels 4-7 are used by shift register if needed)
    _channels[0] = 0;
    _channels[1] = 1;
    _channels[2] = 2;
    _channels[3] = 3;
    
    // Initialize speeds and timers
    for (int i = 0; i < 4; i++) {
        _speeds[i] = 0;
        _doseEndTime[i] = 0;
    }
}

void HydroDosingPumps::begin() {
    // Configure LEDC channels
    for (int i = 0; i < 4; i++) {
        ledcSetup(_channels[i], PWM_FREQ, PWM_RESOLUTION);
        ledcAttachPin(_pins[i], _channels[i]);
        ledcWrite(_channels[i], 0); // Start with pumps off
    }
    
    Serial.println("Dosing Pumps Initialized");
}

void HydroDosingPumps::setSpeed(uint8_t index, uint8_t speed) {
    if (index > 3) return;
    if (speed > 100) speed = 100;
    
    _speeds[index] = speed;
    _doseEndTime[index] = 0; // Cancel any active dosing
    
    // Convert 0-100% to 0-255 duty cycle
    uint8_t dutyCycle = (speed * 255) / 100;
    _setPWM(index, dutyCycle);
    
    Serial.printf("Dosing Pump %d speed set to %d%%\n", index, speed);
}

void HydroDosingPumps::dose(uint8_t index, unsigned long duration) {
    if (index > 3) return;
    if (duration == 0) return;
    
    // Set to 100% speed
    _speeds[index] = 100;
    _setPWM(index, 255);
    
    // Set end time
    _doseEndTime[index] = millis() + duration;
    
    Serial.printf("Dosing Pump %d: dosing for %lu ms\n", index, duration);
}

void HydroDosingPumps::stop(uint8_t index) {
    if (index > 3) return;
    
    _speeds[index] = 0;
    _doseEndTime[index] = 0;
    _setPWM(index, 0);
    
    Serial.printf("Dosing Pump %d stopped\n", index);
}

void HydroDosingPumps::stopAll() {
    for (int i = 0; i < 4; i++) {
        stop(i);
    }
    Serial.println("All dosing pumps stopped");
}

void HydroDosingPumps::update() {
    unsigned long now = millis();
    
    // Check if any timed dosing has completed
    for (int i = 0; i < 4; i++) {
        if (_doseEndTime[i] > 0 && now >= _doseEndTime[i]) {
            stop(i);
            Serial.printf("Dosing Pump %d: dose complete\n", i);
        }
    }
}

uint8_t HydroDosingPumps::getSpeed(uint8_t index) {
    if (index > 3) return 0;
    return _speeds[index];
}

bool HydroDosingPumps::isDosing(uint8_t index) {
    if (index > 3) return false;
    return (_doseEndTime[index] > 0 && millis() < _doseEndTime[index]);
}

void HydroDosingPumps::_setPWM(uint8_t index, uint8_t dutyCycle) {
    if (index > 3) return;
    ledcWrite(_channels[index], dutyCycle);
}
