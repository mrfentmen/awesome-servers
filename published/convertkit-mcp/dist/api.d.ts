export declare class KitError extends Error {
}
export interface Subscriber {
    email?: string;
    firstName?: string;
    state?: string;
    created?: string;
}
export declare function findSubscriber(email: string): Promise<Subscriber | null>;
export interface Named {
    id: string;
    name: string;
}
export declare function listForms(limit?: number): Promise<Named[]>;
export declare function listBroadcasts(limit?: number): Promise<Named[]>;
export declare function formatNamed(rows: Named[], label: string): string;
export interface TagsArgs {
    limit?: number;
}
/** The tags on the account with how many subscribers each one actually holds, which shows which tags really segment the list. */
export declare function listTags(args?: TagsArgs): Promise<string>;
export interface SequencesArgs {
    limit?: number;
}
/** The automations on the account with their state, step count, audience size and how they have performed. */
export declare function listSequences(args?: SequencesArgs): Promise<string>;
export interface BroadcastStatsArgs {
    status?: string;
    sent_after?: string;
    sent_before?: string;
    limit?: number;
}
/** How broadcasts actually performed, with the tracking flags that decide whether a low number means anything. */
export declare function broadcastPerformance(args?: BroadcastStatsArgs): Promise<string>;
