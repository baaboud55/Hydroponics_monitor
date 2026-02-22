"""
Autonomous Control Engine for Hydroponic System

This module implements PID-based control for automatic parameter maintenance.
Users set target values, and the system automatically doses to maintain them.
"""

import time
import logging
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PIDParameters:
    """PID tuning parameters"""
    kp: float  # Proportional gain
    ki: float  # Integral gain
    kd: float  # Derivative gain
    output_min: float = 0.0  # Minimum output
    output_max: float = 100.0  # Maximum output


class PIDController:
    """Generic PID Controller Implementation"""
    
    def __init__(self, params: PIDParameters, sample_time: float = 1.0):
        self.params = params
        self.sample_time = sample_time  # seconds
        
        # State variables
        self._last_error = 0.0
        self._integral = 0.0
        self._last_time = time.time()
        
    def compute(self, setpoint: float, current_value: float) -> float:
        """
        Compute PID output
        
        Args:
            setpoint: Target value
            current_value: Current measured value
            
        Returns:
            Control output (0-100 for pump speed percentage)
        """
        current_time = time.time()
        dt = current_time - self._last_time
        
        # Only compute if enough time has passed
        if dt < self.sample_time:
            return 0.0
            
        # Calculate error
        error = setpoint - current_value
        
        # Proportional term
        p_term = self.params.kp * error
        
        # Integral term (with anti-windup)
        self._integral += error * dt
        # Clamp integral to prevent windup
        max_integral = self.params.output_max / (self.params.ki if self.params.ki != 0 else 1)
        self._integral = max(-max_integral, min(max_integral, self._integral))
        i_term = self.params.ki * self._integral
        
        # Derivative term
        d_term = self.params.kd * (error - self._last_error) / dt if dt > 0 else 0.0
        
        # Compute output
        output = p_term + i_term + d_term
        
        # Clamp output
        output = max(self.params.output_min, min(self.params.output_max, output))
        
        # Update state
        self._last_error = error
        self._last_time = current_time
        
        logger.debug(f"PID: error={error:.3f}, P={p_term:.2f}, I={i_term:.2f}, D={d_term:.2f}, output={output:.2f}")
        
        return output
    
    def reset(self):
        """Reset PID state"""
        self._last_error = 0.0
        self._integral = 0.0
        self._last_time = time.time()


class SafetyManager:
    """Manages safety limits and validates dosing actions"""
    
    # Physical limits for sensors (reject invalid readings)
    PH_MIN = 0.0
    PH_MAX = 14.0
    EC_MIN = 0.0
    EC_MAX = 10.0  # mS/cm
    
    # Dosing limits
    MAX_PH_DOSE_ML = 50.0  # Max ml per interval
    MAX_EC_DOSE_ML = 100.0
    MIN_DOSE_INTERVAL = 300  # seconds (5 minutes)
    
    def __init__(self):
        self._last_ph_dose_time = datetime.min
        self._last_ec_dose_time = datetime.min
        
    def validate_sensor_reading(self, sensor_type: str, value: float) -> bool:
        """Check if sensor reading is within physical limits"""
        if sensor_type == "ph":
            return self.PH_MIN <= value <= self.PH_MAX
        elif sensor_type == "ec":
            return self.EC_MIN <= value <= self.EC_MAX
        return True
    
    def can_dose(self, parameter: str) -> Tuple[bool, str]:
        """
        Check if dosing is allowed based on time interval
        
        Returns:
            (allowed: bool, reason: str)
        """
        now = datetime.now()
        
        if parameter == "ph":
            time_since_last = (now - self._last_ph_dose_time).total_seconds()
            if time_since_last < self.MIN_DOSE_INTERVAL:
                wait_time = int(self.MIN_DOSE_INTERVAL - time_since_last)
                return False, f"pH dosing on cooldown ({wait_time}s remaining)"
            return True, "OK"
            
        elif parameter == "ec":
            time_since_last = (now - self._last_ec_dose_time).total_seconds()
            if time_since_last < self.MIN_DOSE_INTERVAL:
                wait_time = int(self.MIN_DOSE_INTERVAL - time_since_last)
                return False, f"EC dosing on cooldown ({wait_time}s remaining)"
            return True, "OK"
            
        return False, "Unknown parameter"
    
    def validate_dose(self, parameter: str, amount_ml: float) -> Tuple[bool, str]:
        """
        Validate if dose amount is within safety limits
        
        Returns:
            (allowed: bool, reason: str)
        """
        if parameter == "ph":
            if amount_ml > self.MAX_PH_DOSE_ML:
                return False, f"pH dose exceeds maximum ({self.MAX_PH_DOSE_ML}ml)"
            return True, "OK"
            
        elif parameter == "ec":
            if amount_ml > self.MAX_EC_DOSE_ML:
                return False, f"EC dose exceeds maximum ({self.MAX_EC_DOSE_ML}ml)"
            return True, "OK"
            
        return False, "Unknown parameter"
    
    def record_dose(self, parameter: str):
        """Record that a dose occurred"""
        now = datetime.now()
        if parameter == "ph":
            self._last_ph_dose_time = now
        elif parameter == "ec":
            self._last_ec_dose_time = now


class DosingEngine:
    """
    Main autonomous dosing engine
    Coordinates PID controllers and safety management
    """
    
    def __init__(self):
        # PID controllers with conservative initial tuning
        self.ph_controller = PIDController(
            PIDParameters(kp=0.5, ki=0.1, kd=0.05, output_min=0, output_max=100)
        )
        self.ec_controller = PIDController(
            PIDParameters(kp=0.3, ki=0.05, kd=0.02, output_min=0, output_max=100)
        )
        
        self.safety = SafetyManager()
        
        # Configuration (will be loaded from config_manager)
        self.targets = {
            "ph": 6.0,
            "ec": 1.5,
        }
        self.tolerances = {
            "ph": 0.2,
            "ec": 0.1,
        }
        self.automation_enabled = {
            "ph": False,
            "ec": False,
        }
        
        # Dosing history
        self.dosing_history = []
        
    def update_configuration(self, config: Dict):
        """Update target values and automation settings from user configuration"""
        if "targets" in config:
            self.targets.update(config["targets"])
        if "tolerances" in config:
            self.tolerances.update(config["tolerances"])
        if "automation_enabled" in config:
            self.automation_enabled.update(config["automation_enabled"])
            
        logger.info(f"Configuration updated: targets={self.targets}, enabled={self.automation_enabled}")
    
    def compute_dosing_action(self, sensor_data: Dict) -> Dict:
        """
        Main control loop - compute dosing actions based on current sensor readings
        
        Args:
            sensor_data: Dict with keys 'ph', 'ec', etc.
            
        Returns:
            Dict with dosing commands for each pump
        """
        actions = {
            "ph_dose": None,
            "ec_dose": None,
            "messages": []
        }
        
        # pH Control
        if self.automation_enabled.get("ph", False) and "ph" in sensor_data:
            ph_current = sensor_data["ph"]
            
            # Validate sensor reading
            if not self.safety.validate_sensor_reading("ph", ph_current):
                actions["messages"].append(f"Invalid pH reading: {ph_current}")
            else:
                # Check if value is outside tolerance
                ph_target = self.targets["ph"]
                ph_tolerance = self.tolerances["ph"]
                error = abs(ph_current - ph_target)
                
                if error > ph_tolerance:
                    # Compute PID output
                    output = self.ph_controller.compute(ph_target, ph_current)
                    
                    if output > 5:  # Only dose if output is significant (>5%)
                        # Check safety
                        can_dose, reason = self.safety.can_dose("ph")
                        if can_dose:
                            # Convert output percentage to dose amount (simplified)
                            # This should be calibrated based on pump flow rate and reservoir volume
                            dose_ml = (output / 100.0) * 10  # Example: scale to max 10ml
                            
                            valid, reason = self.safety.validate_dose("ph", dose_ml)
                            if valid:
                                actions["ph_dose"] = {
                                    "pump_index": 2,  # pH pump
                                    "amount_ml": dose_ml,
                                    "reason": f"pH={ph_current:.2f}, target={ph_target:.2f}"
                                }
                                self.safety.record_dose("ph")
                                self._log_dose("ph", dose_ml, ph_current, ph_target)
                            else:
                                actions["messages"].append(f"pH dose rejected: {reason}")
                        else:
                            actions["messages"].append(reason)
        
        # EC Control
        if self.automation_enabled.get("ec", False) and "ec" in sensor_data:
            ec_current = sensor_data["ec"]
            
            if not self.safety.validate_sensor_reading("ec", ec_current):
                actions["messages"].append(f"Invalid EC reading: {ec_current}")
            else:
                ec_target = self.targets["ec"]
                ec_tolerance = self.tolerances["ec"]
                error = abs(ec_current - ec_target)
                
                if error > ec_tolerance:
                    output = self.ec_controller.compute(ec_target, ec_current)
                    
                    if output > 5:
                        can_dose, reason = self.safety.can_dose("ec")
                        if can_dose:
                            dose_ml = (output / 100.0) * 20  # Example scaling
                            
                            valid, reason = self.safety.validate_dose("ec", dose_ml)
                            if valid:
                                # Choose pump A or B based on error direction
                                pump_index = 0 if ec_current < ec_target else 1
                                actions["ec_dose"] = {
                                    "pump_index": pump_index,
                                    "amount_ml": dose_ml,
                                    "reason": f"EC={ec_current:.2f}, target={ec_target:.2f}"
                                }
                                self.safety.record_dose("ec")
                                self._log_dose("ec", dose_ml, ec_current, ec_target)
                            else:
                                actions["messages"].append(f"EC dose rejected: {reason}")
                        else:
                            actions["messages"].append(reason)
        
        return actions
    
    def _log_dose(self, parameter: str, amount_ml: float, current: float, target: float):
        """Log dosing action to history"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "parameter": parameter,
            "amount_ml": amount_ml,
            "current_value": current,
            "target_value": target
        }
        self.dosing_history.append(entry)
        
        # Keep only last 100 entries
        if len(self.dosing_history) > 100:
            self.dosing_history = self.dosing_history[-100:]
            
        logger.info(f"Dosing: {parameter} {amount_ml:.1f}ml (current={current:.2f}, target={target:.2f})")
    
    def get_history(self, limit: int = 50) -> list:
        """Get recent dosing history"""
        return self.dosing_history[-limit:]
    
    def reset_controllers(self):
        """Reset all PID controllers (useful after manual intervention)"""
        self.ph_controller.reset()
        self.ec_controller.reset()
        logger.info("PID controllers reset")
