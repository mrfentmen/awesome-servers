export declare class TestShapeError extends Error {
}
export declare function inspectTestShape(input: {
    project: string;
}): Promise<{
    assertionCoverageSignal: number;
    emptyTestRisk: string;
    valueFree: boolean;
    warning: string;
    files: number;
    describeBlocks: number;
    testBlocks: number;
    assertionFiles: number;
    asyncTests: number;
    emptyTests: number;
}>;
export declare function format(v: unknown): string;
