export declare class OpenVsxError extends Error {
}
export interface ExtensionHit {
    namespace: string;
    name: string;
    description?: string;
    downloads?: number;
}
export declare function searchExtensions(query: string, limit?: number): Promise<ExtensionHit[]>;
export interface ExtensionDetails extends ExtensionHit {
    version?: string;
    license?: string;
    homepage?: string;
    repository?: string;
    versions: string[];
    page?: string;
}
export declare function getExtension(namespace: string, name: string): Promise<ExtensionDetails>;
export declare function formatHit(e: ExtensionHit, index?: number): string;
export declare function formatExtension(e: ExtensionDetails): string;
