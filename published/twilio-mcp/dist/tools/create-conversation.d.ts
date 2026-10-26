/**
 * create_conversation MCP tool
 * Initialize a new conversation thread
 */
import { z } from 'zod';
export declare const createConversationSchema: z.ZodObject<{
    participants: z.ZodArray<z.ZodString, "many">;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    participants: string[];
    metadata?: Record<string, any> | undefined;
}, {
    participants: string[];
    metadata?: Record<string, any> | undefined;
}>;
export type CreateConversationParams = z.infer<typeof createConversationSchema>;
export declare function createConversation(params: CreateConversationParams): Promise<{
    conversationId: string;
    participants: string[];
    createdAt: string;
    metadata: Record<string, any>;
}>;
//# sourceMappingURL=create-conversation.d.ts.map