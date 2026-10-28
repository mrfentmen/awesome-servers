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
