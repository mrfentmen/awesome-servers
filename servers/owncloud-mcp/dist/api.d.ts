export declare class OwnCloudError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getCapabilities(): Promise<string>;
export declare function listShares(): Promise<string>;
export declare function getShare(shareId: string): Promise<string>;
export declare function createShare(filePath: string, shareType: string, shareWith?: string): Promise<string>;
/**
 * GET /status.php is the one ownCloud endpoint that answers without a login, so
 * it is the only place a new tool can be proven against a real server.
 */
export declare function serverStatus(): Promise<string>;
