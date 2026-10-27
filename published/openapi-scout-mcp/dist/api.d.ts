/** A coverage matrix over the operations: methods, tags, and how many operations are missing an id, tags or a response block. */
export declare function operationMatrix(args: {
    file: string;
}): Promise<string>;
/** A shape census of the component schemas: how many properties they hold, how many are required, and which schema keywords are used. */
export declare function schemaShapeReport(args: {
    file: string;
    limit?: number;
}): Promise<string>;
/** How much of a local spec looks like material a reader should not see, counted without printing any of it. */
export declare function redactionAudit(args: {
    file: string;
}): Promise<string>;
