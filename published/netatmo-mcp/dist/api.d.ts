export declare class NetatmoError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getWeatherStations(): Promise<string>;
export declare function getHomeData(): Promise<string>;
export declare function getHomeStatus(homeId: string): Promise<string>;
export declare function getEvents(homeId: string): Promise<string>;
