export declare class SwitchbotError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listDevices(): Promise<string>;
export declare function getDeviceStatus(deviceId: string): Promise<string>;
export declare function sendCommand(deviceId: string, command: string, parameter?: string, commandType?: string): Promise<string>;
