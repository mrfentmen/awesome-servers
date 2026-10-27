/**
 * Which parts of Twilio break most often. This reads the same published record but
 * asks the aggregate question: how many incidents named each component, how long
 * they lasted there, and what state that component is in now.
 */
export declare function componentReliability(args: {
    limit?: number;
    days?: number;
}): Promise<string>;
/**
 * Twilio's own published incident record, filtered to a product or region and an
 * impact rating: what broke, when it was reported, how long it lasted, which
 * components it touched, and the last status note. No account credentials needed.
 */
export declare function incidentHistory(args: {
    product?: string;
    impact?: string;
    limit?: number;
}): Promise<string>;
