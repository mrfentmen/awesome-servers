/**
 * get_inbound_messages MCP tool
 * Query received SMS/MMS messages from storage
 */
import { z } from 'zod';
export declare const getInboundMessagesSchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
    conversationId: z.ZodOptional<z.ZodString>;
    since: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    to?: string | undefined;
    from?: string | undefined;
    conversationId?: string | undefined;
    since?: string | undefined;
}, {
    to?: string | undefined;
    from?: string | undefined;
    limit?: number | undefined;
    conversationId?: string | undefined;
    since?: string | undefined;
}>;
export type GetInboundMessagesParams = z.infer<typeof getInboundMessagesSchema>;
export declare function getInboundMessages(params: GetInboundMessagesParams): Promise<{
    messages: {
        messageSid: string;
        from: string;
        to: string;
        body: string;
        mediaUrls: string[] | undefined;
        timestamp: string;
        conversationId: string;
        status: string;
        direction: "inbound" | "outbound";
    }[];
    totalCount: number;
}>;
//# sourceMappingURL=get-inbound-messages.d.ts.map