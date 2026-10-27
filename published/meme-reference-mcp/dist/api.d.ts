/**
 * Meme reference data from two official, keyless APIs:
 *   - Imgflip  (https://api.imgflip.com/get_memes) — 100 classic templates with
 *     names, pixel dimensions, caption-box counts and lifetime caption counts.
 *   - memegen  (https://api.memegen.link) — template list plus a public image
 *     renderer, and each template carries its Know Your Meme origin link.
 *
 * No HTML is parsed anywhere: both endpoints return documented JSON.
 */
export declare class MemeError extends Error {
}
export interface Template {
    id: string;
    name: string;
    url: string;
    width: number;
    height: number;
    boxCount: number;
    captions: number;
}
export declare function allTemplates(): Promise<Template[]>;
export declare function searchTemplates(query: string, limit: number): Promise<string>;
export declare function popularTemplates(limit: number): Promise<string>;
export declare function templateInfo(ref: string): Promise<string>;
export declare function randomTemplate(): Promise<string>;
interface Generator {
    id: string;
    name: string;
    lines: number;
    styles: string[];
    blank: string;
    source: string;
}
export declare function allGenerators(): Promise<Generator[]>;
export declare function listGenerators(query: string | undefined, limit: number): Promise<string>;
export declare function generateMeme(template: string, lines: string[]): Promise<string>;
export {};
