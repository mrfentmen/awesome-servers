export declare class OpsgenieError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listAlerts(limit?: string): Promise<string>;
export declare function getAlert(alertId: string): Promise<string>;
export declare function listOnCalls(): Promise<string>;
interface OpsgenieStep {
    after_minutes: number;
    targets: string[];
}
interface OpsgenieResponder {
    name: string;
    offset_hours: number;
    start_hour: number;
    end_hour: number;
}
/**
 * Work out who actually gets woken up by an escalation policy, accounting for
 * each responder's working hours. A policy that pages a team with nobody on
 * shift is a coverage gap, and that is the point of this tool.
 */
export declare function escalationTimeline(args: {
    alert_time?: string;
    steps?: OpsgenieStep[];
    responders?: OpsgenieResponder[];
    repeats?: number;
}): Promise<string>;
/** How Opsgenie's own platform has been behaving, per region and product area. */
export declare function platformReliability(_args: Record<string, never>): Promise<string>;
/** The incident history as operational numbers, not a list to scroll. */
export declare function incidentResponseStats(args: {
    limit?: number;
}): Promise<string>;
export {};
