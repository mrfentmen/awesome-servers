export declare class AssemblyError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listTranscripts(limit?: string): Promise<string>;
export declare function getTranscript(transcriptId: string): Promise<string>;
export declare function getParagraphs(transcriptId: string): Promise<string>;
