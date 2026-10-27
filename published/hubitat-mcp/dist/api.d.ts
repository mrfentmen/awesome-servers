export declare class HubitatError extends Error {
}
export interface Device {
    id: string;
    name?: string;
    label?: string;
    type?: string;
}
export declare function listDevices(): Promise<Device[]>;
export declare function deviceStatus(id: string): Promise<string>;
export declare function sendCommand(id: string, command: string, value?: string): Promise<string>;
export declare function formatDevice(d: Device, index?: number): string;
/** The Hubitat Community, searched through its public Discourse search API. */
export declare function communitySearch(args: {
    query?: string;
    category?: number;
    results?: number;
}): Promise<string>;
