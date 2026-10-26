export declare class CartesiaError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listVoices(limit?: string): Promise<string>;
export declare function getVoice(voiceId: string): Promise<string>;
export declare function synthesizeSpeech(transcript: string, voiceId: string, modelId?: string): Promise<string>;
export interface SearchArgs {
    query?: string;
    language?: string;
    gender?: string;
    limit?: number;
}
/** Search the voice library by name, description or id, with language and gender filters. */
export declare function searchVoices(args: SearchArgs): Promise<string>;
export interface RollCallArgs {
    pages?: number;
}
/** Walk the voice library with cursor pagination and count it by language and gender. */
export declare function languageRollCall(args: RollCallArgs): Promise<string>;
export interface PickerArgs {
    language: string;
    use_case?: string;
    limit?: number;
}
/** Shortlist a voice for a job: filter by language, prefer multilingual ones, show previews. */
export declare function pickVoice(args: PickerArgs): Promise<string>;
