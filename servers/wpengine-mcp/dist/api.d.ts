export declare class WpengineError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listInstalls(): Promise<string>;
export declare function getInstall(installId: string): Promise<string>;
export declare function listSites(): Promise<string>;
export declare function platformStatus(): Promise<string>;
export interface WpengineIncidentArgs {
    include_resolved?: boolean;
}
export declare function currentIncidents(args: WpengineIncidentArgs): Promise<string>;
export declare function upcomingMaintenance(): Promise<string>;
