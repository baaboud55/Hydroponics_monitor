#ifndef HYDRO_CONTROL_H
#define HYDRO_CONTROL_H

#include <Arduino.h>
#include <HydroSensors.h>
#include <HydroDosingPumps.h>

struct PIDParameters {
    float kp;
    float ki;
    float kd;
    float output_min;
    float output_max;
};

class PIDController {
public:
    PIDController(PIDParameters params, float sample_time = 1.0);
    float compute(float setpoint, float current_value);
    void reset();

private:
    PIDParameters _params;
    float _sample_time;
    float _last_error;
    float _integral;
    unsigned long _last_time;
};

struct SafetyLimits {
    float max_ph_dose_ml;
    float max_ec_dose_ml;
    unsigned long min_dose_interval_sec;
};

class SafetyManager {
public:
    SafetyManager();
    void updateLimits(SafetyLimits limits);
    
    bool validateSensorReading(const char* type, float value);
    bool canDose(const char* parameter, String& reason);
    bool validateDose(const char* parameter, float amount_ml, String& reason);
    void recordDose(const char* parameter);

private:
    SafetyLimits _limits;
    unsigned long _last_ph_dose_time;
    unsigned long _last_ec_dose_time;
};

class HydroControl {
public:
    HydroControl(HydroSensors& sensors, HydroDosingPumps& pumps);
    
    void begin();
    void update(); // Call in main loop
    
    // Configuration
    void setPhTarget(float target, float tolerance);
    void setEcTarget(float target, float tolerance);
    void enableAutomation(bool ph_enabled, bool ec_enabled);
    
    // Manual
    void resetControllers();

private:
    HydroSensors& _sensors;
    HydroDosingPumps& _pumps;
    
    PIDController _ph_controller;
    PIDController _ec_controller;
    SafetyManager _safety;
    
    float _ph_target;
    float _ph_tolerance;
    bool _ph_enabled;
    
    float _ec_target;
    float _ec_tolerance;
    bool _ec_enabled;
    
    unsigned long _last_update;
};

#endif
