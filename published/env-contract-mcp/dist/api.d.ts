export interface ContractSummaryArgs {
    project: string;
}
export declare function contractSummary(args: ContractSummaryArgs): Promise<string>;
export interface ContractDiffArgs {
    before: string;
    after: string;
}
export declare function contractDiff(args: ContractDiffArgs): Promise<string>;
