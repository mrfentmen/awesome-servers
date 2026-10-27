export declare class ApexlegendsError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getPlayer(player: string, platform?: string): Promise<string>;
export declare function getPlayerByUid(uid: string, platform?: string): Promise<string>;
export declare function getMapRotation(): Promise<string>;
export declare function getCraftingRotation(): Promise<string>;
export declare function getPredatorCounts(): Promise<string>;
export declare function getServerStatus(): Promise<string>;
