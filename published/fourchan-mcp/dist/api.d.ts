export declare class ChanError extends Error {
}
export interface Board {
    board: string;
    title: string;
    sfw: boolean;
    description?: string;
}
export interface ThreadSummary {
    no: number;
    sub?: string;
    com?: string;
    replies: number;
    images: number;
    lastModified?: number;
}
export interface Post {
    no: number;
    com?: string;
    name?: string;
    time?: number;
    replies?: number;
    images?: number;
    filename?: string;
    tim?: number;
    ext?: string;
    w?: number;
    h?: number;
}
export declare function listBoards(): Promise<Board[]>;
export declare function getCatalog(board: string): Promise<ThreadSummary[]>;
export declare function getThread(board: string, threadNo: number): Promise<Post[]>;
export declare function fmtChanTime(ts?: number): string;
export declare function formatThreadSummary(t: ThreadSummary, index: number): string;
export declare function formatPost(p: Post): string;
/**
 * The per-board limits 4chan publishes in `/boards.json`: paging, bump and image
 * caps, upload ceilings, cooldowns and whether the board is archived.
 */
export declare function boardConfig(args: {
    board: string;
}): Promise<string>;
