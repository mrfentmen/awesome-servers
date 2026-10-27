export declare class NodeRedError extends Error {
}
type Raw = Record<string, any>;
export interface Flow {
    id: string;
    label?: string;
    nodes: number;
    disabled?: boolean;
}
export declare function listFlows(): Promise<Flow[]>;
export declare function getFlow(id: string): Promise<Raw[]>;
export declare function formatFlow(id: string, nodes: Raw[]): string;
/** The shape of a flow: node types, layout extent, disabled nodes, wire volume and how much inline code it carries. */
export declare function flowGraphAudit(args: {
    flow: string;
}): Promise<string>;
/** The wiring topology: sources, sinks, the longest chain through the graph and where the fan-out concentrates. */
export declare function wiringReport(args: {
    flow: string;
    limit?: number;
}): Promise<string>;
/** Static lint over a flow before it is deployed: the problems Node-RED will complain about at import time. */
export declare function flowLint(args: {
    flow: string;
}): Promise<string>;
export {};
