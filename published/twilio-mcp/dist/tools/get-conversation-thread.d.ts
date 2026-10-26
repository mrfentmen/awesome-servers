/**
 * get_conversation_thread MCP tool
 * Retrieve full conversation history
 */
import { z } from 'zod';
export declare const getConversationThreadSchema: z.ZodObject<{
    conversationId: z.ZodString;
    includeContext: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    includeContext: boolean;
}, {
    conversationId: string;
    includeContext?: boolean | undefined;
}>;
export type GetConversationThreadParams = z.infer<typeof getConversationThreadSchema>;
export declare function getConversationThread(params: GetConversationThreadParams): Promise<any>;
//# sourceMappingURL=get-conversation-thread.d.ts.map