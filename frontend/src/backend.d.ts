import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface backendInterface {
    add(x: bigint, y: bigint): Promise<{
        result: bigint;
        expression: string;
    }>;
    clearHistory(): Promise<void>;
    divide(x: bigint, y: bigint): Promise<{
        result: bigint;
        expression: string;
    }>;
    getHistory(): Promise<Array<[string, string]>>;
    multiply(x: bigint, y: bigint): Promise<{
        result: bigint;
        expression: string;
    }>;
    subtract(x: bigint, y: bigint): Promise<{
        result: bigint;
        expression: string;
    }>;
}
