import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CalculatorDisplay } from './CalculatorDisplay';
import { CalculatorKeypad } from './CalculatorKeypad';
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
    expressionMode: boolean;
    fullExpression: string;
}

const initialState: CalcState = {
    display: '0',
    expression: '',
    operator: null,
    operand1: '',
    waitingForOperand2: false,
    justCalculated: false,
    isError: false,
    expressionMode: false,
    fullExpression: '',
};

function formatDivisionResult(value: number): string {
    if (!isFinite(value) || isNaN(value)) return 'Error';
    const fixed = value.toFixed(10);
    const stripped = fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return stripped;
}

function tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    while (i < expr.length) {
        const ch = expr[i];
        if (ch === ' ') { i++; continue; }
        if (ch === '√') { tokens.push('√'); i++; continue; }
        if ('()^%*/+-'.includes(ch)) { tokens.push(ch); i++; continue; }
        if ((ch >= '0' && ch <= '9') || ch === '.') {
            let num = '';
            while (i < expr.length && ((expr[i] >= '0' && expr[i] <= '9') || expr[i] === '.')) {
                num += expr[i++];
            }
            tokens.push(num);
            continue;
        }
        i++;
    }
    return tokens;
}

function evaluateExpression(expr: string): { value: number; involvesDivision: boolean } {
    const tokens = tokenize(expr);
    let pos = 0;
    let involvesDivision = false;

    function peek(): string | undefined { return tokens[pos]; }
    function consume(): string { return tokens[pos++]; }

    function parseExpr(): number {
        let left = parseTerm();
        while (peek() === '+' || peek() === '-') {
            const op = consume();
            const right = parseTerm();
            left = op === '+' ? left + right : left - right;
        }
        return left;
    }

    function parseTerm(): number {
        let left = parsePower();
        if (peek() === '%') { consume(); left = left / 100; }
        while (peek() === '*' || peek() === '/') {
            const op = consume();
            let right = parsePower();
            if (peek() === '%') { consume(); right = right / 100; }
            if (op === '*') {
                left = left * right;
            } else {
                if (right === 0) throw new Error('Division by zero');
                involvesDivision = true;
                left = left / right;
            }
        }
        return left;
    }

    function parsePower(): number {
        const base = parseUnary();
        if (peek() === '^') {
            consume();
            const exp = parseUnary();
            return Math.pow(base, exp);
        }
        return base;
    }

    function parseUnary(): number {
        if (peek() === '√') {
            consume();
            const val = parseUnary();
            if (val < 0) throw new Error('Sqrt of negative');
            return Math.sqrt(val);
        }
        if (peek() === '-') { consume(); return -parseUnary(); }
        return parsePrimary();
    }

    function parsePrimary(): number {
        const tok = peek();
        if (tok === undefined) throw new Error('Unexpected end');
        if (tok === '(') {
            consume();
            const val = parseExpr();
            if (peek() === ')') consume();
            return val;
        }
        if (!isNaN(Number(tok))) { consume(); return Number(tok); }
        throw new Error(`Unexpected token: ${tok}`);
    }

    const value = parseExpr();
    return { value, involvesDivision };
}

function safeEvaluate(expr: string): string | null {
    try {
        const { value, involvesDivision } = evaluateExpression(expr);
        if (!isFinite(value) || isNaN(value)) return 'Error';
        if (involvesDivision) return formatDivisionResult(value);
        const rounded = parseFloat(value.toPrecision(12));
        return rounded.toString();
    } catch {
        return null;
    }
}

function computeLocal(op: Operator, x: string, y: string): string | null {
    const xi = parseFloat(x);
    const yi = parseFloat(y);
    if (isNaN(xi) || isNaN(yi)) return null;
    try {
        switch (op) {
            case '+': return (BigInt(Math.trunc(xi)) + BigInt(Math.trunc(yi))).toString();
            case '-': return (BigInt(Math.trunc(xi)) - BigInt(Math.trunc(yi))).toString();
            case '*': return (BigInt(Math.trunc(xi)) * BigInt(Math.trunc(yi))).toString();
            case '/':
                if (yi === 0) return 'Error';
                return formatDivisionResult(xi / yi);
        }
    } catch {
        return null;
    }
}

export function Calculator() {
    const [state, setState] = useState<CalcState>(initialState);
    const [isCalculating, setIsCalculating] = useState(false);

    const { data: history = [], isLoading: isHistoryLoading } = useGetHistory();
    const addMutation = useAdd();
    const subtractMutation = useSubtract();
    const multiplyMutation = useMultiply();
    const divideMutation = useDivide();

    const isLoading = isCalculating ||
        addMutation.isPending ||
        subtractMutation.isPending ||
        multiplyMutation.isPending ||
        divideMutation.isPending;

    const autoResult = useMemo<string | null>(() => {
        if (state.isError || state.justCalculated) return null;

        if (state.expressionMode && state.fullExpression) {
            return safeEvaluate(state.fullExpression);
        }

        if (state.operator && state.operand1 !== '' && !state.waitingForOperand2 && !state.justCalculated && !state.isError) {
            return computeLocal(state.operator, state.operand1, state.display);
        }
        return null;
    }, [state]);

    const displayResult = autoResult !== null ? autoResult : state.display;
    const isAutoPreview = autoResult !== null && !state.justCalculated;

    const handleDigit = useCallback((digit: string) => {
        setState(prev => {
            if (prev.isError) return { ...initialState, display: digit };
            if (prev.justCalculated) return { ...initialState, display: digit };
            if (prev.expressionMode) {
                const newFull = prev.fullExpression + digit;
                return { ...prev, fullExpression: newFull, display: digit };
            }
            if (prev.waitingForOperand2) return { ...prev, display: digit, waitingForOperand2: false };
            const newDisplay = prev.display === '0' ? digit : prev.display + digit;
            if (newDisplay.replace('-', '').length > 15) return prev;
            return { ...prev, display: newDisplay };
        });
    }, []);

    const handleDecimal = useCallback(() => {
        setState(prev => {
            if (prev.isError) return initialState;
            if (prev.justCalculated) return { ...initialState, display: '0.' };
            if (prev.expressionMode) {
                const lastNum = prev.fullExpression.match(/[\d.]+$/);
                if (lastNum && lastNum[0].includes('.')) return prev;
                const newFull = prev.fullExpression + '.';
                return { ...prev, fullExpression: newFull, display: prev.display + '.' };
            }
            if (prev.waitingForOperand2) return { ...prev, display: '0.', waitingForOperand2: false };
            if (prev.display.includes('.')) return prev;
            return { ...prev, display: prev.display + '.' };
        });
    }, []);

    const handleOperator = useCallback((op: Operator) => {
        setState(prev => {
            if (prev.isError) return initialState;
            const opSymbol = op === '+' ? '+' : op === '-' ? '−' : op === '*' ? '×' : '÷';
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

    const handleSquare = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            const val = parseFloat(prev.display);
            if (isNaN(val)) return prev;
            const result = val * val;
            const rounded = parseFloat(result.toPrecision(12));
            return { ...initialState, display: rounded.toString(), expression: `(${prev.display})²`, justCalculated: true };
        });
    }, []);

    const handleSqrt = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            const val = parseFloat(prev.display);
            if (isNaN(val)) return prev;
            if (val < 0) return { ...prev, display: 'Error', expression: `√(${prev.display})`, isError: true };
            const result = Math.sqrt(val);
            const rounded = parseFloat(result.toPrecision(12));
            return { ...initialState, display: rounded.toString(), expression: `√(${prev.display})`, justCalculated: true };
        });
    }, []);

    const handleReciprocal = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            const val = parseFloat(prev.display);
            if (isNaN(val)) return prev;
            if (val === 0) return { ...prev, display: 'Error', expression: `1/(${prev.display})`, isError: true };
            const result = 1 / val;
            const rounded = parseFloat(result.toPrecision(12));
            return { ...initialState, display: rounded.toString(), expression: `1/(${prev.display})`, justCalculated: true };
        });
    }, []);

    const handlePower = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            const base = prev.display;
            return { ...initialState, expressionMode: true, fullExpression: base + '^', display: base, expression: `${base}^` };
        });
    }, []);

    const handleOpenParen = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            if (prev.justCalculated) {
                return { ...initialState, expressionMode: true, fullExpression: '(', display: '0', expression: '(' };
            }
            if (prev.expressionMode) {
                const newFull = prev.fullExpression + '(';
                return { ...prev, fullExpression: newFull, expression: newFull };
            }
            const newFull = prev.display !== '0' ? prev.display + '*(' : '(';
            return { ...prev, expressionMode: true, fullExpression: newFull, expression: newFull };
        });
    }, []);

    const handleCloseParen = useCallback(() => {
        setState(prev => {
            if (!prev.expressionMode) return prev;
            const newFull = prev.fullExpression + ')';
            return { ...prev, fullExpression: newFull, expression: newFull };
        });
    }, []);

    const handlePercent = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            if (prev.expressionMode) {
                const newFull = prev.fullExpression + '%';
                return { ...prev, fullExpression: newFull, expression: newFull };
            }
            const val = parseFloat(prev.display);
            if (isNaN(val)) return prev;
            const result = val / 100;
            const rounded = parseFloat(result.toPrecision(12));
            return { ...prev, display: rounded.toString() };
        });
    }, []);

    const handleBackspace = useCallback(() => {
        setState(prev => {
            if (prev.isError) return initialState;
            if (prev.justCalculated) return initialState;
            if (prev.expressionMode) {
                const newFull = prev.fullExpression.slice(0, -1);
                if (!newFull) return initialState;
                return { ...prev, fullExpression: newFull, expression: newFull, display: newFull.slice(-1) || '0' };
            }
            if (prev.display.length <= 1 || prev.display === '0') {
                return { ...prev, display: '0' };
            }
            return { ...prev, display: prev.display.slice(0, -1) };
        });
    }, []);

    const handleEquals = useCallback(async () => {
        const currentState = await new Promise<CalcState>(resolve => {
            setState(prev => { resolve(prev); return prev; });
        });

        if (currentState.isError) return;

        if (currentState.expressionMode && currentState.fullExpression) {
            const result = safeEvaluate(currentState.fullExpression);
            if (result === null || result === 'Error') {
                setState(prev => ({
                    ...prev,
                    display: 'Error',
                    expression: currentState.fullExpression + ' =',
                    isError: true,
                    justCalculated: false,
                }));
            } else {
                setState({
                    ...initialState,
                    display: result,
                    expression: currentState.fullExpression + ' = ' + result,
                    operand1: result,
                    justCalculated: true,
                });
            }
            return;
        }

        if (!currentState.operator || currentState.waitingForOperand2) return;

        const x = parseFloat(currentState.operand1);
        const y = parseFloat(currentState.display);
        if (isNaN(x) || isNaN(y)) return;

        const xi = BigInt(Math.trunc(x));
        const yi = BigInt(Math.trunc(y));

        if (currentState.operator === '/' && y === 0) {
            setState(prev => ({
                ...prev,
                display: 'Error',
                expression: `${currentState.operand1} ÷ 0`,
                isError: true,
                justCalculated: false,
            }));
            return;
        }

        setIsCalculating(true);
        try {
            let result: string;
            const opSymbol = currentState.operator === '+' ? '+' : currentState.operator === '-' ? '−' : currentState.operator === '*' ? '×' : '÷';
            const expr = `${currentState.operand1} ${opSymbol} ${currentState.display}`;

            if (currentState.operator === '/') {
                result = formatDivisionResult(x / y);
                try { await divideMutation.mutateAsync({ x: xi, y: yi }); } catch { /* ignore */ }
            } else if (currentState.operator === '+') {
                const res = await addMutation.mutateAsync({ x: xi, y: yi });
                result = res.result.toString();
            } else if (currentState.operator === '-') {
                const res = await subtractMutation.mutateAsync({ x: xi, y: yi });
                result = res.result.toString();
            } else {
                const res = await multiplyMutation.mutateAsync({ x: xi, y: yi });
                result = res.result.toString();
            }

            setState({
                ...initialState,
                display: result,
                expression: expr + ' = ' + result,
                operand1: result,
                justCalculated: true,
            });
        } catch {
            setState(prev => ({
                ...prev,
                display: 'Error',
                isError: true,
                justCalculated: false,
            }));
        } finally {
            setIsCalculating(false);
        }
    }, [addMutation, subtractMutation, multiplyMutation, divideMutation]);

    const handleNegate = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            if (prev.display === '0') return prev;
            const negated = prev.display.startsWith('-') ? prev.display.slice(1) : '-' + prev.display;
            return { ...prev, display: negated };
        });
    }, []);

    const handleButton = useCallback((value: string, type: string) => {
        switch (type) {
            case 'number':
                if (value === '.') { handleDecimal(); return; }
                handleDigit(value);
                return;
            case 'digit':
                if (value === '.') { handleDecimal(); return; }
                handleDigit(value);
                return;
            case 'decimal':
                handleDecimal();
                return;
            case 'operator':
                if (value === '/') { handleOperator('/'); return; }
                if (value === '*') { handleOperator('*'); return; }
                if (value === '÷') { handleOperator('/'); return; }
                if (value === '×') { handleOperator('*'); return; }
                if (value === '+') { handleOperator('+'); return; }
                if (value === '−' || value === '-') { handleOperator('-'); return; }
                return;
            case 'equals':
                handleEquals();
                return;
            case 'clear':
                setState(initialState);
                return;
            case 'backspace':
                handleBackspace();
                return;
            case 'action':
                if (value === 'C') { setState(initialState); return; }
                if (value === 'DEL') { handleBackspace(); return; }
                if (value === '±') { handleNegate(); return; }
                return;
            case 'special':
                if (value === 'negate') { handleNegate(); return; }
                if (value === 'clear') { setState(initialState); return; }
                return;
            case 'advanced':
            case 'scientific':
                if (value === 'square' || value === 'x²') { handleSquare(); return; }
                if (value === 'sqrt' || value === '√x') { handleSqrt(); return; }
                if (value === 'reciprocal' || value === '1/x') { handleReciprocal(); return; }
                if (value === 'power' || value === 'xʸ') { handlePower(); return; }
                if (value === '(') { handleOpenParen(); return; }
                if (value === ')') { handleCloseParen(); return; }
                if (value === 'percent' || value === '%') { handlePercent(); return; }
                return;
            default:
                if (value === '=') { handleEquals(); return; }
                if (!isNaN(Number(value)) || value === '.') { handleDigit(value); return; }
        }
    }, [handleDigit, handleDecimal, handleOperator, handleEquals, handleBackspace, handleNegate, handleSquare, handleSqrt, handleReciprocal, handlePower, handleOpenParen, handleCloseParen, handlePercent]);

    // Keyboard support
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') { handleDigit(e.key); return; }
            if (e.key === '.') { handleDecimal(); return; }
            if (e.key === '+') { handleOperator('+'); return; }
            if (e.key === '-') { handleOperator('-'); return; }
            if (e.key === '*') { handleOperator('*'); return; }
            if (e.key === '/') { e.preventDefault(); handleOperator('/'); return; }
            if (e.key === 'Enter' || e.key === '=') { handleEquals(); return; }
            if (e.key === 'Backspace') { handleBackspace(); return; }
            if (e.key === 'Escape') { setState(initialState); return; }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleDigit, handleDecimal, handleOperator, handleEquals, handleBackspace]);

    return (
        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
            <CalculatorDisplay
                expression={state.expression}
                result={displayResult}
                isError={state.isError}
                isLoading={isLoading}
                isAutoPreview={isAutoPreview}
            />
            <CalculatorKeypad
                onButton={handleButton}
                disabled={isLoading}
            />
            <CalculatorHistory
                history={history}
                isLoading={isHistoryLoading}
            />
        </div>
    );
}
