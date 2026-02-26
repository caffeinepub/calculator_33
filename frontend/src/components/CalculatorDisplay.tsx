import React from 'react';

interface CalculatorDisplayProps {
    expression: string;
    result: string;
    isError: boolean;
    isLoading: boolean;
    /** When true, the result shown is a live auto-calculated preview (not yet confirmed with =) */
    isAutoPreview?: boolean;
}

export function CalculatorDisplay({ expression, result, isError, isLoading, isAutoPreview = false }: CalculatorDisplayProps) {
    const displayResult = result || '0';
    const isLong = displayResult.length > 10;
    const isVeryLong = displayResult.length > 15;

    return (
        <div
            className="relative w-full rounded-xl overflow-hidden mb-4"
            style={{
                background: 'oklch(0.1 0 0)',
                border: '1px solid oklch(0.25 0 0)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3)',
            }}
        >
            {/* Scanline effect overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
                }}
            />

            <div className="relative px-5 pt-4 pb-5">
                {/* Expression line */}
                <div className="min-h-[1.5rem] mb-1 text-right overflow-hidden">
                    <span
                        className="font-mono text-sm tracking-wide truncate block"
                        style={{ color: 'oklch(0.5 0 0)' }}
                    >
                        {expression || '\u00A0'}
                    </span>
                </div>

                {/* Main result */}
                <div className="text-right overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-end gap-1.5 h-12">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="w-2 h-2 rounded-full animate-pulse"
                                    style={{
                                        background: 'oklch(0.85 0.22 142)',
                                        animationDelay: `${i * 0.15}s`,
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <span
                            className={`font-mono font-semibold tracking-tight block leading-none transition-all duration-100 ${
                                isVeryLong ? 'text-2xl' : isLong ? 'text-3xl' : 'text-4xl'
                            } ${isError ? '' : isAutoPreview ? '' : 'neon-text-glow'}`}
                            style={{
                                color: isError
                                    ? 'oklch(0.65 0.22 25)'
                                    : isAutoPreview
                                        ? 'oklch(0.72 0.16 142)'
                                        : 'oklch(0.92 0.18 142)',
                                wordBreak: 'break-all',
                                textShadow: isAutoPreview && !isError
                                    ? '0 0 8px oklch(0.72 0.16 142 / 0.4)'
                                    : undefined,
                            }}
                        >
                            {displayResult}
                        </span>
                    )}
                </div>

                {/* Auto-preview indicator */}
                {isAutoPreview && !isError && !isLoading && (
                    <div className="flex justify-end mt-1">
                        <span
                            className="font-mono text-xs tracking-widest"
                            style={{ color: 'oklch(0.45 0.1 142)' }}
                        >
                            preview
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom accent line */}
            <div
                className="h-0.5 w-full"
                style={{
                    background: isAutoPreview && !isError
                        ? 'linear-gradient(90deg, transparent, oklch(0.72 0.16 142 / 0.3), transparent)'
                        : 'linear-gradient(90deg, transparent, oklch(0.85 0.22 142 / 0.4), transparent)',
                }}
            />
        </div>
    );
}
