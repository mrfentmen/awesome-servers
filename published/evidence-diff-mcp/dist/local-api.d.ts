export interface TestEvidenceArgs {
    project: string;
    max_files?: number;
}
export declare function testEvidence(args: TestEvidenceArgs): Promise<string>;
export interface CommitEvidenceArgs {
    project: string;
    limit?: number;
}
export declare function commitEvidence(args: CommitEvidenceArgs): Promise<string>;
