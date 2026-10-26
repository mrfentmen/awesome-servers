export interface Pin {
    cid: string;
    name?: string;
    size?: number;
    date?: string;
}
export declare function listPins(limit?: number): Promise<{
    count: number;
    pins: Pin[];
}>;
export declare function pinJson(name: string, content: string): Promise<string>;
export declare function unpin(cid: string): Promise<string>;
export declare function formatPin(p: Pin, index?: number): string;
