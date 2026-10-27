export interface PetState {
    name: string;
    hunger: number;
    happiness: number;
    energy: number;
    health: number;
    age: number;
    mood: string;
    lastFed: string;
    lastPlayed: string;
    createdAt: string;
}
export declare function createPet(name: string): Promise<PetState>;
export declare function loadPet(): Promise<PetState | null>;
export declare function savePet(state: PetState): Promise<void>;
export declare function feedPet(): Promise<PetState>;
export declare function playWithPet(): Promise<PetState>;
export declare function restPet(): Promise<PetState>;
export declare function healPet(): Promise<PetState>;
export declare function checkPet(): Promise<PetState>;
export declare function agePet(): Promise<PetState>;
export declare function deletePet(): Promise<boolean>;
