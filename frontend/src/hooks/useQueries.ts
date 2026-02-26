import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

export interface CalculationResult {
    result: bigint;
    expression: string;
}

export function useGetHistory() {
    const { actor, isFetching } = useActor();

    return useQuery<Array<[string, string]>>({
        queryKey: ['history'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getHistory();
        },
        enabled: !!actor && !isFetching,
        refetchInterval: false,
    });
}

export function useAdd() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ x, y }: { x: bigint; y: bigint }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.add(x, y);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] });
        },
    });
}

export function useSubtract() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ x, y }: { x: bigint; y: bigint }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.subtract(x, y);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] });
        },
    });
}

export function useMultiply() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ x, y }: { x: bigint; y: bigint }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.multiply(x, y);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] });
        },
    });
}

export function useDivide() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ x, y }: { x: bigint; y: bigint }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.divide(x, y);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] });
        },
    });
}
