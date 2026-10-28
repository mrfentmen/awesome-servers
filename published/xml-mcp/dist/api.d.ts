/**
 * XML Tools — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function section(title: string, rows: string[]): string;
export declare function parseXmlFile(a: {
    text: string;
}): Promise<string>;
export declare function xmlToJson(a: {
    text: string;
}): Promise<string>;
export declare function validateXml(a: {
    text: string;
}): Promise<string>;
