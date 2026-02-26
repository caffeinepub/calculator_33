import React from 'react';

export type ButtonType = 'digit' | 'operator' | 'equals' | 'clear' | 'backspace' | 'decimal' | 'special' | 'advanced';

export interface KeypadButton {
    label: string | React.ReactNode;
    value: string;
    type: ButtonType;
    span?: number;
}

interface CalculatorKeypadProps {
    onButton: (value: string, type: ButtonType) => void;
    isLoading: boolean;
}

// Row 1: Advanced scientific functions
// Row 2: (, ), %, ÷
// Row 3: 7, 8, 9, ×
// Row 4: 4, 5, 6, −
// Row 5: 1, 2, 3, +
// Row 6: C, ±, 0, .
const BUTTONS: KeypadButton[] = [
    // Row 1 – advanced functions
    { label: 'x²',  value: 'square',     type: 'advanced' },
    { label: '√x',  value: 'sqrt',       type: 'advanced' },
    { label: '1/x', value: 'reciprocal', type: 'advanced' },
    { label: 'xʸ',  value: 'power',      type: 'advanced' },

    // Row 2 – advanced functions cont.
    { label: '(',   value: '(',          type: 'advanced' },
    { label: ')',   value: ')',          type: 'advanced' },
    { label: '%',   value: 'percent',    type: 'advanced' },
    { label: '÷',   value: '/',          type: 'operator' },

    // Row 3
    { label: '7',   value: '7',          type: 'digit' },
    { label: '8',   value: '8',          type: 'digit' },
    { label: '9',   value: '9',          type: 'digit' },
    { label: '×',   value: '*',          type: 'operator' },

    // Row 4
    { label: '4',   value: '4',          type: 'digit' },
    { label: '5',   value: '5',          type: 'digit' },
    { label: '6',   value: '6',          type: 'digit' },
    { label: '−',   value: '-',          type: 'operator' },

    // Row 5
    { label: '1',   value: '1',          type: 'digit' },
    { label: '2',   value: '2',          type: 'digit' },
    { label: '3',   value: '3',          type: 'digit' },
    { label: '+',   value: '+',          type: 'operator' },

    // Row 6
    { label: 'C',   value: 'clear',      type: 'clear' },
    { label: '±',   value: 'negate',     type: 'special' },
    { label: '0',   value: '0',          type: 'digit' },
    { label: '.',   value: '.',          type: 'decimal' },
];

function getButtonStyle(type: ButtonType): React.CSSProperties {
    switch (type) {
        case 'advanced':
            return {
                background: 'oklch(0.20 0.05 260)',
                color: 'oklch(0.82 0.18 260)',
                border: '1px solid oklch(0.82 0.18 260 / 0.3)',
            };
        case 'operator':
            return {
                background: 'oklch(0.22 0.06 142)',
                color: 'oklch(0.85 0.22 142)',
                border: '1px solid oklch(0.85 0.22 142 / 0.3)',
            };
        case 'equals':
            return {
                background: 'oklch(0.78 0.18 65)',
                color: 'oklch(0.1 0 0)',
                border: '1px solid oklch(0.83 0.16 65 / 0.5)',
            };
        case 'clear':
            return {
                background: 'oklch(0.22 0.06 25)',
                color: 'oklch(0.75 0.2 25)',
                border: '1px solid oklch(0.65 0.22 25 / 0.3)',
            };
        case 'special':
        case 'backspace':
            return {
                background: 'oklch(0.2 0 0)',
                color: 'oklch(0.7 0 0)',
                border: '1px solid oklch(0.3 0 0)',
            };
        case 'decimal':
            return {
                background: 'oklch(0.22 0 0)',
                color: 'oklch(0.85 0 0)',
                border: '1px solid oklch(0.3 0 0)',
            };
        default: // digit
            return {
                background: 'oklch(0.22 0 0)',
                color: 'oklch(0.92 0 0)',
                border: '1px solid oklch(0.28 0 0)',
            };
    }
}

function getHoverClass(type: ButtonType): string {
    switch (type) {
        case 'advanced':
            return 'hover:brightness-125 hover:shadow-[0_0_12px_oklch(0.82_0.18_260_/_0.4)]';
        case 'operator':
            return 'hover:brightness-125 hover:shadow-[0_0_12px_oklch(0.85_0.22_142_/_0.35)]';
        case 'equals':
            return 'hover:brightness-110 hover:shadow-[0_0_12px_oklch(0.78_0.18_65_/_0.5)]';
        case 'clear':
            return 'hover:brightness-125 hover:shadow-[0_0_12px_oklch(0.65_0.22_25_/_0.4)]';
        default:
            return 'hover:brightness-125';
    }
}

export function CalculatorKeypad({ onButton, isLoading }: CalculatorKeypadProps) {
    return (
        <div className="grid grid-cols-4 gap-2">
            {BUTTONS.map((btn, idx) => {
                const style = getButtonStyle(btn.type);
                const hoverClass = getHoverClass(btn.type);
                const colSpan = btn.span === 2 ? 'col-span-2' : 'col-span-1';
                // Advanced buttons are slightly shorter to keep the layout compact
                const heightClass = btn.type === 'advanced' ? 'h-11' : 'h-13';
                // Advanced buttons use smaller text for multi-char labels
                const textClass = btn.type === 'advanced' ? 'text-sm' : 'text-xl';

                return (
                    <button
                        key={idx}
                        onClick={() => onButton(btn.value, btn.type)}
                        disabled={isLoading}
                        className={`
                            ${colSpan}
                            calc-btn-press
                            ${hoverClass}
                            ${heightClass}
                            rounded-xl
                            font-mono font-semibold ${textClass}
                            flex items-center justify-center
                            select-none cursor-pointer
                            disabled:opacity-50 disabled:cursor-not-allowed
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                            transition-all duration-100
                        `}
                        style={{
                            ...style,
                            boxShadow: '0 3px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                            minHeight: btn.type === 'advanced' ? '2.75rem' : '3.25rem',
                        }}
                        aria-label={typeof btn.label === 'string' ? btn.label : btn.value}
                    >
                        {btn.label}
                    </button>
                );
            })}
        </div>
    );
}
