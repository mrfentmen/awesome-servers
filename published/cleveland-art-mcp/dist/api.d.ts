export declare class ClevelandError extends Error {
}
export declare function searchArtworks(query: string, limit: number, onlyImages?: boolean): Promise<string>;
export declare function artworkDetail(id: number): Promise<string>;
/**
 * There is no departments endpoint; the department filter takes the display
 * name and this server passes it straight through.
 */
export declare function byDepartment(department: string, limit: number): Promise<string>;
export declare function highlights(limit: number): Promise<string>;
export declare function byCreator(name: string, limit: number): Promise<string>;
