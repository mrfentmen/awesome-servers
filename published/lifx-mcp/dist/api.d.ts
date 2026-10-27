export declare class LifxError extends Error {
}
export interface Light {
    id: string;
    label?: string;
    power?: string;
    brightness?: number;
    connected?: boolean;
    color?: string;
}
export declare function listLights(): Promise<Light[]>;
export declare function setPower(selector: string, power: "on" | "off" | "toggle", brightness?: number): Promise<string>;
export declare function formatLight(l: Light, index?: number): string;
export interface LifxColorArgs {
    kelvin?: number;
    hex?: string;
    hue?: number;
    saturation?: number;
    brightness?: number;
}
export interface LifxScheduleArgs {
    keyframes: Array<{
        at: string;
        kelvin: number;
        brightness: number;
    }>;
    start?: string;
    end?: string;
    step_minutes?: number;
}
export declare function kelvinSchedule(args: LifxScheduleArgs): Promise<string>;
