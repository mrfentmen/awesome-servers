export declare class NtfyError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function publish(topic: string, message: string): Promise<string>;
export declare function poll(topic: string): Promise<string>;
export declare function health(): Promise<string>;
export declare function account(): Promise<string>;
export declare function pollSince(topic: string, sinceId: string): Promise<string>;
export declare function sendUrgent(topic: string, message: string): Promise<string>;
export declare function sendScheduled(topic: string, message: string, delay: string): Promise<string>;
export declare function sendEmail(topic: string, message: string, email: string): Promise<string>;
export declare function sendCall(topic: string, message: string, phone: string): Promise<string>;
export declare function publishTags(topic: string, message: string, tags: string): Promise<string>;
/** What this ntfy server will and will not let you do, read from its public config. */
export declare function ntfyServerCapabilities(_args: {
    topic?: string;
}): Promise<string>;
/** Read back what a public topic has already published, with no token. */
export declare function topicMessageHistory(args: {
    topic: string;
    hours?: number;
    limit?: number;
}): Promise<string>;
