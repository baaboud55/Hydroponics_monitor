#include "HydroControl.h"

// --- PID Controller ---
PIDController::PIDController(PIDParameters params, float sample_time)
    : _params(params), _sample_time(sample_time), _last_error(0.0), _integral(0.0) {
    _last_time = millis();
}

float PIDController::compute(float setpoint, float current_value) {
    unsigned long current_time = millis();
    float dt = (current_time - _last_time) / 1000.0; // Seconds
    
    if (dt < _sample_time) {
        return 0.0;
    }
    
    float error = setpoint - current_value;
    
    float p_term = _params.kp * error;
    
    _integral += error * dt;
    float max_integral = _params.output_max / (_params.ki != 0 ? _params.ki : 1);
    if (_integral > max_integral) _integral = max_integral;
    if (_integral < -max_integral) _integral = -max_integral;
    float i_term = _params.ki * _integral;
    
    float d_term = 0.0;
    if (dt > 0) {
        d_term = _params.kd * (error - _last_error) / dt;
    }
    
    float output = p_term + i_term + d_term;
    if (output > _params.output_max) output = _params.output_max;
    if (output < _params.output_min) output = _params.output_min;
    
    _last_error = error;
    _last_time = current_time;
    
    return output;
}

void PIDController::reset() {
    _last_error = 0.0;
    _integral = 0.0;
    _last_time = millis();
}

// --- Safety Manager ---
SafetyManager::SafetyManager() {
    _limits.max_ph_dose_ml = 50.0;
    _limits.max_ec_dose_ml = 100.0;
    _limits.min_dose_interval_sec = 300;
    _last_ph_dose_time = 0;
    _last_ec_dose_time = 0;
}

void SafetyManager::updateLimits(SafetyLimits limits) {
    _limits = limits;
}

bool SafetyManager::validateSensorReading(const char* type, float value) {
    if (strcmp(type, "ph") == 0) return value >= 0.0 && value <= 14.0;
    if (strcmp(type, "ec") == 0) return value >= 0.0 && value <= 10.0;
    return true;
}

bool SafetyManager::canDose(const char* parameter, String& reason) {
    unsigned long now = millis();
    unsigned long interval_ms = _limits.min_dose_interval_sec * 1000;
    
    if (strcmp(parameter, "ph") == 0) {
        if (_last_ph_dose_time > 0 && (now - _last_ph_dose_time) < interval_ms) {
            reason = "pH dosing on cooldown";
            return false;
        }
        return true;
    } else if (strcmp(parameter, "ec") == 0) {
        if (_last_ec_dose_time > 0 && (now - _last_ec_dose_time) < interval_ms) {
            reason = "EC dosing on cooldown";
            return false;
        }
        return true;
    }
    reason = "Unknown parameter";
    return false;
}

bool SafetyManager::validateDose(const char* parameter, float amount_ml, String& reason) {
    if (strcmp(parameter, "ph") == 0) {
        if (amount_ml > _limits.max_ph_dose_ml) {
            reason = "pH dose exceeds maximum";
            return false;
        }
        return true;
    } else if (strcmp(parameter, "ec") == 0) {
        if (amount_ml > _limits.max_ec_dose_ml) {
            reason = "EC dose exceeds maximum";
            return false;
        }
        return true;
    }
    reason = "Unknown parameter";
    return false;
}

void SafetyManager::recordDose(const char* parameter) {
    if (strcmp(parameter, "ph") == 0) {
        _last_ph_dose_time = millis();
    } else if (strcmp(parameter, "ec") == 0) {
        _last_ec_dose_time = millis();
    }
}

// --- Hydro Control ---
HydroControl::HydroControl(HydroSensors& sensors, HydroDosingPumps& pumps)
    : _sensors(sensors), _pumps(pumps),
      _ph_controller({0.5, 0.1, 0.05, 0.0, 100.0}, 1.0),
      _ec_controller({0.3, 0.05, 0.02, 0.0, 100.0}, 1.0) {
    _ph_target = 6.0;
    _ph_tolerance = 0.2;
    _ph_enabled = false;
    
    _ec_target = 1.5;
    _ec_tolerance = 0.1;
    _ec_enabled = false;
    
    _last_update = 0;
}

void HydroControl::begin() {
    Serial.println("HydroControl initialized.");
}

void HydroControl::setPhTarget(float target, float tolerance) {
    _ph_target = target;
    _ph_tolerance = tolerance;
}

void HydroControl::setEcTarget(float target, float tolerance) {
    _ec_target = target;
    _ec_tolerance = tolerance;
}

void HydroControl::enableAutomation(bool ph_enabled, bool ec_enabled) {
    _ph_enabled = ph_enabled;
    _ec_enabled = ec_enabled;
}

void HydroControl::resetControllers() {
    _ph_controller.reset();
    _ec_controller.reset();
}

void HydroControl::update() {
    unsigned long now = millis();
    if (now - _last_update < 5000) return; // Run every 5 seconds
    _last_update = now;
    
    String reason;
    
    // pH Control
    if (_ph_enabled) {
        float ph_current = _sensors.getPH();
        if (_safety.validateSensorReading("ph", ph_current)) {
            float error = abs(ph_current - _ph_target);
            if (error > _ph_tolerance) {
                float output = _ph_controller.compute(_ph_target, ph_current);
                if (output > 5.0) {
                    if (_safety.canDose("ph", reason)) {
                        float dose_ml = (output / 100.0) * 10.0; // scale to 10ml max per cycle
                        if (_safety.validateDose("ph", dose_ml, reason)) {
                            // Convert dose_ml to milliseconds (assuming 1ml/sec for example)
                            unsigned long duration_ms = (unsigned long)(dose_ml * 1000.0);
                            Serial.printf("Dosing %f ml for pH\n", dose_ml);
                            _pumps.dose(2, duration_ms); // pH pump is index 2
                            _safety.recordDose("ph");
                        } else {
                            Serial.println("pH dose rejected: " + reason);
                        }
                    }
                }
            }
        }
    }
    
    // EC Control
    if (_ec_enabled) {
        float ec_current = _sensors.getEC();
        if (_safety.validateSensorReading("ec", ec_current)) {
            float error = abs(ec_current - _ec_target);
            if (error > _ec_tolerance) {
                float output = _ec_controller.compute(_ec_target, ec_current);
                if (output > 5.0) {
                    if (_safety.canDose("ec", reason)) {
                        float dose_ml = (output / 100.0) * 20.0;
                        if (_safety.validateDose("ec", dose_ml, reason)) {
                            unsigned long duration_ms = (unsigned long)(dose_ml * 1000.0);
                            uint8_t pump_idx = (ec_current < _ec_target) ? 0 : 1; // Nutrient A or B
                            Serial.printf("Dosing %f ml for EC on pump %d\n", dose_ml, pump_idx);
                            _pumps.dose(pump_idx, duration_ms);
                            _safety.recordDose("ec");
                        } else {
                            Serial.println("EC dose rejected: " + reason);
                        }
                    }
                }
            }
        }
    }
}
