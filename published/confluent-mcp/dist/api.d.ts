export declare class ConfluentError extends Error {
}
export interface Environment {
    id: string;
    name?: string;
}
export declare function listEnvironments(): Promise<Environment[]>;
export interface Cluster {
    id: string;
    name?: string;
    cloud?: string;
    region?: string;
    availability?: string;
    endpoint?: string;
}
export declare function listClusters(environment: string): Promise<Cluster[]>;
export declare function formatCluster(c: Cluster, index?: number): string;
export interface TopicsArgs {
    cluster_id: string;
    limit?: number;
}
/** The topics on a Kafka cluster with the facts that decide whether each one is set up sanely. */
export declare function listTopics(args: TopicsArgs): Promise<string>;
export interface ConnectorsArgs {
    environment_id: string;
    cluster_id: string;
    expand?: string;
}
/** The connectors on a cluster with their run state and any failure trace, which is where a broken pipeline announces itself. */
export declare function listConnectors(args: ConnectorsArgs): Promise<string>;
export interface SchemasArgs {
    subject_prefix?: string;
    latest_only?: string;
    limit?: number;
}
/** The subjects in Schema Registry with their type, id and version, which is how you spot a subject that has drifted. */
export declare function listSchemas(args?: SchemasArgs): Promise<string>;
