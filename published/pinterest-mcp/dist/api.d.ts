export declare class PinterestError extends Error {
}
export interface Account {
    username?: string;
    profileImage?: string;
    websiteUrl?: string;
}
export declare function myAccount(): Promise<Account>;
export interface Board {
    id: string;
    name?: string;
    description?: string;
    pinCount?: number;
    url?: string;
}
export declare function listBoards(limit?: number): Promise<Board[]>;
export declare function getBoard(id: string): Promise<Board>;
export interface Pin {
    id: string;
    title?: string;
    description?: string;
    link?: string;
    image?: string;
}
export declare function boardPins(id: string, limit?: number): Promise<Pin[]>;
export declare function getPin(id: string): Promise<Pin>;
export declare function formatBoard(b: Board, index?: number): string;
export declare function formatPin(p: Pin, index?: number): string;
/**
 * How the openly licensed image index is made up: which source holds how much,
 * which licences dominate, and the biggest images in the collection.
 */
export declare function imageSources(args: {
    query: string;
    limit?: number;
}): Promise<string>;
