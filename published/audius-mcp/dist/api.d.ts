export declare class AudiusError extends Error {
}
export interface AudiusTrack {
    id: string;
    title: string;
    genre?: string;
    mood?: string;
    duration?: number;
    play_count?: number;
    release_date?: string;
    permalink?: string;
    user?: {
        name?: string;
        handle?: string;
    };
}
export interface AudiusUser {
    id: string;
    name: string;
    handle: string;
    bio?: string;
    follower_count?: number;
    followee_count?: number;
    track_count?: number;
    is_verified?: boolean;
}
export declare function trendingTracks(genre?: string, limit?: number): Promise<AudiusTrack[]>;
export declare function searchTracks(query: string, limit?: number): Promise<AudiusTrack[]>;
export declare function searchUsers(query: string, limit?: number): Promise<AudiusUser[]>;
export declare function getUserTracks(userId: string, limit?: number): Promise<AudiusTrack[]>;
export declare function fmtDur(sec?: number): string;
export declare function formatTrack(t: AudiusTrack, index?: number): string;
export declare function formatUser(u: AudiusUser, index?: number): string;
