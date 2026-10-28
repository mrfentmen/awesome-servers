export declare class TidesError extends Error {
}
export declare function predictions(station: string, begin: string, end: string, interval?: "hilo" | "h", units?: string): Promise<any>;
export declare function waterLevels(station: string, begin: string, end: string, interval?: string, units?: string): Promise<any>;
export declare function format(data: any): string;
