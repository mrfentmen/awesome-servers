/**
 * Twilio client service wrapper
 * Provides abstraction layer for Twilio SDK operations
 */
import type { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message.js';
export declare class TwilioClient {
    private client;
    private defaultFrom;
    constructor();
    /**
     * Send an SMS message
     */
    sendSms(params: {
        to: string;
        body: string;
        from?: string;
    }): Promise<MessageInstance>;
    /**
     * Send an MMS message with media attachments
     */
    sendMms(params: {
        to: string;
        body: string;
        mediaUrls: string[];
        from?: string;
    }): Promise<MessageInstance>;
    /**
     * Get message by SID
     */
    getMessage(messageSid: string): Promise<MessageInstance>;
    /**
     * List messages with optional filters
     */
    listMessages(params?: {
        to?: string;
        from?: string;
        dateSentAfter?: Date;
        limit?: number;
    }): Promise<MessageInstance[]>;
    /**
     * Validate webhook signature for security
     */
    validateWebhookSignature(signature: string, url: string, params: Record<string, string>): boolean;
}
export declare const twilioClient: TwilioClient;
//# sourceMappingURL=twilio-client.d.ts.map