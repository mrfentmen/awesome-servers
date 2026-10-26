/**
 * get_message_status MCP tool
 * Check delivery status of sent messages
 */
import { z } from 'zod';
export declare const getMessageStatusSchema: z.ZodObject<{
    messageSid: z.ZodUnion<[z.ZodString, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    messageSid: string;
}, {
    messageSid: string;
}>;
export type GetMessageStatusParams = z.infer<typeof getMessageStatusSchema>;
export declare function getMessageStatus(params: GetMessageStatusParams): Promise<{
    messageSid: string;
    status: import("twilio/lib/rest/api/v2010/account/message.js").MessageStatus;
    errorCode: number | undefined;
    errorMessage: string | undefined;
    timestamp: string;
    to: string;
    from: string | undefined;
}>;
//# sourceMappingURL=get-message-status.d.ts.map