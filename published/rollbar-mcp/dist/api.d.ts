export declare class RollbarError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listProjects(): Promise<string>;
export declare function listItems(projectId: string): Promise<string>;
export declare function getItem(projectId: string, itemId: string): Promise<string>;
