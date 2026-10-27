export declare class ParliamentError extends Error {
}
export interface MemberHit {
    id: number;
    name: string;
    party?: string;
    constituency?: string;
}
export declare function searchMembers(name: string, limit?: number): Promise<MemberHit[]>;
export interface MemberDetails extends MemberHit {
    fullTitle?: string;
    gender?: string;
    house?: string;
    status?: string;
}
export declare function getMember(id: string): Promise<MemberDetails | null>;
export declare function formatHit(h: MemberHit, index?: number): string;
export declare function formatMember(m: MemberDetails): string;
