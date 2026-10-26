export declare class MailjetError extends Error {
}
export interface Contact {
    email?: string;
    name?: string;
    created?: string;
    unsubscribed?: boolean;
}
export declare function listContacts(limit?: number): Promise<Contact[]>;
export interface EmailMsg {
    id?: number;
    to?: string;
    subject?: string;
    status?: string;
    date?: string;
}
export declare function recentMessages(limit?: number): Promise<EmailMsg[]>;
export declare function formatContact(c: Contact, index?: number): string;
export declare function formatMessage(m: EmailMsg, index?: number): string;
/** Check a raw message the way a receiving MTA would read it, before it is ever sent. */
export declare function messageHeaderLint(args: {
    message: string;
}): Promise<string>;
/** Turn "send it at 9am their time" into real UTC instants, per recipient time zone. */
export declare function sendTimePlanner(args: {
    zones: string;
    localHour?: number;
    days?: number;
}): Promise<string>;
