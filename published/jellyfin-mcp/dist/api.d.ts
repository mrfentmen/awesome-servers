export declare class JellyfinError extends Error {
}
export interface ServerInfo {
    name?: string;
    version?: string;
    id?: string;
}
export declare function serverInfo(): Promise<ServerInfo>;
export interface JellyUser {
    id: string;
    name?: string;
    admin?: boolean;
    lastActive?: string;
}
export declare function listUsers(): Promise<JellyUser[]>;
export interface Library {
    id: string;
    name?: string;
    type?: string;
}
export declare function listLibraries(): Promise<Library[]>;
export declare function formatUser(u: JellyUser, index?: number): string;
export declare function formatLibrary(l: Library, index?: number): string;
import { z } from "zod";
declare const User: z.ZodObject<{
    Id: z.ZodOptional<z.ZodString>;
    Name: z.ZodOptional<z.ZodString>;
    ServerId: z.ZodOptional<z.ZodString>;
    LastLoginDate: z.ZodOptional<z.ZodString>;
    LastActivityDate: z.ZodOptional<z.ZodString>;
    hasPassword: z.ZodOptional<z.ZodBoolean>;
    hasConfiguredPassword: z.ZodOptional<z.ZodBoolean>;
    LastUserActivity: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">]>>;
    Policy: z.ZodOptional<z.ZodObject<{
        IsAdministrator: z.ZodOptional<z.ZodBoolean>;
        IsDisabled: z.ZodOptional<z.ZodBoolean>;
        IsHidden: z.ZodOptional<z.ZodBoolean>;
        EnableAllFolders: z.ZodOptional<z.ZodBoolean>;
        EnabledFolders: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            Id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            Id?: string | undefined;
        }, {
            Id?: string | undefined;
        }>]>, "many">>;
        AuthenticationProviderId: z.ZodOptional<z.ZodString>;
        PasswordResetProviderId: z.ZodOptional<z.ZodString>;
        EnableContentDeletion: z.ZodOptional<z.ZodBoolean>;
        EnableRemoteControlOfOtherUsers: z.ZodOptional<z.ZodBoolean>;
        EnableSharedDeviceControl: z.ZodOptional<z.ZodBoolean>;
        IsRestricted: z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        IsAdministrator: z.ZodOptional<z.ZodBoolean>;
        IsDisabled: z.ZodOptional<z.ZodBoolean>;
        IsHidden: z.ZodOptional<z.ZodBoolean>;
        EnableAllFolders: z.ZodOptional<z.ZodBoolean>;
        EnabledFolders: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            Id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            Id?: string | undefined;
        }, {
            Id?: string | undefined;
        }>]>, "many">>;
        AuthenticationProviderId: z.ZodOptional<z.ZodString>;
        PasswordResetProviderId: z.ZodOptional<z.ZodString>;
        EnableContentDeletion: z.ZodOptional<z.ZodBoolean>;
        EnableRemoteControlOfOtherUsers: z.ZodOptional<z.ZodBoolean>;
        EnableSharedDeviceControl: z.ZodOptional<z.ZodBoolean>;
        IsRestricted: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        IsAdministrator: z.ZodOptional<z.ZodBoolean>;
        IsDisabled: z.ZodOptional<z.ZodBoolean>;
        IsHidden: z.ZodOptional<z.ZodBoolean>;
        EnableAllFolders: z.ZodOptional<z.ZodBoolean>;
        EnabledFolders: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            Id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            Id?: string | undefined;
        }, {
            Id?: string | undefined;
        }>]>, "many">>;
        AuthenticationProviderId: z.ZodOptional<z.ZodString>;
        PasswordResetProviderId: z.ZodOptional<z.ZodString>;
        EnableContentDeletion: z.ZodOptional<z.ZodBoolean>;
        EnableRemoteControlOfOtherUsers: z.ZodOptional<z.ZodBoolean>;
        EnableSharedDeviceControl: z.ZodOptional<z.ZodBoolean>;
        IsRestricted: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    Id: z.ZodOptional<z.ZodString>;
    Name: z.ZodOptional<z.ZodString>;
    ServerId: z.ZodOptional<z.ZodString>;
    LastLoginDate: z.ZodOptional<z.ZodString>;
    LastActivityDate: z.ZodOptional<z.ZodString>;
    hasPassword: z.ZodOptional<z.ZodBoolean>;
    hasConfiguredPassword: z.ZodOptional<z.ZodBoolean>;
    LastUserActivity: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">]>>;
    Policy: z.ZodOptional<z.ZodObject<{
        IsAdministrator: z.ZodOptional<z.ZodBoolean>;
        IsDisabled: z.ZodOptional<z.ZodBoolean>;
        IsHidden: z.ZodOptional<z.ZodBoolean>;
        EnableAllFolders: z.ZodOptional<z.ZodBoolean>;
        EnabledFolders: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            Id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            Id?: string | undefined;
        }, {
            Id?: string | undefined;
        }>]>, "many">>;
        AuthenticationProviderId: z.ZodOptional<z.ZodString>;
        PasswordResetProviderId: z.ZodOptional<z.ZodString>;
        EnableContentDeletion: z.ZodOptional<z.ZodBoolean>;
        EnableRemoteControlOfOtherUsers: z.ZodOptional<z.ZodBoolean>;
        EnableSharedDeviceControl: z.ZodOptional<z.ZodBoolean>;
        IsRestricted: z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        IsAdministrator: z.ZodOptional<z.ZodBoolean>;
        IsDisabled: z.ZodOptional<z.ZodBoolean>;
        IsHidden: z.ZodOptional<z.ZodBoolean>;
        EnableAllFolders: z.ZodOptional<z.ZodBoolean>;
        EnabledFolders: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            Id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            Id?: string | undefined;
        }, {
            Id?: string | undefined;
        }>]>, "many">>;
        AuthenticationProviderId: z.ZodOptional<z.ZodString>;
        PasswordResetProviderId: z.ZodOptional<z.ZodString>;
        EnableContentDeletion: z.ZodOptional<z.ZodBoolean>;
        EnableRemoteControlOfOtherUsers: z.ZodOptional<z.ZodBoolean>;
        EnableSharedDeviceControl: z.ZodOptional<z.ZodBoolean>;
        IsRestricted: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        IsAdministrator: z.ZodOptional<z.ZodBoolean>;
        IsDisabled: z.ZodOptional<z.ZodBoolean>;
        IsHidden: z.ZodOptional<z.ZodBoolean>;
        EnableAllFolders: z.ZodOptional<z.ZodBoolean>;
        EnabledFolders: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            Id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            Id?: string | undefined;
        }, {
            Id?: string | undefined;
        }>]>, "many">>;
        AuthenticationProviderId: z.ZodOptional<z.ZodString>;
        PasswordResetProviderId: z.ZodOptional<z.ZodString>;
        EnableContentDeletion: z.ZodOptional<z.ZodBoolean>;
        EnableRemoteControlOfOtherUsers: z.ZodOptional<z.ZodBoolean>;
        EnableSharedDeviceControl: z.ZodOptional<z.ZodBoolean>;
        IsRestricted: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    Id: z.ZodOptional<z.ZodString>;
    Name: z.ZodOptional<z.ZodString>;
    ServerId: z.ZodOptional<z.ZodString>;
    LastLoginDate: z.ZodOptional<z.ZodString>;
    LastActivityDate: z.ZodOptional<z.ZodString>;
    hasPassword: z.ZodOptional<z.ZodBoolean>;
    hasConfiguredPassword: z.ZodOptional<z.ZodBoolean>;
    LastUserActivity: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">]>>;
    Policy: z.ZodOptional<z.ZodObject<{
        IsAdministrator: z.ZodOptional<z.ZodBoolean>;
        IsDisabled: z.ZodOptional<z.ZodBoolean>;
        IsHidden: z.ZodOptional<z.ZodBoolean>;
        EnableAllFolders: z.ZodOptional<z.ZodBoolean>;
        EnabledFolders: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            Id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            Id?: string | undefined;
        }, {
            Id?: string | undefined;
        }>]>, "many">>;
        AuthenticationProviderId: z.ZodOptional<z.ZodString>;
        PasswordResetProviderId: z.ZodOptional<z.ZodString>;
        EnableContentDeletion: z.ZodOptional<z.ZodBoolean>;
        EnableRemoteControlOfOtherUsers: z.ZodOptional<z.ZodBoolean>;
        EnableSharedDeviceControl: z.ZodOptional<z.ZodBoolean>;
        IsRestricted: z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        IsAdministrator: z.ZodOptional<z.ZodBoolean>;
        IsDisabled: z.ZodOptional<z.ZodBoolean>;
        IsHidden: z.ZodOptional<z.ZodBoolean>;
        EnableAllFolders: z.ZodOptional<z.ZodBoolean>;
        EnabledFolders: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            Id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            Id?: string | undefined;
        }, {
            Id?: string | undefined;
        }>]>, "many">>;
        AuthenticationProviderId: z.ZodOptional<z.ZodString>;
        PasswordResetProviderId: z.ZodOptional<z.ZodString>;
        EnableContentDeletion: z.ZodOptional<z.ZodBoolean>;
        EnableRemoteControlOfOtherUsers: z.ZodOptional<z.ZodBoolean>;
        EnableSharedDeviceControl: z.ZodOptional<z.ZodBoolean>;
        IsRestricted: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        IsAdministrator: z.ZodOptional<z.ZodBoolean>;
        IsDisabled: z.ZodOptional<z.ZodBoolean>;
        IsHidden: z.ZodOptional<z.ZodBoolean>;
        EnableAllFolders: z.ZodOptional<z.ZodBoolean>;
        EnabledFolders: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            Id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            Id?: string | undefined;
        }, {
            Id?: string | undefined;
        }>]>, "many">>;
        AuthenticationProviderId: z.ZodOptional<z.ZodString>;
        PasswordResetProviderId: z.ZodOptional<z.ZodString>;
        EnableContentDeletion: z.ZodOptional<z.ZodBoolean>;
        EnableRemoteControlOfOtherUsers: z.ZodOptional<z.ZodBoolean>;
        EnableSharedDeviceControl: z.ZodOptional<z.ZodBoolean>;
        IsRestricted: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">>;
declare const Library: z.ZodObject<{
    Id: z.ZodOptional<z.ZodString>;
    Name: z.ZodOptional<z.ZodString>;
    CollectionType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ItemId: z.ZodOptional<z.ZodString>;
    ParentId: z.ZodOptional<z.ZodString>;
    Locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    RefreshStatus: z.ZodOptional<z.ZodString>;
    LocationType: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    Id: z.ZodOptional<z.ZodString>;
    Name: z.ZodOptional<z.ZodString>;
    CollectionType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ItemId: z.ZodOptional<z.ZodString>;
    ParentId: z.ZodOptional<z.ZodString>;
    Locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    RefreshStatus: z.ZodOptional<z.ZodString>;
    LocationType: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    Id: z.ZodOptional<z.ZodString>;
    Name: z.ZodOptional<z.ZodString>;
    CollectionType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ItemId: z.ZodOptional<z.ZodString>;
    ParentId: z.ZodOptional<z.ZodString>;
    Locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    RefreshStatus: z.ZodOptional<z.ZodString>;
    LocationType: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
type UserT = z.infer<typeof User>;
type LibraryT = z.infer<typeof Library>;
export interface AuditUsersArgs {
    users: UserT[];
    now?: string;
}
export declare function audit_users(args: AuditUsersArgs): string;
export interface AccessArgs {
    users: UserT[];
    libraries: LibraryT[];
}
export declare function access_audit(args: AccessArgs): string;
export interface LibrarySummaryArgs {
    libraries: LibraryT[];
    itemCounts?: Record<string, number>;
}
export declare function library_summary(args: LibrarySummaryArgs): string;
export {};
