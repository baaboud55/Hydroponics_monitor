# Hydromisc Pinout Reference

## Analog Inputs (Sensors)
- **pH Probe 1**: GPIO 36 (ADC1_CH0)
- **pH Probe 2**: GPIO 39 (ADC1_CH3)
- **EC Probe 1**: GPIO 34 (ADC1_CH6)
- **EC Probe 2**: GPIO 33 (ADC1_CH5)
- **Current Sense**: GPIO 35 (ADC1_CH7)
- **DC Resistance**: GPIO 32 (ADC1_CH4)

## Digital I/O
- **DS18B20 / AM2301 Temp**: 
    - Port 0: In GPIO 2, Out GPIO 4
    - Port 1: In GPIO 17, Out GPIO 23

## Actuators (Shift Register - 74HC595 likely)
**Control Pins:**
- **Data (SI)**: GPIO 26
- **Clock (SCK)**: GPIO 27
- **Latch (RCK)**: GPIO 14
- **Clear (nRCLR)**: GPIO 12

**Shift Register Map (16 bits):**
- **Bits 0-7**: Solenoids 0-7
- **Bits 8-13**: Pumps 0-5
- **Bit 14**: Big Pump
- **Bit 15**: Debug LED

## Actuators (Direct PWM/LEDC)
- **Dosing Pump A**: GPIO 18
- **Dosing Pump B**: GPIO 19
- **Dosing Pump pH**: GPIO 21
- **Dosing Pump Aux**: GPIO 22

## Other
- **EC Gates**: GPIO 25, 15
