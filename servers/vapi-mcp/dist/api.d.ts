export declare class VapiError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listAssistants(limit?: string): Promise<string>;
export declare function getAssistant(assistantId: string): Promise<string>;
export declare function listCalls(limit?: string): Promise<string>;
export declare function getCall(callId: string): Promise<string>;
/**
 * The health of every layer a Vapi voice agent sits on, read from each provider's
 * own public status page: telephony, transport, speech to text, text to speech and
 * the language model. This is the difference between an agent that is broken and a
 * layer underneath it that is, which is the first question when a call fails.
 */
export declare function voiceStackStatus(_args: {
    layer?: string;
}): Promise<string>;
/**
 * The forward-looking half of the same question: what the stack has scheduled.
 * Planned maintenance is the one cause of a voice agent failing at a known time,
 * and every provider publishes it a few days ahead.
 */
export declare function stackMaintenance(_args: {
    window?: number;
}): Promise<string>;
