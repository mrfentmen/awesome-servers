export declare class CadenceError extends Error {
}
/** Commit activity shape of the local history: cadence by month and weekday, and the gaps between commits. */
export declare function commitCadence(args: {
    cwd?: string;
    months?: number;
}): Promise<string>;
/** Where the local work tree stands: bare or not, attached or detached, and what operation is half finished. */
export declare function repositoryHealth(args: {
    cwd?: string;
}): Promise<string>;
/** Size and shape of the local object store and ref namespace, from git's own counters. */
export declare function objectStore(args: {
    cwd?: string;
}): Promise<string>;
