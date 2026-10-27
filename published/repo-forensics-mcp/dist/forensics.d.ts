export declare class ForensicsError extends Error {
}
export declare function summary(cwd: string): Promise<{
    path: string;
    branch: string;
    status: string;
    remotes: string[];
    lastCommit: string;
}>;
export declare function recentChanges(cwd: string, limit: number): Promise<{
    hash: string;
    date: string;
    author: string;
    subject: string;
}[]>;
export declare function hotspots(cwd: string, limit: number): Promise<{
    file: string;
    commits: number;
}[]>;
export declare function hygiene(cwd: string): Promise<{
    path: string;
    largeFiles: {
        path: string;
        bytes: number;
    }[];
    hasGitignore: boolean;
    dirty: boolean;
    warning: string;
}>;
export declare function format(value: unknown): string;
