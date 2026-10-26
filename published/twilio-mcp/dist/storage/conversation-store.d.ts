/**
 * Conversation storage implementation using SQLite
 * Manages conversation threads and their metadata
 */
import type { Conversation } from '../types/models.js';
export declare class ConversationStore {
    private db;
    constructor(dbPath?: string);
    /**
     * Initialize database schema
     */
    private initialize;
    /**
     * Create a new conversation
     */
    create(participants: string[], metadata?: Record<string, any>): Conversation;
    /**
     * Find conversation by participants
     */
    findByParticipants(participants: string[]): Conversation | null;
    /**
     * Get conversation by ID
     */
    getById(id: string): Conversation | null;
    /**
     * Update conversation's last activity timestamp
     */
    updateLastActivity(id: string): void;
    /**
     * Update conversation metadata
     */
    updateMetadata(id: string, metadata: Record<string, any>): void;
    /**
     * Archive a conversation
     */
    archive(id: string): void;
    /**
     * List all active conversations
     */
    listActive(limit?: number): Conversation[];
    /**
     * Generate a normalized participants key for lookup
     */
    private getParticipantsKey;
    /**
     * Convert database row to Conversation object
     */
    private rowToConversation;
    /**
     * Close database connection
     */
    close(): void;
}
export declare const conversationStore: ConversationStore;
//# sourceMappingURL=conversation-store.d.ts.map