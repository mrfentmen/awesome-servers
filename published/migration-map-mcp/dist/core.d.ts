export declare class MigrationError extends Error {
}
export declare function inspectMigrationMap(input: {
    project: string;
}): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;
