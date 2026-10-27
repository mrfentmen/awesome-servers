export declare class QbitError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listTorrents(): Promise<string>;
export declare function getTransferInfo(): Promise<string>;
export declare function getAppVersion(): Promise<string>;
/**
 * What a magnet link or a bare info hash actually names: the exact topic, the
 * v1 and v2 hash forms, the suggested file name, the trackers and the length the
 * link claims. qBittorrent will accept a magnet; this says what is inside it.
 */
export declare function parseMagnet(args: {
    uri: string;
}): Promise<string>;
/**
 * The piece arithmetic a payload has to satisfy: how many pieces a size splits
 * into at a given piece length, how big the last piece is, and how much padding
 * the .torrent file itself needs. This is what makes a torrent announceable.
 */
export declare function torrentGeometry(args: {
    size_bytes: number;
    piece_kb?: number;
    piece_size?: number;
}): Promise<string>;
