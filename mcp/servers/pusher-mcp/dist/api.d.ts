export declare class PusherError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listChannels(prefix?: string, limit?: string): Promise<string>;
export declare function getChannel(channel: string): Promise<string>;
export declare function getChannelUsers(channel: string): Promise<string>;
