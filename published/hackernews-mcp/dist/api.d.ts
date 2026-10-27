export declare class HnError extends Error {
}
export interface Item {
    id?: number;
    type?: string;
    by?: string;
    time?: number;
    title?: string;
    url?: string;
    text?: string;
    score?: number;
    descendants?: number;
    kids?: number[];
    deleted?: boolean;
    dead?: boolean;
}
export interface User {
    id?: string;
    created?: number;
    karma?: number;
    about?: string;
    submitted?: number[];
}
export interface Hit {
    objectID?: string;
    title?: string;
    url?: string;
    author?: string;
    points?: number;
    num_comments?: number;
    created_at?: string;
    story_text?: string;
    comment_text?: string;
    _tags?: string[];
}
export declare function ids(kind: "topstories" | "newstories" | "beststories", limit: number): Promise<number[]>;
export declare function item(id: number): Promise<Item | undefined>;
export declare function user(id: string): Promise<User | undefined>;
export declare function search(query: string, tags: string, limit: number): Promise<Hit[]>;
export declare function itemText(it: Item): string;
export declare function hitText(h: Hit): string;
