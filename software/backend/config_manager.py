"""
Configuration Manager for Autonomous Dosing System

Manages user-defined parameters, target values, and automation settings.
Provides persistent storage for configuration.
"""

import json
import logging
from typing import Dict, Optional, Any
from pathlib import Path
from pydantic import BaseModel, Field, field_validator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ParameterConfig(BaseModel):
    """Configuration for a single parameter (pH, EC, etc.)"""
    target: float = Field(..., description="Target value to maintain")
    tolerance: float = Field(..., description="Acceptable deviation from target")
    enabled: bool = Field(default=False, description="Automation enabled")
    min_value: float = Field(..., description="Minimum safe value")
    max_value: float = Field(..., description="Maximum safe value")
    
    @field_validator('target', mode='after')
    @classmethod
    def validate_target(cls, v, info):
        """Ensure target is within safe bounds"""
        data = info.data
        if 'min_value' in data and 'max_value' in data:
            if not (data['min_value'] <= v <= data['max_value']):
                raise ValueError(f"Target {v} outside safe range [{data['min_value']}, {data['max_value']}]")
        return v


class SystemConfiguration(BaseModel):
    """Complete system configuration"""
    
    # Parameter configurations
    ph: ParameterConfig = Field(
        default=ParameterConfig(
            target=6.0,
            tolerance=0.2,
            enabled=False,
            min_value=4.0,
            max_value=8.0
        )
    )
    ec: ParameterConfig = Field(
        default=ParameterConfig(
            target=1.5,
            tolerance=0.1,
            enabled=False,
            min_value=0.5,
            max_value=3.0
        )
    )
    
    # PID tuning parameters (advanced)
    pid_tuning: Dict[str, Dict[str, float]] = Field(
        default={
            "ph": {"kp": 0.5, "ki": 0.1, "kd": 0.05},
            "ec": {"kp": 0.3, "ki": 0.05, "kd": 0.02}
        }
    )
    
    # Safety limits
    safety: Dict[str, Any] = Field(
        default={
            "max_ph_dose_ml": 50.0,
            "max_ec_dose_ml": 100.0,
            "min_dose_interval_sec": 300,
            "sensor_timeout_sec": 30
        }
    )
    
    # MQTT configuration
    mqtt: Dict[str, Any] = Field(
        default={
            "broker": "192.168.1.100",
            "port": 1883,
            "device_id": "hydro-misc-01"
        }
    )


class ConfigManager:
    """Manages configuration persistence and validation"""
    
    def __init__(self, config_path: str = "config.json"):
        self.config_path = Path(config_path)
        self.config: SystemConfiguration = self._load_config()
        
    def _load_config(self) -> SystemConfiguration:
        """Load configuration from file or create default"""
        if self.config_path.exists():
            try:
                with open(self.config_path, 'r') as f:
                    data = json.load(f)
                config = SystemConfiguration.model_validate(data)
                logger.info(f"Configuration loaded from {self.config_path}")
                return config
            except Exception as e:
                logger.error(f"Error loading config: {e}. Using defaults.")
                return SystemConfiguration()
        else:
            logger.info("No config file found. Using defaults.")
            config = SystemConfiguration()
            self.save_config(config)
            return config
    
    def save_config(self, config: Optional[SystemConfiguration] = None):
        """Save configuration to file"""
        if config:
            self.config = config
            
        try:
            with open(self.config_path, 'w') as f:
                json.dump(self.config.model_dump(), f, indent=2)
            logger.info(f"Configuration saved to {self.config_path}")
        except Exception as e:
            logger.error(f"Error saving config: {e}")
    
    def get_config(self) -> SystemConfiguration:
        """Get current configuration"""
        return self.config
    
    def update_parameter(self, param_name: str, updates: Dict) -> bool:
        """
        Update a specific parameter configuration
        
        Args:
            param_name: 'ph', 'ec', etc.
            updates: Dict with keys like 'target', 'tolerance', 'enabled'
            
        Returns:
            True if successful
        """
        try:
            if param_name == "ph":
                current = self.config.ph.model_dump()
                current.update(updates)
                self.config.ph = ParameterConfig(**current)
            elif param_name == "ec":
                current = self.config.ec.model_dump()
                current.update(updates)
                self.config.ec = ParameterConfig(**current)
            else:
                logger.warning(f"Unknown parameter: {param_name}")
                return False
                
            self.save_config()
            logger.info(f"Updated {param_name} configuration: {updates}")
            return True
        except Exception as e:
            logger.error(f"Error updating parameter {param_name}: {e}")
            return False
    
    def enable_automation(self, param_name: str, enabled: bool) -> bool:
        """Enable or disable automation for a parameter"""
        return self.update_parameter(param_name, {"enabled": enabled})
    
    def set_target(self, param_name: str, target: float, tolerance: Optional[float] = None) -> bool:
        """Set target value and optionally tolerance"""
        updates = {"target": target}
        if tolerance is not None:
            updates["tolerance"] = tolerance
        return self.update_parameter(param_name, updates)
    
    def get_targets(self) -> Dict[str, float]:
        """Get all target values"""
        return {
            "ph": self.config.ph.target,
            "ec": self.config.ec.target
        }
    
    def get_tolerances(self) -> Dict[str, float]:
        """Get all tolerance values"""
        return {
            "ph": self.config.ph.tolerance,
            "ec": self.config.ec.tolerance
        }
    
    def get_automation_status(self) -> Dict[str, bool]:
        """Get automation enabled status for all parameters"""
        return {
            "ph": self.config.ph.enabled,
            "ec": self.config.ec.enabled
        }
    
    def update_pid_tuning(self, param_name: str, kp: float, ki: float, kd: float) -> bool:
        """Update PID tuning parameters"""
        try:
            self.config.pid_tuning[param_name] = {"kp": kp, "ki": ki, "kd": kd}
            self.save_config()
            logger.info(f"Updated PID tuning for {param_name}: kp={kp}, ki={ki}, kd={kd}")
            return True
        except Exception as e:
            logger.error(f"Error updating PID tuning: {e}")
            return False
    
    def get_pid_tuning(self, param_name: str) -> Optional[Dict[str, float]]:
        """Get PID tuning parameters for a specific parameter"""
        return self.config.pid_tuning.get(param_name)
    
    def update_mqtt_config(self, broker: str, port: int, device_id: str) -> bool:
        """Update MQTT configuration"""
        try:
            self.config.mqtt = {
                "broker": broker,
                "port": port,
                "device_id": device_id
            }
            self.save_config()
            logger.info(f"Updated MQTT config: {broker}:{port}, device={device_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating MQTT config: {e}")
            return False
    
    def reset_to_defaults(self):
        """Reset configuration to factory defaults"""
        self.config = SystemConfiguration()
        self.save_config()
        logger.info("Configuration reset to defaults")


# Singleton instance
_config_manager: Optional[ConfigManager] = None

def get_config_manager() -> ConfigManager:
    """Get or create singleton ConfigManager instance"""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigManager()
    return _config_manager
