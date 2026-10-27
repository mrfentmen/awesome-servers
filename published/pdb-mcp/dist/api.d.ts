export declare class PdbError extends Error {
}
export declare function searchStructures(query: string, limit: number): Promise<string>;
export declare function structureSummary(id: string): Promise<string>;
export declare function structureChains(id: string): Promise<string>;
export declare function structureLigands(id: string): Promise<string>;
export declare function ligandInfo(compId: string): Promise<string>;
export declare function structureCitation(id: string): Promise<string>;
