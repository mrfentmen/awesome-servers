export declare class MemeError extends Error {
}
export interface Template {
    id: string;
    name: string;
    lines: number;
    blank?: string;
    example?: string;
}
export declare function listTemplates(): Promise<Template[]>;
export declare function getTemplate(id: string): Promise<Template>;
export declare function makeMeme(template: string, lines: string[]): string;
