export declare class FigmaError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function me(): Promise<string>;
export declare function getFile(fileKey: string): Promise<string>;
export declare function projectFiles(projectId: string): Promise<string>;
export declare function teamProjects(teamId: string): Promise<string>;
export declare function fileComments(fileKey: string): Promise<string>;
export declare function fileVersions(fileKey: string): Promise<string>;
export declare function fileComponents(fileKey: string): Promise<string>;
export declare function fileStyles(fileKey: string): Promise<string>;
export declare function fileNodes(fileKey: string, nodeIds: string): Promise<string>;
export declare function fileImages(fileKey: string, nodeIds: string): Promise<string>;
export interface FileVariablesArgs {
    file_key: string;
    collection?: string;
}
/**
 * The local variables layer: collections, variables, and the modes that give
 * them light and dark variants. This is the design-token layer and it is the
 * part of a Figma file that a design-system audit actually needs; none of the
 * existing ten tools can see any of it.
 */
export declare function fileVariables(args: FileVariablesArgs): Promise<string>;
export interface ComponentSetsArgs {
    file_key: string;
    include_properties?: boolean;
    limit?: number;
}
/**
 * Component sets, which is where a component and its variants live. The
 * existing file_components returns the component instances in a file; a component
 * set is the definition of the variant axes, which is the part a design system
 * needs to document and which nothing here could reach before.
 */
export declare function componentSets(args: ComponentSetsArgs): Promise<string>;
export interface FileStructureArgs {
    file_key: string;
    max_nodes?: number;
    top_n?: number;
}
/**
 * The document tree, summarised. The existing getFile truncates its response at
 * 12000 characters, so on any real file it returns the first canvas and a
 * fragment of it; a file with thousands of nodes cannot be inspected with it at
 * all. This walks the tree and reports the shape instead.
 */
export declare function fileStructure(args: FileStructureArgs): Promise<string>;
