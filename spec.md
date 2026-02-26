# Specification

## Summary
**Goal:** Remove duplicate `=` buttons from the calculator keypad so that exactly one `=` button exists, placed at the bottom of the right column.

**Planned changes:**
- In `CalculatorKeypad`, remove all extra `=` buttons from the keypad layout, keeping only a single `=` button at the bottom of the rightmost column.

**User-visible outcome:** The calculator keypad displays exactly one `=` button, located at the bottom-right, and pressing it still correctly evaluates and displays the result.
