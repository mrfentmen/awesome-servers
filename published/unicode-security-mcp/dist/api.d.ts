/** The official UCD record for one code point. */
export declare function codePointInfo(args: {
    codePoint: string;
}): Promise<string>;
/** The canonical and compatibility decompositions Unicode records for a code point. */
export declare function characterDecomposition(args: {
    codePoint: string;
}): Promise<string>;
