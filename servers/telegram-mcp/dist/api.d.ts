export declare class TelegramError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getMe(): Promise<string>;
export declare function sendMessage(chatId: string, text: string): Promise<string>;
export declare function getUpdates(limit?: string): Promise<string>;
export declare function chatInfo(chatId: string): Promise<string>;
export declare function memberCount(chatId: string): Promise<string>;
export declare function fileInfo(fileId: string): Promise<string>;
export declare function sendPhoto(chatId: string, photoUrl: string, caption?: string): Promise<string>;
export declare function myCommands(): Promise<string>;
export declare function deleteMessage(chatId: string, messageId: string): Promise<string>;
export declare function editMessage(chatId: string, messageId: string, message: string): Promise<string>;
/** Check a message against the hard limits the Bot API enforces at send time. */
export declare function messageLimitAudit(args: {
    text?: string;
    parse_mode?: string;
    caption?: string;
}): Promise<string>;
/** Build a t.me link correctly, which is mostly a matter of encoding it correctly. */
export declare function deepLinkBuilder(args: {
    username?: string;
    payload?: string;
    url?: string;
    text?: string;
    kind?: string;
}): Promise<string>;
/** The limits that bite when you build an inline keyboard. */
export declare function inlineKeyboardAudit(args: {
    keyboard?: string;
}): Promise<string>;
