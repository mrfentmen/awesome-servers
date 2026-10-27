export declare class TasmotaError extends Error {
}
export declare function fullStatus(): Promise<string>;
export declare function setPower(state: "on" | "off" | "toggle", outlet?: number): Promise<string>;
export declare function readSensor(): Promise<string>;
interface TasmotaTopicArgs {
    device_name?: string;
    topic?: string;
    prefix?: string;
    suffix?: string;
    full_topic?: string;
}
export declare function mqttTopics(args: TasmotaTopicArgs): Promise<string>;
export interface TasmotaStep {
    power?: "on" | "off" | "toggle";
    outlet?: number;
    dimmer?: number;
    speed?: number;
    color?: string;
    color_temp?: number;
    delay?: number;
}
export interface TasmotaCmdArgs {
    steps: TasmotaStep[];
    url?: string;
}
export declare function cmndPayload(args: TasmotaCmdArgs): Promise<string>;
export {};
