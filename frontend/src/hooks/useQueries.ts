import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

export interface CalculationResult {
    result: bigint;
    expression: string;
}

export interface HistoryEntry {
    expression: string;
    result: string;
    timestamp: number; // Unix ms
}

// Local fallback computation helpers
function localAdd(x: bigint, y: bigint): CalculationResult {
    return { result: x + y, expression: `${x} + ${y}` };
}
function localSubtract(x: bigint, y: bigint): CalculationResult {
    return { result: x - y, expression: `${x} - ${y}` };
}
function localMultiply(x: bigint, y: bigint): CalculationResult {
    return { result: x * y, expression: `${x} * ${y}` };
}
function localDivide(x: bigint, y: bigint): CalculationResult {
    if (y === 0n) throw new Error('Division by zero');
    return { result: x / y, expression: `${x} / ${y}` };
}

// Local timestamp cache: maps "expression=result" to timestamp (ms)
const LOCAL_HISTORY_KEY = 'calc_history_timestamps';

function getLocalTimestamps(): Record<string, number> {
    try {
        const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveLocalTimestamp(expression: string, result: string) {
    try {
        const cache = getLocalTimestamps();
        const key = `${expression}=${result}`;
        // Only set if not already present (keep oldest timestamp for duplicates)
        if (!cache[key]) {
            cache[key] = Date.now();
        }
        // Prune entries older than 7 days
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        for (const k of Object.keys(cache)) {
            if (now - cache[k] > sevenDaysMs) {
                delete cache[k];
            }
        }
        localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(cache));
    } catch {
        // ignore storage errors
    }
}

function clearLocalTimestamps() {
    try {
        localStorage.removeItem(LOCAL_HISTORY_KEY);
    } catch {
        // ignore storage errors
    }
}

function mergeTimestamps(entries: Array<[string, string]>): HistoryEntry[] {
    const cache = getLocalTimestamps();
    const now = Date.now();
    return entries.map(([expression, result]) => {
        const key = `${expression}=${result}`;
        const ts = cache[key] ?? now;
        return { expression, result, timestamp: ts };
    });
}

export function useGetHistory() {
    const { actor, isFetching } = useActor();

    return useQuery<HistoryEntry[]>({
        queryKey: ['history'],
        queryFn: async () => {
            if (!actor) return [];
            try {
                const raw = await actor.getHistory();
                return mergeTimestamps(raw);
            } catch {
                return [];
            }
        },
        enabled: !!actor && !isFetching,
        refetchInterval: false,
        retry: false,
        throwOnError: false,
    });
}

export function useClearHistory() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        retry: false,
        mutationFn: async (): Promise<void> => {
            if (!actor) throw new Error('Actor not available');
            await actor.clearHistory();
            clearLocalTimestamps();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] }).catch(() => {});
        },
        onError: () => {},
        throwOnError: false,
    });
}

export function useAdd() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        retry: false,
        mutationFn: async ({ x, y }: { x: bigint; y: bigint }): Promise<CalculationResult> => {
            if (!actor) {
                return localAdd(x, y);
            }
            try {
                const res = await actor.add(x, y);
                saveLocalTimestamp(res.expression, res.result.toString());
                return { result: res.result, expression: res.expression };
            } catch {
                return localAdd(x, y);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] }).catch(() => {});
        },
        onError: () => {},
        throwOnError: false,
    });
}

export function useSubtract() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        retry: false,
        mutationFn: async ({ x, y }: { x: bigint; y: bigint }): Promise<CalculationResult> => {
            if (!actor) {
                return localSubtract(x, y);
            }
            try {
                const res = await actor.subtract(x, y);
                saveLocalTimestamp(res.expression, res.result.toString());
                return { result: res.result, expression: res.expression };
            } catch {
                return localSubtract(x, y);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] }).catch(() => {});
        },
        onError: () => {},
        throwOnError: false,
    });
}

export function useMultiply() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        retry: false,
        mutationFn: async ({ x, y }: { x: bigint; y: bigint }): Promise<CalculationResult> => {
            if (!actor) {
                return localMultiply(x, y);
            }
            try {
                const res = await actor.multiply(x, y);
                saveLocalTimestamp(res.expression, res.result.toString());
                return { result: res.result, expression: res.expression };
            } catch {
                return localMultiply(x, y);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] }).catch(() => {});
        },
        onError: () => {},
        throwOnError: false,
    });
}

export function useDivide() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        retry: false,
        mutationFn: async ({ x, y }: { x: bigint; y: bigint }): Promise<CalculationResult> => {
            // Always validate division by zero locally first
            if (y === 0n) throw new Error('Division by zero');

            if (!actor) {
                return localDivide(x, y);
            }
            try {
                const res = await actor.divide(x, y);
                saveLocalTimestamp(res.expression, res.result.toString());
                return { result: res.result, expression: res.expression };
            } catch (err) {
                // Re-throw division by zero so Calculator can show Error state
                if (err instanceof Error && err.message.includes('Division by zero')) {
                    throw err;
                }
                // Network/canister error → fall back to local
                return localDivide(x, y);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] }).catch(() => {});
        },
        onError: () => {},
        throwOnError: false,
    });
}
