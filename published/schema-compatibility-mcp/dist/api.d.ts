/** A keyword census of a JSON Schema document: how many times each schema keyword appears, and nothing else. */
export declare function schemaProfile(input: {
    schema: string;
}): Promise<string>;
/** The depth and breadth of any JSON document: nodes per level, object fan-out and array length distribution. */
export declare function nestingProfile(input: {
    document: string;
}): Promise<string>;
/** How varied a document's property-name vocabulary is, measured without printing a single name. */
export declare function keyVocabulary(input: {
    document: string;
}): Promise<string>;
