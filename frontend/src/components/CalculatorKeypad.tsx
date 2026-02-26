import React from 'react';

export type ButtonType = 'digit' | 'operator' | 'equals' | 'clear' | 'backspace' | 'decimal' | 'special' | 'advanced' | 'action' | 'scientific' | 'number';

export interface KeypadButton {
    label: string;
    value: string;
    type: ButtonType;
    span?: number;
}

interface CalculatorKeypadProps {
    onButton: (value: string, type: ButtonType) => void;
    disabled?: boolean;
    isLoading?: boolean;
}

// Layout:
// Row 1: x², √x, 1/x, xʸ
// Row 2: (, ), %, DEL
// Row 3: C, ±, ÷, ×
// Row 4: 7, 8, 9, −
// Row 5: 4, 5, 6, +
// Row 6: 1, 2, 3        ← no = here
// Row 7: 0 (span 2), ., =  ← single = at bottom right
const KEYPAD_ROWS: KeypadButton[][] = [
    [
        { label: 'x²',  value: 'x²',         type: 'scientific' },
        { label: '√x',  value: '√x',          type: 'scientific' },
        { label: '1/x', value: '1/x',         type: 'scientific' },
        { label: 'xʸ',  value: 'xʸ',          type: 'scientific' },
    ],
    [
        { label: '(',   value: '(',            type: 'scientific' },
        { label: ')',   value: ')',            type: 'scientific' },
        { label: '%',   value: '%',            type: 'scientific' },
        { label: 'DEL', value: 'DEL',          type: 'action' },
    ],
    [
        { label: 'C',   value: 'C',            type: 'action' },
        { label: '±',   value: '±',            type: 'action' },
        { label: '÷',   value: '÷',            type: 'operator' },
        { label: '×',   value: '×',            type: 'operator' },
    ],
    [
        { label: '7',   value: '7',            type: 'digit' },
        { label: '8',   value: '8',            type: 'digit' },
        { label: '9',   value: '9',            type: 'digit' },
        { label: '−',   value: '−',            type: 'operator' },
    ],
    [
        { label: '4',   value: '4',            type: 'digit' },
        { label: '5',   value: '5',            type: 'digit' },
        { label: '6',   value: '6',            type: 'digit' },
        { label: '+',   value: '+',            type: 'operator' },
    ],
    [
        { label: '1',   value: '1',            type: 'digit' },
        { label: '2',   value: '2',            type: 'digit' },
        { label: '3',   value: '3',            type: 'digit',   span: 1 },
    ],
    [
        { label: '0',   value: '0',            type: 'digit',   span: 2 },
        { label: '.',   value: '.',            type: 'decimal' },
        { label: '=',   value: '=',            type: 'equals' },
    ],
];

function getButtonStyle(type: ButtonType, label: string): React.CSSProperties {
    if (label === '=') {
        return {
            background: 'oklch(0.22 0.06 142)',
            color: 'oklch(0.85 0.22 142)',
            border: '1px solid oklch(0.85 0.22 142 / 0.4)',
        };
    }
    if (label === 'DEL') {
        return {
            background: 'oklch(0.22 0.05 65)',
            color: 'oklch(0.82 0.18 65)',
            border: '1px solid oklch(0.82 0.18 65 / 0.35)',
        };
    }
    if (label === 'C') {
        return {
            background: 'oklch(0.22 0.06 25)',
            color: 'oklch(0.75 0.2 25)',
            border: '1px solid oklch(0.65 0.22 25 / 0.3)',
        };
    }
    switch (type) {
        case 'scientific':
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
        case 'action':
        case 'special':
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
        default:
            return {
                background: 'oklch(0.22 0 0)',
                color: 'oklch(0.92 0 0)',
                border: '1px solid oklch(0.28 0 0)',
            };
    }
}

function getHoverClass(type: ButtonType, label: string): string {
    if (label === '=') return 'hover:brightness-125 hover:shadow-[0_0_12px_oklch(0.85_0.22_142_/_0.5)]';
    if (label === 'DEL') return 'hover:brightness-125 hover:shadow-[0_0_12px_oklch(0.82_0.18_65_/_0.4)]';
    if (label === 'C') return 'hover:brightness-125 hover:shadow-[0_0_12px_oklch(0.65_0.22_25_/_0.4)]';
    switch (type) {
        case 'scientific': return 'hover:brightness-125 hover:shadow-[0_0_12px_oklch(0.82_0.18_260_/_0.4)]';
        case 'operator': return 'hover:brightness-125 hover:shadow-[0_0_12px_oklch(0.85_0.22_142_/_0.35)]';
        default: return 'hover:brightness-125';
    }
}

export function CalculatorKeypad({ onButton, disabled, isLoading }: CalculatorKeypadProps) {
    const isDisabled = disabled || isLoading;

    return (
        <div className="flex flex-col gap-2 w-full">
            {KEYPAD_ROWS.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-4 gap-2">
                    {row.map((btn, btnIdx) => {
                        const style = getButtonStyle(btn.type, btn.label);
                        const hoverClass = getHoverClass(btn.type, btn.label);
                        const colSpan = btn.span === 2 ? 'col-span-2' : 'col-span-1';
                        const isScientific = btn.type === 'scientific';
                        const isEquals = btn.label === '=';
                        const heightClass = isScientific ? 'h-11' : 'h-13';
                        const textClass = isScientific ? 'text-sm' : isEquals ? 'text-2xl' : 'text-xl';

                        return (
                            <button
                                key={`${rowIdx}-${btnIdx}`}
                                onClick={() => onButton(btn.value, btn.type)}
                                disabled={isDisabled}
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
                                    minHeight: isScientific ? '2.75rem' : '3.25rem',
                                }}
                                aria-label={btn.label}
                            >
                                {btn.label}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
