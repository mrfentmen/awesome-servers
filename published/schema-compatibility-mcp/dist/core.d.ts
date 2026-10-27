export declare class SchemaError extends Error {
}
export declare function compareSchemaShapes(input: {
    before: string;
    after: string;
}): Promise<{
    beforeTypeCount: number;
    afterTypeCount: number;
    changedTypeCount: number;
    typeChanges: {
        [k: string]: {
            before: number;
            after: number;
        };
    };
    valueFree: boolean;
    warning: string;
}>;
export declare function format(v: unknown): string;
