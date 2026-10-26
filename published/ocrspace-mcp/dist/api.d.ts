export declare class OcrError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function parseImageUrl(imageUrl: string, language?: string): Promise<string>;
export declare function parseImagePost(imageUrl: string, overlay?: string): Promise<string>;
/**
 * Clean up the raw text an OCR engine returns: de-hyphenate words split across
 * line breaks, rejoin wrapped lines into their paragraphs, fix spacing around
 * punctuation and report exactly what changed.
 */
export declare function ocrCleanup(args: {
    input?: string;
    keepBlankLines?: boolean;
}): Promise<string>;
/** Pull the labelled fields out of OCR text: the next step after recognising a document. */
export declare function documentFields(args: {
    input?: string;
    only?: string;
}): Promise<string>;
/** Flag the places where OCR character recognition is most likely to have gone wrong. */
export declare function ocrConfusionAudit(args: {
    input?: string;
    limit?: number;
}): Promise<string>;
