/**
 * Message storage implementation using SQLite
 * Stores SMS/MMS messages and links them to conversations
 */
import type { Message } from '../types/models.js';
export declare class MessageStore {
    private db;
    constructor(dbPath?: string);
    /**
     * Initialize database schema
     */
    private initialize;
    /**
     * Store a new message
     */
    create(message: Omit<Message, 'timestamp'> & {
        timestamp?: Date;
    }): Message;
    /**
     * Get message by SID
     */
    getBySid(messageSid: string): Message | null;
    /**
     * Get all messages for a conversation
     */
    getByConversation(conversationId: string, limit?: number): Message[];
    /**
     * Query messages with filters
     */
    query(params: {
        from?: string;
        to?: string;
        conversationId?: string;
        since?: Date;
        limit?: number;
    }): Message[];
    /**
     * Update message status
     */
    updateStatus(messageSid: string, status: string, errorCode?: string, errorMessage?: string): void;
    /**
     * Get message count for a conversation
     */
    getConversationMessageCount(conversationId: string): number;
    /**
     * Convert database row to Message object
     */
    private rowToMessage;
    /**
     * Close database connection
     */
    close(): void;
}
export declare const messageStore: MessageStore;
//# sourceMappingURL=message-store.d.ts.map