export declare class SwapiError extends Error {
}
export declare const RESOURCES: readonly ["people", "planets", "films", "starships", "vehicles", "species"];
export type Resource = (typeof RESOURCES)[number];
export declare function search(resource: Resource, query: string, limit: number): Promise<string>;
export declare function detail(resource: Resource, id: number): Promise<string>;
export declare function listAll(resource: Resource, limit: number): Promise<string>;
export declare function personFilms(id: number): Promise<string>;
export declare function filmChronicle(): Promise<string>;
