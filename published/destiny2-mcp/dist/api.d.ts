export declare class Destiny2Error extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchPlayer(displayName: string, membershipType?: number): Promise<string>;
export declare function getProfile(membershipType: number, membershipId: string, components?: string): Promise<string>;
export declare function getCharacter(membershipType: number, membershipId: string, characterId: string, components?: string): Promise<string>;
export declare function getMilestones(): Promise<string>;
export declare function getManifest(): Promise<string>;
