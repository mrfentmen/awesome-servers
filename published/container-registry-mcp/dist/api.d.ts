export declare class DockerHubError extends Error {
}
export declare function splitRef(ref: string): {
    namespace: string;
    name: string;
};
export declare function searchImages(query: string, limit: number): Promise<string>;
export declare function imageDetails(ref: string): Promise<string>;
export declare function imageTags(ref: string, limit: number, ordering: string): Promise<string>;
export declare function officialImages(limit: number): Promise<string>;
export declare function tagInfo(ref: string, tag: string): Promise<string>;
export declare function compareImages(a: string, b: string): Promise<string>;
