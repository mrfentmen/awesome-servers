export declare class NotionError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function search(query: string): Promise<string>;
export declare function listUsers(): Promise<string>;
export declare function getPage(pageId: string): Promise<string>;
export declare function queryDatabase(databaseId: string): Promise<string>;
export declare function blockChildren(blockId: string): Promise<string>;
export declare function searchDatabases(query: string): Promise<string>;
export declare function getUser(userId: string): Promise<string>;
export declare function appendBlock(blockId: string, paragraph: string): Promise<string>;
export declare function updatePageTitle(pageId: string, title: string): Promise<string>;
export declare function createPage(parentPageId: string, title: string): Promise<string>;
/** Read what a public Notion page publishes about itself, without any token. */
export declare function notionPageMetadata(args: {
    url: string;
}): Promise<string>;
/** Check the ids in a Notion URL or id list before spending an API call on them. */
export declare function notionIdAudit(args: {
    ids: string;
}): Promise<string>;
