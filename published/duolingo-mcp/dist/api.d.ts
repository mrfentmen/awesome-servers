export declare class DuolingoError extends Error {
}
export interface DuoProfile {
    username: string;
    streak?: number;
    totalXp?: number;
    courses: string[];
    achievements: string[];
}
export declare function getProfile(username: string): Promise<DuoProfile>;
export declare function formatProfile(p: DuoProfile): string;
export interface ProfileDetailsArgs {
    username: string;
}
