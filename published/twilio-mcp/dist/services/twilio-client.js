/**
 * Twilio client service wrapper
 * Provides abstraction layer for Twilio SDK operations
 */
import twilio from 'twilio';
import { config } from '../config/env.js';
export class TwilioClient {
    client;
    defaultFrom;
    constructor() {
        this.client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
        this.defaultFrom = config.TWILIO_PHONE_NUMBER;
    }
    /**
     * Send an SMS message
     */
    async sendSms(params) {
        const createOptions = {
            to: params.to,
            from: params.from || this.defaultFrom,
            body: params.body,
        };
        return await this.client.messages.create(createOptions);
    }
    /**
     * Send an MMS message with media attachments
     */
    async sendMms(params) {
        if (!config.ENABLE_MMS) {
            throw new Error('MMS is not enabled. Set ENABLE_MMS=true in environment.');
        }
        const createOptions = {
            to: params.to,
            from: params.from || this.defaultFrom,
            body: params.body,
            mediaUrl: params.mediaUrls,
        };
        return await this.client.messages.create(createOptions);
    }
    /**
     * Get message by SID
     */
    async getMessage(messageSid) {
        return await this.client.messages(messageSid).fetch();
    }
    /**
     * List messages with optional filters
     */
    async listMessages(params) {
        const messages = await this.client.messages.list({
            to: params?.to,
            from: params?.from,
            dateSentAfter: params?.dateSentAfter,
            limit: params?.limit || 50,
        });
        return messages;
    }
    /**
     * Validate webhook signature for security
     */
    validateWebhookSignature(signature, url, params) {
        return twilio.validateRequest(config.TWILIO_AUTH_TOKEN, signature, url, params);
    }
}
// Singleton instance
export const twilioClient = new TwilioClient();
//# sourceMappingURL=twilio-client.js.map