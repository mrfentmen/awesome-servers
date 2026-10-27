export declare class RedditError extends Error {
}
export interface Post {
    id?: string;
    title: string;
    author?: string;
    subreddit?: string;
    score?: number;
    comments?: number;
    created?: string;
    url?: string;
    text?: string;
}
export declare function searchPosts(subreddit: string, query: string, sort?: "newest" | "oldest", limit?: number): Promise<Post[]>;
export interface RedditComment {
    author?: string;
    subreddit?: string;
    score?: number;
    created?: string;
    body: string;
}
export declare function searchComments(subreddit: string, query: string, limit?: number): Promise<RedditComment[]>;
export declare function formatPost(p: Post, index?: number): string;
export declare function formatComment(c: RedditComment, index?: number): string;
export declare function userPosts(author: string, limit?: number): Promise<Post[]>;
export declare function subredditPosts(subreddit: string, sort?: "newest" | "oldest", limit?: number): Promise<Post[]>;
