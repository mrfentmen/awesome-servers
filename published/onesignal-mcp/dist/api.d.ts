export declare class OneSignalError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listApps(): Promise<string>;
export declare function getApp(appId: string): Promise<string>;
export declare function listNotifications(appId: string, limit?: string): Promise<string>;
/** Which OneSignal SDK people actually install, and how big each one is. */
export declare function pushSdkPopularity(_args: Record<string, never>): Promise<string>;
