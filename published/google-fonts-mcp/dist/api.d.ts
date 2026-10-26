export declare class GFontsError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listFonts(limit?: string): Promise<string>;
export declare function searchFonts(query: string, limit?: string): Promise<string>;
export declare function getFont(family: string): Promise<string>;
/** The variable-font axes Google Fonts actually exposes, and which families use them. */
export declare function variableAxes(args: {
    family?: string;
    limit?: number;
}): Promise<string>;
/** The @font-face CSS Google actually serves for a family, which is what a browser ends up downloading. */
export declare function servedFontFaces(args: {
    family: string;
    weights?: string;
}): Promise<string>;
