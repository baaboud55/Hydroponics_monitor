#include "HydroActuators.h"

HydroActuators::HydroActuators(int dataPin, int clockPin, int latchPin, int clearPin) {
    _dataPin = dataPin;
    _clockPin = clockPin;
    _latchPin = latchPin;
    _clearPin = clearPin;
    _registerState = 0;
}

void HydroActuators::begin() {
    pinMode(_dataPin, OUTPUT);
    pinMode(_clockPin, OUTPUT);
    pinMode(_latchPin, OUTPUT);
    pinMode(_clearPin, OUTPUT);
    
    digitalWrite(_clearPin, HIGH); // Active low clear, so HIGH to enable
    
    allOff();
}

void HydroActuators::setSolenoid(uint8_t index, bool state) {
    if (index > 7) return;
    _setBit(index, state); // Bits 0-7
}

void HydroActuators::setPump(uint8_t index, bool state) {
    if (index > 5) return;
    _setBit(8 + index, state); // Bits 8-13
}

void HydroActuators::setBigPump(bool state) {
    _setBit(14, state); // Bit 14
}

void HydroActuators::setDebugLed(bool state) {
    _setBit(15, state); // Bit 15
}

void HydroActuators::_setBit(uint8_t bit, bool state) {
    if (state) {
        _registerState |= (1 << bit);
    } else {
        _registerState &= ~(1 << bit);
    }
}

void HydroActuators::commit() {
    digitalWrite(_latchPin, LOW);
    shiftOut(_dataPin, _clockPin, MSBFIRST, (_registerState >> 8)); // High byte first (Pumps/LED) ?
    // Wait, 74HC595 daisy chaining or single 16-bit? 
    // Usually with 16 bits (2x 74hc595), it's shifting out logic.
    // If it's a single int16, we need to verify endianness/order.
    // Assuming standard: 
    shiftOut(_dataPin, _clockPin, MSBFIRST, (_registerState & 0xFF)); // Low byte (Solenoids)
    
    // Actually, shiftOut sends 8 bits. We need to send 16.
    // Order depends on hardware. Usually last in is last out.
    // Let's guess: High byte (Bits 8-15) first, then Low byte (Bits 0-7).
    // Because the FIRST bit sent ends up in the LAST stage (Q7 of 2nd chip/Qh of last).
    // Actually, usually:
    // shiftOut(data, clock, MSBFIRST, highByte) -> goes to second chip if daisy chained?
    // Let's assume High byte is bits 8-15 and Low byte is 0-7.
    // Most schematics: 1st chip = Low byte, 2nd chip = High byte.
    // Data enters 1st chip. To get data to 2nd chip, it has to overflow 1st chip.
    // So we send High Byte FIRST, it flows through 1st chip into 2nd chip.
    // Then we send Low Byte, it stays in 1st chip.
    
    digitalWrite(_latchPin, HIGH);
}

void HydroActuators::allOff() {
    _registerState = 0;
    commit();
}
