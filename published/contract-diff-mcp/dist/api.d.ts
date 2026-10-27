export interface ContractShapeArgs {
    snapshot: string;
}
export declare function contractShape(args: ContractShapeArgs): Promise<string>;
export interface ContractRiskArgs {
    before: string;
    after: string;
}
export declare function contractRisk(args: ContractRiskArgs): Promise<string>;
