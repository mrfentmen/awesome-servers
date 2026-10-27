import type { CollectionEntry, RomSearchResult, SaveFileInfo } from "./types.js";
export declare function searchInternetArchive(query: string, mediatype?: string, maxResults?: number): Promise<RomSearchResult[]>;
export declare function searchRomsGames(query: string, consoleFilter?: string): Promise<RomSearchResult[]>;
export declare function searchCoolrom(query: string): Promise<RomSearchResult[]>;
export declare function searchArcadePunks(query: string): Promise<RomSearchResult[]>;
export declare function searchRomsFun(query: string, consoleFilter?: string): Promise<RomSearchResult[]>;
export declare function searchRedditRoms(query: string, sort?: string, time?: string): Promise<RomSearchResult[]>;
export declare function searchAllSources(query: string, consoleFilter?: string): Promise<RomSearchResult[]>;
export declare function getArchiveMetadata(identifier: string): Promise<any>;
export declare function getDownloadUrl(identifier: string, filename?: string): Promise<string>;
export declare function computeChecksums(filepath: string): Promise<{
    crc32: string;
    md5: string;
    sha1: string;
    size: number;
}>;
export declare function verifyChecksum(crc32?: string, md5?: string, sha1?: string): Promise<{
    match: boolean;
    game?: string;
    source?: string;
    details?: string;
}>;
export declare function parseSaveFile(filepath: string): Promise<SaveFileInfo>;
export declare function scanCollection(dirPath: string): Promise<CollectionEntry[]>;
export declare function detectConsoleFromPath(filepath: string): string;
export declare function formatFileSize(bytes: number): string;
