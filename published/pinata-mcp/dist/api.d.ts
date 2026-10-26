export declare class PinataError extends Error {
}
/**
 * Re-encode one CID into another form, copying the multihash bytes unchanged,
 * so a v0 and its v1 equivalent can be compared or pasted side by side.
 */
export declare function convertCid(args: {
    cid: string;
    to: string;
}): Promise<string>;
