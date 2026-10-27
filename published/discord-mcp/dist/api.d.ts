export declare class DiscordError extends Error {
}
export interface InviteInfo {
    code: string;
    guildId?: string;
    guildName?: string;
    description?: string;
    members?: number;
    online?: number;
    channel?: string;
    expires?: string;
}
export declare function lookupInvite(code: string): Promise<InviteInfo>;
export interface WidgetInfo {
    guildId: string;
    name?: string;
    online?: number;
    channels: string[];
    invite?: string;
}
export declare function getWidget(guildId: string): Promise<WidgetInfo>;
export declare function formatInvite(inv: InviteInfo): string;
export declare function formatWidget(w: WidgetInfo): string;
export interface WidgetMember {
    username?: string;
    status?: string;
    game?: string;
}
export declare function widgetMembers(guildId: string): Promise<WidgetMember[]>;
export declare function formatMembers(members: WidgetMember[], guildId: string): string;
