export declare class ConfigWeatherError extends Error {
}
export declare function inspectConfigWeather(input: {
    project: string;
}): Promise<{
    configFiles: number;
    configLines: number;
    formatCounts: Record<string, number>;
    environmentReferenceCount: number;
    duplicateKeySignalCount: number;
    weather: string;
    valueFree: boolean;
    warning: string;
}>;
export declare function format(v: unknown): string;
export declare function inspectEnvContract(input: {
    project: string;
}): Promise<{
    filesScanned: number;
    envFiles: number;
    assignments: number;
    bracketedValues: number;
    emptyValues: number;
    distinctKeysDefined: number;
    distinctKeysReferenced: number;
    totalReferences: number;
    referencedButNotDefined: {
        count: number;
        keys: string[];
    };
    definedButNotReferenced: {
        count: number;
        keys: string[];
    };
    keysDefinedInMultipleFiles: {
        count: number;
        keys: {
            key: string;
            files: number;
        }[];
    };
    completeness: number | null;
    valueFree: boolean;
    warning: string;
}>;
export declare function inspectConfigLayers(input: {
    project: string;
}): Promise<{
    filesScanned: number;
    totalLines: number;
    layerCount: number;
    layers: {
        [k: string]: {
            files: number;
            lines: number;
            extensions: Record<string, number>;
        };
    };
    multiLayerFiles: {
        count: number;
        sample: string[];
    };
    layerBalance: number | null;
    valueFree: boolean;
    warning: string;
}>;
