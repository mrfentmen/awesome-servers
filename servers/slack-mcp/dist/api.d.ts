export declare class SlackError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listChannels(limit?: string): Promise<string>;
export declare function getHistory(channel: string, limit?: string): Promise<string>;
export declare function postMessage(channel: string, text: string): Promise<string>;
export declare function listUsers(limit?: string): Promise<string>;
export declare function userInfo(user: string): Promise<string>;
export declare function channelInfo(channel: string): Promise<string>;
export declare function threadReplies(channel: string, ts: string): Promise<string>;
export declare function emojiList(): Promise<string>;
export declare function pinMessage(channel: string, timestamp: string): Promise<string>;
export declare function setTopic(channel: string, topic: string): Promise<string>;
/**
 * The published incident record for one Slack service: how often it has been
 * hit, when, how long the record runs, and what the last update said. Useful
 * before blaming an outage on a workspace's own configuration.
 */
export declare function serviceIncidentHistory(args: {
    service: string;
    limit?: number;
}): Promise<string>;
/**
 * The whole published record ranked by which service was hit most often, so a
 * workspace can see whether its own complaints fall in a service Slack already
 * knows is fragile.
 */
export declare function incidentServiceRanking(args: {
    days?: number;
}): Promise<string>;
