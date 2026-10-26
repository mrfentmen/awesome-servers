export declare class StatuspageError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listPages(): Promise<string>;
export declare function getPage(pageId: string): Promise<string>;
export declare function listIncidents(pageId: string): Promise<string>;
export declare function incidentDetails(pageId: string, incidentId: string): Promise<string>;
export declare function incidentUpdates(pageId: string, incidentId: string): Promise<string>;
export declare function components(pageId: string): Promise<string>;
export declare function componentDetails(pageId: string, componentId: string): Promise<string>;
export declare function subscribers(pageId: string): Promise<string>;
export declare function upcomingMaintenance(pageId: string): Promise<string>;
export declare function maintenanceDetails(pageId: string, maintenanceId: string): Promise<string>;
