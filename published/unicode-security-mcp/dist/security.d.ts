export declare function analyzeText(input: string): {
    heuristicOnly: boolean;
    coverage: string[];
    warning: string;
    normalized: string;
    length: number;
    scripts: {
        [k: string]: number;
    };
    mixedScript: boolean;
    confusables: {
        char: string;
        codePoint: string;
        looksLike: string;
    }[];
    invisible: {
        char: string;
        codePoint: string;
        name: string;
    }[];
    riskScore: number;
    severity: string;
};
export declare function skeleton(input: string): string;
export declare function compareLookalikes(left: string, right: string): {
    heuristicOnly: boolean;
    warning: string;
    left: string;
    right: string;
    sameSkeleton: boolean;
    invisibleControls: {
        left: {
            char: string;
            codePoint: string;
            name: string;
        }[];
        right: {
            char: string;
            codePoint: string;
            name: string;
        }[];
    };
};
