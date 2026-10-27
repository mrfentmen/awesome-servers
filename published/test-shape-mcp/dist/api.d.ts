export declare function checkTestConventions(args: {
    source?: string;
}): Promise<string>;
export interface PublicCiArgs {
    owner: string;
    repo: string;
    limit?: number;
    ref?: string;
}
export declare function ciWorkflows(args: PublicCiArgs): Promise<string>;
