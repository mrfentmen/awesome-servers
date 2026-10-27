export declare class EcobeeError extends Error {
}
export interface Thermostat {
    id: string;
    name?: string;
    model?: string;
    tempF?: number;
    humidity?: number;
    mode?: string;
    sensors: string[];
}
export declare function listThermostats(): Promise<Thermostat[]>;
export declare function formatThermostat(t: Thermostat, index?: number): string;
/** Degree-hour arithmetic for an overnight heating setpoint: how far the house has to be pulled back up, and the runtime that takes. */
export declare function setpointAudit(args: {
    indoorC?: number;
    setbackC?: number;
    outdoorLowC?: number;
    outdoorHighC?: number;
    hours?: number;
    runtimeRateC?: number;
}): Promise<string>;
