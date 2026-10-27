export declare class StapiError extends Error {
}
export interface CharacterHit {
    uid: string;
    name: string;
}
export declare function searchCharacters(name: string, limit?: number): Promise<CharacterHit[]>;
export interface CharacterDetails extends CharacterHit {
    gender?: string;
    birthYear?: number;
    birthPlace?: string;
    height?: number;
    maritalStatus?: string;
    serialNumber?: string;
}
export declare function getCharacter(uid: string): Promise<CharacterDetails | null>;
export declare function formatCharacter(c: CharacterDetails | CharacterHit, index?: number): string;
