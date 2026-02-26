import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    // For expression-mode (parentheses / power / advanced ops)
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

// ---------------------------------------------------------------------------
// Division formatting: up to 10 decimal places, no trailing zeros
// ---------------------------------------------------------------------------

/**
 * Format a division result with up to 10 decimal places.
 * - Whole numbers: no decimal point (e.g., 5)
 * - Non-repeating decimals: exact precision (e.g., 0.25)
 * - Repeating decimals: up to 10 decimal places (e.g., 3.3333333333)
 */
function formatDivisionResult(value: number): string {
    if (!isFinite(value) || isNaN(value)) return 'Error';
    // Use toFixed(10) then strip trailing zeros
    const fixed = value.toFixed(10);
    // Remove trailing zeros after decimal point
    const stripped = fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return stripped;
}

// ---------------------------------------------------------------------------
// Expression evaluator supporting: +, -, *, /, ^, %, √, (, )
// ---------------------------------------------------------------------------

function tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    while (i < expr.length) {
        const ch = expr[i];
        if (ch === ' ') { i++; continue; }
        if (ch === '√') {
            tokens.push('√');
            i++;
            continue;
        }
        if ('()^%*/+-'.includes(ch)) {
            tokens.push(ch);
            i++;
            continue;
        }
        // Number (including decimals and leading minus handled by unary logic)
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

/**
 * Recursive-descent parser / evaluator.
 * Grammar (lowest to highest precedence):
 *   expr   → term (('+' | '-') term)*
 *   term   → power (('*' | '/' | '%_op') power)*
 *   power  → unary ('^' unary)*
 *   unary  → '√' unary | '-' unary | primary
 *   primary→ NUMBER | '(' expr ')'
 *
 * '%' after a number is treated as /100 at the term level.
 */
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
        // Handle % after a number: treat as /100
        if (peek() === '%') {
            consume();
            left = left / 100;
        }
        while (peek() === '*' || peek() === '/') {
            const op = consume();
            let right = parsePower();
            if (peek() === '%') {
                consume();
                right = right / 100;
            }
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
            const exp = parseUnary(); // right-associative
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
        if (peek() === '-') {
            consume();
            return -parseUnary();
        }
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
        if (!isNaN(Number(tok))) {
            consume();
            return Number(tok);
        }
        throw new Error(`Unexpected token: ${tok}`);
    }

    const value = parseExpr();
    return { value, involvesDivision };
}

function safeEvaluate(expr: string): string | null {
    try {
        const { value, involvesDivision } = evaluateExpression(expr);
        if (!isFinite(value) || isNaN(value)) return 'Error';
        if (involvesDivision) {
            return formatDivisionResult(value);
        }
        // Format: avoid floating point noise for non-division ops
        const rounded = parseFloat(value.toPrecision(12));
        return rounded.toString();
    } catch {
        return null;
    }
}

/** Compute result locally (no backend) for live preview — simple 4-op */
function computeLocal(op: Operator, x: string, y: string): string | null {
    const xi = parseFloat(x);
    const yi = parseFloat(y);
    if (isNaN(xi) || isNaN(yi)) return null;
    try {
        switch (op) {
            case '+': {
                const xb = BigInt(Math.trunc(xi));
                const yb = BigInt(Math.trunc(yi));
                return (xb + yb).toString();
            }
            case '-': {
                const xb = BigInt(Math.trunc(xi));
                const yb = BigInt(Math.trunc(yi));
                return (xb - yb).toString();
            }
            case '*': {
                const xb = BigInt(Math.trunc(xi));
                const yb = BigInt(Math.trunc(yi));
                return (xb * yb).toString();
            }
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

    /**
     * Auto-calculated live result.
     * In expression mode: evaluate the full expression string.
     * In simple mode: compute locally when operand1 + operator + operand2 exists.
     */
    const autoResult = useMemo<string | null>(() => {
        if (state.isError || state.justCalculated) return null;

        if (state.expressionMode && state.fullExpression) {
            return safeEvaluate(state.fullExpression);
        }

        if (
            state.operator &&
            state.operand1 !== '' &&
            !state.waitingForOperand2 &&
            state.display !== '0' || (state.operator && state.operand1 !== '' && !state.waitingForOperand2 && !state.justCalculated && !state.isError)
        ) {
            if (!state.operator || state.operand1 === '' || state.waitingForOperand2 || state.justCalculated || state.isError) {
                return null;
            }
            return computeLocal(state.operator, state.operand1, state.display);
        }
        return null;
    }, [state]);

    const displayResult = autoResult !== null ? autoResult : state.display;
    const isAutoPreview = autoResult !== null && !state.justCalculated;

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------

    const handleDigit = useCallback((digit: string) => {
        setState(prev => {
            if (prev.isError) return { ...initialState, display: digit };

            if (prev.justCalculated) {
                return { ...initialState, display: digit };
            }

            if (prev.expressionMode) {
                const newFull = prev.fullExpression + digit;
                return { ...prev, fullExpression: newFull, display: digit };
            }

            if (prev.waitingForOperand2) {
                return { ...prev, display: digit, waitingForOperand2: false };
            }

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
                // Only add decimal if last token doesn't already have one
                const lastNum = prev.fullExpression.match(/[\d.]+$/);
                if (lastNum && lastNum[0].includes('.')) return prev;
                const newFull = prev.fullExpression + '.';
                return { ...prev, fullExpression: newFull, display: prev.display + '.' };
            }

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

    // -----------------------------------------------------------------------
    // Advanced handlers
    // -----------------------------------------------------------------------

    const handleSquare = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            const val = parseFloat(prev.display);
            if (isNaN(val)) return prev;
            const result = val * val;
            const rounded = parseFloat(result.toPrecision(12));
            return {
                ...initialState,
                display: rounded.toString(),
                expression: `(${prev.display})²`,
                justCalculated: true,
            };
        });
    }, []);

    const handleSqrt = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            const val = parseFloat(prev.display);
            if (isNaN(val)) return prev;
            if (val < 0) {
                return { ...prev, display: 'Error', expression: `√(${prev.display})`, isError: true };
            }
            const result = Math.sqrt(val);
            const rounded = parseFloat(result.toPrecision(12));
            return {
                ...initialState,
                display: rounded.toString(),
                expression: `√(${prev.display})`,
                justCalculated: true,
            };
        });
    }, []);

    const handleReciprocal = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            const val = parseFloat(prev.display);
            if (isNaN(val)) return prev;
            if (val === 0) {
                return { ...prev, display: 'Error', expression: `1/(${prev.display})`, isError: true };
            }
            const result = 1 / val;
            const rounded = parseFloat(result.toPrecision(12));
            return {
                ...initialState,
                display: rounded.toString(),
                expression: `1/(${prev.display})`,
                justCalculated: true,
            };
        });
    }, []);

    const handlePower = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            const base = prev.display;
            return {
                ...initialState,
                expressionMode: true,
                fullExpression: base + '^',
                display: base,
                expression: `${base}^`,
            };
        });
    }, []);

    const handleOpenParen = useCallback(() => {
        setState(prev => {
            if (prev.isError) return prev;
            if (prev.justCalculated) {
                return {
                    ...initialState,
                    expressionMode: true,
                    fullExpression: '(',
                    display: '0',
                    expression: '(',
                };
            }
            if (prev.expressionMode) {
                const newFull = prev.fullExpression + '(';
                return { ...prev, fullExpression: newFull, expression: newFull };
            }
            // Start expression mode from current display
            const newFull = prev.display !== '0' ? prev.display + '*(' : '(';
            return {
                ...prev,
                expressionMode: true,
                fullExpression: newFull,
                expression: newFull,
            };
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

    // -----------------------------------------------------------------------
    // Equals
    // -----------------------------------------------------------------------

    const handleEquals = useCallback(async () => {
        const currentState = await new Promise<CalcState>(resolve => {
            setState(prev => { resolve(prev); return prev; });
        });

        if (currentState.isError) return;

        // Expression mode: evaluate locally
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

        const opSymbol = currentState.operator === '+' ? '+' : currentState.operator === '-' ? '−' : currentState.operator === '*' ? '×' : '÷';
        const fullExpression = `${currentState.operand1} ${opSymbol} ${currentState.display} =`;

        // Division: compute float result client-side for full precision display,
        // still call backend to record history (backend stores integer result).
        if (currentState.operator === '/') {
            const floatResult = formatDivisionResult(x / y);
            setIsCalculating(true);
            try {
                // Call backend to save to history (integer result stored there)
                await divideMutation.mutateAsync({ x: xi, y: yi });
            } catch {
                // Ignore backend errors for division history; still show float result
            } finally {
                setIsCalculating(false);
            }
            setState({
                display: floatResult,
                expression: fullExpression,
                operator: null,
                operand1: floatResult,
                waitingForOperand2: false,
                justCalculated: true,
                isError: false,
                expressionMode: false,
                fullExpression: '',
            });
            return;
        }

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
                default:
                    setIsCalculating(false);
                    return;
            }

            setState({
                display: result.result.toString(),
                expression: fullExpression,
                operator: null,
                operand1: result.result.toString(),
                waitingForOperand2: false,
                justCalculated: true,
                isError: false,
                expressionMode: false,
                fullExpression: '',
            });
        } catch {
            setState(prev => ({
                ...prev,
                display: 'Error',
                expression: fullExpression,
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

            if (prev.expressionMode) {
                const newFull = prev.fullExpression.slice(0, -1);
                if (!newFull) return initialState;
                return { ...prev, fullExpression: newFull, expression: newFull };
            }

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

    const handleSelectResult = useCallback((result: string) => {
        setState({
            ...initialState,
            display: result,
            justCalculated: true,
        });
    }, []);

    // -----------------------------------------------------------------------
    // Keyboard support
    // -----------------------------------------------------------------------

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key >= '0' && e.key <= '9') { handleDigit(e.key); return; }
            if (e.key === '.') { handleDecimal(); return; }
            if (e.key === '+') { handleOperator('+'); return; }
            if (e.key === '-') { handleOperator('-'); return; }
            if (e.key === '*') { handleOperator('*'); return; }
            if (e.key === '/') { e.preventDefault(); handleOperator('/'); return; }
            if (e.key === 'Enter' || e.key === '=') { handleEquals(); return; }
            if (e.key === 'Escape') { handleClear(); return; }
            if (e.key === 'Backspace') { handleBackspace(); return; }
            if (e.key === '(') { handleOpenParen(); return; }
            if (e.key === ')') { handleCloseParen(); return; }
            if (e.key === '^') { handlePower(); return; }
            if (e.key === '%') { handlePercent(); return; }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDigit, handleDecimal, handleOperator, handleEquals, handleClear, handleBackspace, handleOpenParen, handleCloseParen, handlePower, handlePercent]);

    // -----------------------------------------------------------------------
    // Button click dispatcher — matches CalculatorKeypad's onButton(value, type) signature
    // -----------------------------------------------------------------------

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
                // negate
                handleNegate();
                break;
            case 'advanced':
                switch (value) {
                    case 'square':      handleSquare();      break;
                    case 'sqrt':        handleSqrt();        break;
                    case 'reciprocal':  handleReciprocal();  break;
                    case 'power':       handlePower();       break;
                    case '(':           handleOpenParen();   break;
                    case ')':           handleCloseParen();  break;
                    case 'percent':     handlePercent();     break;
                }
                break;
        }
    }, [
        handleDigit, handleDecimal, handleOperator, handleEquals,
        handleClear, handleBackspace, handleNegate,
        handleSquare, handleSqrt, handleReciprocal, handlePower,
        handleOpenParen, handleCloseParen, handlePercent,
    ]);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="flex flex-col lg:flex-row gap-4 w-full max-w-4xl mx-auto px-2">
            {/* Calculator */}
            <div className="flex-shrink-0 w-full lg:w-80">
                <div className="bg-calc-surface border border-calc-border rounded-2xl overflow-hidden shadow-calc">
                    <CalculatorDisplay
                        expression={state.expression}
                        result={displayResult}
                        isLoading={isLoading}
                        isError={state.isError}
                        isAutoPreview={isAutoPreview}
                    />
                    <CalculatorKeypad onButton={handleButton} isLoading={isLoading} />
                </div>
            </div>

            {/* History */}
            <div className="flex-1 min-w-0">
                <CalculatorHistory
                    history={history}
                    isLoading={isHistoryLoading}
                    onSelectResult={handleSelectResult}
                />
            </div>
        </div>
    );
}
