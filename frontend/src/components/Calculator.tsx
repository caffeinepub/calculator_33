import React, { useState, useEffect, useCallback } from 'react';
import { CalculatorDisplay } from './CalculatorDisplay';
import { CalculatorKeypad, ButtonType } from './CalculatorKeypad';
import { CalculatorHistory } from './CalculatorHistory';
import { useGetHistory, useAdd, useSubtract, useMultiply, useDivide } from '../hooks/useQueries';

type Operator = '+' | '-' | '*' | '/';

interface CalcState {
    display: string;
    expression: string;
    operator: Operator | null;
    operand1: string;
    waitingForOperand2: boolean;
    justCalculated: boolean;
    isError: boolean;
}

const initialState: CalcState = {
    display: '0',
    expression: '',
    operator: null,
    operand1: '',
    waitingForOperand2: false,
    justCalculated: false,
    isError: false,
};

export function Calculator() {
    const [state, setState] = useState<CalcState>(initialState);
    const [isCalculating, setIsCalculating] = useState(false);

    const { data: history = [], isLoading: historyLoading } = useGetHistory();
    const addMutation = useAdd();
    const subtractMutation = useSubtract();
    const multiplyMutation = useMultiply();
    const divideMutation = useDivide();

    const isLoading = isCalculating ||
        addMutation.isPending ||
        subtractMutation.isPending ||
        multiplyMutation.isPending ||
        divideMutation.isPending;

    const handleDigit = useCallback((digit: string) => {
        setState(prev => {
            if (prev.isError) return { ...initialState, display: digit, expression: '' };

            if (prev.justCalculated) {
                return {
                    ...initialState,
                    display: digit,
                    expression: '',
                };
            }

            if (prev.waitingForOperand2) {
                return {
                    ...prev,
                    display: digit,
                    waitingForOperand2: false,
                };
            }

            const newDisplay = prev.display === '0' ? digit : prev.display + digit;
            if (newDisplay.replace('-', '').length > 15) return prev;

            return { ...prev, display: newDisplay };
        });
    }, []);

    const handleDecimal = useCallback(() => {
        setState(prev => {
            if (prev.isError) return initialState;
            if (prev.justCalculated) return { ...initialState, display: '0.', expression: '' };

            if (prev.waitingForOperand2) {
                return { ...prev, display: '0.', waitingForOperand2: false };
            }

            if (prev.display.includes('.')) return prev;
            return { ...prev, display: prev.display + '.' };
        });
    }, []);

    const handleOperator = useCallback((op: Operator) => {
        setState(prev => {
            if (prev.isError) return initialState;

            const opSymbol = op === '+' ? '+' : op === '-' ? '−' : op === '*' ? '×' : '÷';

            if (prev.operator && !prev.waitingForOperand2 && !prev.justCalculated) {
                // Chain: update operator
                return {
                    ...prev,
                    operator: op,
                    operand1: prev.display,
                    expression: `${prev.display} ${opSymbol}`,
                    waitingForOperand2: true,
                    justCalculated: false,
                };
            }

            return {
                ...prev,
                operator: op,
                operand1: prev.display,
                expression: `${prev.display} ${opSymbol}`,
                waitingForOperand2: true,
                justCalculated: false,
            };
        });
    }, []);

    const handleEquals = useCallback(async () => {
        setState(prev => {
            if (!prev.operator || prev.waitingForOperand2 || prev.isError) return prev;
            return prev;
        });

        const currentState = await new Promise<CalcState>(resolve => {
            setState(prev => {
                resolve(prev);
                return prev;
            });
        });

        if (!currentState.operator || currentState.waitingForOperand2 || currentState.isError) return;

        const x = parseFloat(currentState.operand1);
        const y = parseFloat(currentState.display);

        if (isNaN(x) || isNaN(y)) return;

        // Backend only supports integers - round to integers
        const xi = BigInt(Math.trunc(x));
        const yi = BigInt(Math.trunc(y));

        setIsCalculating(true);

        try {
            let result: { result: bigint; expression: string };

            switch (currentState.operator) {
                case '+':
                    result = await addMutation.mutateAsync({ x: xi, y: yi });
                    break;
                case '-':
                    result = await subtractMutation.mutateAsync({ x: xi, y: yi });
                    break;
                case '*':
                    result = await multiplyMutation.mutateAsync({ x: xi, y: yi });
                    break;
                case '/':
                    result = await divideMutation.mutateAsync({ x: xi, y: yi });
                    break;
                default:
                    return;
            }

            const opSymbol = currentState.operator === '+' ? '+' : currentState.operator === '-' ? '−' : currentState.operator === '*' ? '×' : '÷';
            const fullExpression = `${currentState.operand1} ${opSymbol} ${currentState.display} =`;

            setState({
                display: result.result.toString(),
                expression: fullExpression,
                operator: null,
                operand1: result.result.toString(),
                waitingForOperand2: false,
                justCalculated: true,
                isError: false,
            });
        } catch (err) {
            const errorMsg = err instanceof Error && err.message.includes('Division by zero')
                ? 'Error: ÷0'
                : 'Error';

            setState(prev => ({
                ...prev,
                display: errorMsg,
                expression: `${currentState.operand1} ÷ 0`,
                isError: true,
                justCalculated: false,
            }));
        } finally {
            setIsCalculating(false);
        }
    }, [addMutation, subtractMutation, multiplyMutation, divideMutation]);

    const handleClear = useCallback(() => {
        setState(initialState);
    }, []);

    const handleBackspace = useCallback(() => {
        setState(prev => {
            if (prev.isError || prev.justCalculated) return initialState;
            if (prev.waitingForOperand2) return prev;
            if (prev.display.length <= 1 || (prev.display.length === 2 && prev.display.startsWith('-'))) {
                return { ...prev, display: '0' };
            }
            return { ...prev, display: prev.display.slice(0, -1) };
        });
    }, []);

    const handleNegate = useCallback(() => {
        setState(prev => {
            if (prev.isError || prev.display === '0') return prev;
            if (prev.display.startsWith('-')) {
                return { ...prev, display: prev.display.slice(1) };
            }
            return { ...prev, display: '-' + prev.display };
        });
    }, []);

    const handlePercent = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            const val = parseFloat(prev.display);
            if (isNaN(val)) return prev;
            return { ...prev, display: (val / 100).toString() };
        });
    }, []);

    const handleSelectResult = useCallback((result: string) => {
        setState({
            ...initialState,
            display: result,
            justCalculated: true,
        });
    }, []);

    const handleButton = useCallback((value: string, type: ButtonType) => {
        switch (type) {
            case 'digit':
                handleDigit(value);
                break;
            case 'decimal':
                handleDecimal();
                break;
            case 'operator':
                handleOperator(value as Operator);
                break;
            case 'equals':
                handleEquals();
                break;
            case 'clear':
                handleClear();
                break;
            case 'backspace':
                handleBackspace();
                break;
            case 'special':
                if (value === 'negate') handleNegate();
                if (value === 'percent') handlePercent();
                break;
        }
    }, [handleDigit, handleDecimal, handleOperator, handleEquals, handleClear, handleBackspace, handleNegate, handlePercent]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            if (e.key >= '0' && e.key <= '9') {
                handleDigit(e.key);
            } else if (e.key === '.') {
                handleDecimal();
            } else if (e.key === '+') {
                handleOperator('+');
            } else if (e.key === '-') {
                handleOperator('-');
            } else if (e.key === '*') {
                handleOperator('*');
            } else if (e.key === '/') {
                e.preventDefault();
                handleOperator('/');
            } else if (e.key === 'Enter' || e.key === '=') {
                handleEquals();
            } else if (e.key === 'Backspace') {
                handleBackspace();
            } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
                handleClear();
            } else if (e.key === '%') {
                handlePercent();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDigit, handleDecimal, handleOperator, handleEquals, handleBackspace, handleClear, handlePercent]);

    return (
        <div className="flex flex-col lg:flex-row gap-5 w-full max-w-3xl mx-auto items-start">
            {/* Calculator Body */}
            <div
                className="w-full lg:w-80 shrink-0 rounded-2xl p-5"
                style={{
                    background: 'oklch(0.17 0 0)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
                    border: '1px solid oklch(0.24 0 0)',
                }}
            >
                {/* Brand strip */}
                <div className="flex items-center justify-between mb-4">
                    <span
                        className="text-xs font-mono font-semibold tracking-[0.2em] uppercase"
                        style={{ color: 'oklch(0.85 0.22 142)' }}
                    >
                        CALC
                    </span>
                    <div className="flex gap-1">
                        {['oklch(0.65 0.22 25)', 'oklch(0.78 0.18 65)', 'oklch(0.85 0.22 142)'].map((c, i) => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-full"
                                style={{ background: c, boxShadow: `0 0 4px ${c}` }}
                            />
                        ))}
                    </div>
                </div>

                <CalculatorDisplay
                    expression={state.expression}
                    result={state.display}
                    isError={state.isError}
                    isLoading={isLoading}
                />

                {/* Backspace row */}
                <div className="flex justify-end mb-2.5">
                    <button
                        onClick={handleBackspace}
                        disabled={isLoading}
                        className="calc-btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono disabled:opacity-50"
                        style={{
                            background: 'oklch(0.2 0 0)',
                            color: 'oklch(0.6 0 0)',
                            border: '1px solid oklch(0.28 0 0)',
                        }}
                        aria-label="Backspace"
                    >
                        <span>⌫</span>
                        <span>DEL</span>
                    </button>
                </div>

                <CalculatorKeypad onButton={handleButton} isLoading={isLoading} />

                {/* Keyboard hint */}
                <p className="text-center mt-4 text-xs" style={{ color: 'oklch(0.35 0 0)' }}>
                    Keyboard supported
                </p>
            </div>

            {/* History Panel */}
            <div className="w-full lg:flex-1 lg:min-h-[520px]" style={{ minHeight: '300px' }}>
                <CalculatorHistory
                    history={history}
                    isLoading={historyLoading}
                    onSelectResult={handleSelectResult}
                />
            </div>
        </div>
    );
}
