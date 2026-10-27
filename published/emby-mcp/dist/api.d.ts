export declare class EmbyError extends Error {
}
export interface ServerInfo {
    name?: string;
    version?: string;
    id?: string;
}
export declare function serverInfo(): Promise<ServerInfo>;
export interface EmbyUser {
    id: string;
    name?: string;
    admin?: boolean;
    lastActive?: string;
}
export declare function listUsers(): Promise<EmbyUser[]>;
export interface Library {
    id: string;
    name?: string;
    type?: string;
}
export declare function listLibraries(): Promise<Library[]>;
export declare function formatUser(u: EmbyUser, index?: number): string;
export declare function formatLibrary(l: Library, index?: number): string;
