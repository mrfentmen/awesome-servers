export interface SnapshotArgs {
    path: string;
}
export interface MatrixArgs {
    before: string;
    after: string;
}
export declare function snapshotProfile(args: SnapshotArgs): Promise<string>;
