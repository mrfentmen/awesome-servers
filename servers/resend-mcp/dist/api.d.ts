export declare class ResendError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listDomains(): Promise<string>;
export declare function getDomain(domainId: string): Promise<string>;
export declare function getEmail(emailId: string): Promise<string>;
export declare function listApiKeys(): Promise<string>;
export declare function listAudiences(): Promise<string>;
export declare function getAudience(audienceId: string): Promise<string>;
export declare function listContacts(audienceId: string): Promise<string>;
export declare function listBroadcasts(): Promise<string>;
export declare function getBroadcast(broadcastId: string): Promise<string>;
export declare function createContact(audienceId: string, email: string): Promise<string>;
export declare function addDomain(name: string): Promise<string>;
/**
 * Build the MIME message a multipart email actually is, and report its exact
 * size, its boundaries and the encoding of every part. A JSON body sent to an
 * API is not what lands in the recipient's mailbox; this is.
 */
export declare function buildMimeMessage(args: {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
    reply_to?: string;
    message_id?: string;
    date?: string;
}): Promise<string>;
/**
 * Exactly what a DKIM signer will hash: the relaxed and simple canonical forms
 * of the body and of the signed header list, with the SHA-256 bh= value. When a
 * signature fails, this is how the two sides are compared.
 */
export declare function dkimCanonicalization(args: {
    headers: string[];
    body: string;
    hash?: string;
}): Promise<string>;
