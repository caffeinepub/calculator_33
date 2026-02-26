import React from 'react';
import { Clock, Trash2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { HistoryEntry } from '@/hooks/useQueries';
import { useClearHistory } from '@/hooks/useQueries';

interface CalculatorHistoryProps {
    history: HistoryEntry[];
    isLoading: boolean;
    onSelectResult?: (result: string) => void;
}

function formatTimestamp(ts: number): string {
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

export function CalculatorHistory({ history, isLoading, onSelectResult }: CalculatorHistoryProps) {
    const clearHistory = useClearHistory();

    const handleClear = () => {
        clearHistory.mutate();
    };

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
                <div className="flex flex-col">
                    <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: 'oklch(0.6 0 0)' }}>
                        History
                    </span>
                    <span className="text-xs" style={{ color: 'oklch(0.38 0 0)' }}>
                        Last 7 days
                    </span>
                </div>

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

                {/* Clear History Button */}
                {history.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                disabled={clearHistory.isPending}
                                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150 disabled:opacity-50"
                                style={{
                                    background: 'oklch(0.2 0 0)',
                                    border: '1px solid oklch(0.28 0 0)',
                                    color: 'oklch(0.55 0.15 25)',
                                    marginLeft: history.length > 0 ? '0.25rem' : 'auto',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'oklch(0.22 0.04 25)';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.65 0.2 25 / 0.4)';
                                    (e.currentTarget as HTMLElement).style.color = 'oklch(0.7 0.2 25)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'oklch(0.2 0 0)';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.28 0 0)';
                                    (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.15 25)';
                                }}
                                title="Clear history"
                                aria-label="Clear history"
                            >
                                {clearHistory.isPending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                            style={{
                                background: 'oklch(0.15 0 0)',
                                border: '1px solid oklch(0.25 0 0)',
                                color: 'oklch(0.85 0 0)',
                            }}
                        >
                            <AlertDialogHeader>
                                <AlertDialogTitle style={{ color: 'oklch(0.9 0 0)' }}>
                                    Clear all history?
                                </AlertDialogTitle>
                                <AlertDialogDescription style={{ color: 'oklch(0.5 0 0)' }}>
                                    This will permanently delete all {history.length} calculation{history.length !== 1 ? 's' : ''} from your history. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    style={{
                                        background: 'oklch(0.2 0 0)',
                                        border: '1px solid oklch(0.28 0 0)',
                                        color: 'oklch(0.65 0 0)',
                                    }}
                                >
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleClear}
                                    style={{
                                        background: 'oklch(0.35 0.12 25)',
                                        border: '1px solid oklch(0.5 0.18 25 / 0.4)',
                                        color: 'oklch(0.9 0.1 25)',
                                    }}
                                >
                                    Clear History
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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
                                    className="h-14 rounded-lg animate-pulse"
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
                            <p className="text-xs text-center" style={{ color: 'oklch(0.32 0 0)' }}>
                                History syncs when online
                            </p>
                        </div>
                    ) : (
                        history.map((entry, idx) => (
                            <button
                                key={idx}
                                onClick={() => onSelectResult?.(entry.result)}
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
                                {/* Timestamp row */}
                                <div
                                    className="text-xs font-mono mb-0.5 text-left"
                                    style={{ color: 'oklch(0.38 0 0)' }}
                                >
                                    {formatTimestamp(entry.timestamp)}
                                </div>
                                {/* Expression row */}
                                <div
                                    className="text-xs font-mono mb-0.5 truncate"
                                    style={{ color: 'oklch(0.5 0 0)' }}
                                >
                                    {entry.expression}
                                </div>
                                {/* Result row */}
                                <div
                                    className="text-base font-mono font-semibold"
                                    style={{ color: idx === 0 ? 'oklch(0.85 0.22 142)' : 'oklch(0.75 0 0)' }}
                                >
                                    = {entry.result}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
