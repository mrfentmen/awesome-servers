/**
 * send_sms MCP tool
 * Sends outbound SMS messages via Twilio
 */
import { z } from 'zod';
export declare const sendSmsSchema: z.ZodObject<{
    to: z.ZodString;
    message: z.ZodString;
    from: z.ZodOptional<z.ZodString>;
    conversationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    to: string;
    from?: string | undefined;
    conversationId?: string | undefined;
}, {
    message: string;
    to: string;
    from?: string | undefined;
    conversationId?: string | undefined;
}>;
export type SendSmsParams = z.infer<typeof sendSmsSchema>;
export declare function sendSms(params: SendSmsParams): Promise<{
    messageSid: string;
    status: string;
    to: string;
    from: string;
    conversationId: string;
    timestamp: string;
}>;
//# sourceMappingURL=send-sms.d.ts.map