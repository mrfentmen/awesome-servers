export declare class SuuntoError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listWorkouts(limit?: number, offset?: number): Promise<string>;
export declare function getWorkout(workoutId: string): Promise<string>;
