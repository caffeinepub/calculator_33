import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalculatorHistoryProps {
    history: Array<[string, string]>;
    isLoading: boolean;
    onSelectResult?: (result: string) => void;
}

export function CalculatorHistory({ history, isLoading, onSelectResult }: CalculatorHistoryProps) {
    return (
        <div
            className="flex flex-col h-full rounded-xl overflow-hidden"
            style={{
                background: 'oklch(0.15 0 0)',
                border: '1px solid oklch(0.22 0 0)',
            }}
        >
            {/* Header */}
            <div
                className="flex items-center gap-2 px-4 py-3 shrink-0"
                style={{
                    borderBottom: '1px solid oklch(0.22 0 0)',
                    background: 'oklch(0.17 0 0)',
                }}
            >
                <Clock className="w-4 h-4" style={{ color: 'oklch(0.85 0.22 142)' }} />
                <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: 'oklch(0.6 0 0)' }}>
                    History
                </span>
                {history.length > 0 && (
                    <span
                        className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono"
                        style={{
                            background: 'oklch(0.85 0.22 142 / 0.15)',
                            color: 'oklch(0.85 0.22 142)',
                            border: '1px solid oklch(0.85 0.22 142 / 0.2)',
                        }}
                    >
                        {history.length}
                    </span>
                )}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {isLoading ? (
                        <div className="space-y-2 p-2">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-12 rounded-lg animate-pulse"
                                    style={{ background: 'oklch(0.2 0 0)' }}
                                />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ background: 'oklch(0.2 0 0)' }}
                            >
                                <Clock className="w-5 h-5" style={{ color: 'oklch(0.4 0 0)' }} />
                            </div>
                            <p className="text-sm text-center" style={{ color: 'oklch(0.4 0 0)' }}>
                                No calculations yet
                            </p>
                        </div>
                    ) : (
                        history.map(([expression, result], idx) => (
                            <button
                                key={idx}
                                onClick={() => onSelectResult?.(result)}
                                className="w-full text-right px-3 py-2.5 rounded-lg transition-all duration-150 group"
                                style={{
                                    background: idx === 0 ? 'oklch(0.2 0.02 142)' : 'oklch(0.19 0 0)',
                                    border: idx === 0
                                        ? '1px solid oklch(0.85 0.22 142 / 0.2)'
                                        : '1px solid oklch(0.24 0 0)',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'oklch(0.22 0.02 142)';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.85 0.22 142 / 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = idx === 0 ? 'oklch(0.2 0.02 142)' : 'oklch(0.19 0 0)';
                                    (e.currentTarget as HTMLElement).style.borderColor = idx === 0 ? 'oklch(0.85 0.22 142 / 0.2)' : 'oklch(0.24 0 0)';
                                }}
                            >
                                <div
                                    className="text-xs font-mono mb-0.5 truncate"
                                    style={{ color: 'oklch(0.5 0 0)' }}
                                >
                                    {expression}
                                </div>
                                <div
                                    className="text-base font-mono font-semibold"
                                    style={{ color: idx === 0 ? 'oklch(0.85 0.22 142)' : 'oklch(0.75 0 0)' }}
                                >
                                    = {result}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
