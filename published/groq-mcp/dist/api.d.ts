export declare class GroqError extends Error {
}
export declare function listModels(): Promise<string[]>;
export declare function chat(model: string, message: string, system?: string): Promise<string>;
/** Open weights on the Hugging Face Hub, ranked, with the download and licence facts. */
export declare function hubModelSearch(args: {
    search: string;
    limit?: number;
}): Promise<string>;
/** Datasets on the Hub, so a fine-tuning or evaluation set can be found without a key. */
export declare function hubDatasetSearch(args: {
    search: string;
    limit?: number;
}): Promise<string>;
