export declare class ZitadelError extends Error {
}
export interface ZitUser {
    id: string;
    username?: string;
    email?: string;
    state?: string;
}
export declare function listUsers(limit?: number): Promise<ZitUser[]>;
export interface ZitOrg {
    id: string;
    name?: string;
    state?: string;
}
export declare function listOrganizations(limit?: number): Promise<ZitOrg[]>;
export declare function formatUser(u: ZitUser, index?: number): string;
export declare function formatOrg(o: ZitOrg, index?: number): string;
import { z } from "zod";
declare const User: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    userName: z.ZodOptional<z.ZodString>;
    loginNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    preferredLoginName: z.ZodOptional<z.ZodString>;
    orgId: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodObject<{
        creationDate: z.ZodOptional<z.ZodString>;
        changeDate: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        creationDate: z.ZodOptional<z.ZodString>;
        changeDate: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        creationDate: z.ZodOptional<z.ZodString>;
        changeDate: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    human: z.ZodOptional<z.ZodObject<{
        profile: z.ZodOptional<z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        email: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        phone: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        passwordChanged: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        profile: z.ZodOptional<z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        email: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        phone: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        passwordChanged: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        profile: z.ZodOptional<z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        email: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        phone: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        passwordChanged: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    machine: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        hasSecret: z.ZodOptional<z.ZodBoolean>;
        accessTokenType: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        hasSecret: z.ZodOptional<z.ZodBoolean>;
        accessTokenType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        hasSecret: z.ZodOptional<z.ZodBoolean>;
        accessTokenType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    userName: z.ZodOptional<z.ZodString>;
    loginNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    preferredLoginName: z.ZodOptional<z.ZodString>;
    orgId: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodObject<{
        creationDate: z.ZodOptional<z.ZodString>;
        changeDate: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        creationDate: z.ZodOptional<z.ZodString>;
        changeDate: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        creationDate: z.ZodOptional<z.ZodString>;
        changeDate: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    human: z.ZodOptional<z.ZodObject<{
        profile: z.ZodOptional<z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        email: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        phone: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        passwordChanged: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        profile: z.ZodOptional<z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        email: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        phone: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        passwordChanged: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        profile: z.ZodOptional<z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        email: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        phone: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        passwordChanged: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    machine: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        hasSecret: z.ZodOptional<z.ZodBoolean>;
        accessTokenType: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        hasSecret: z.ZodOptional<z.ZodBoolean>;
        accessTokenType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        hasSecret: z.ZodOptional<z.ZodBoolean>;
        accessTokenType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    userName: z.ZodOptional<z.ZodString>;
    loginNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    preferredLoginName: z.ZodOptional<z.ZodString>;
    orgId: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodObject<{
        creationDate: z.ZodOptional<z.ZodString>;
        changeDate: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        creationDate: z.ZodOptional<z.ZodString>;
        changeDate: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        creationDate: z.ZodOptional<z.ZodString>;
        changeDate: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    human: z.ZodOptional<z.ZodObject<{
        profile: z.ZodOptional<z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        email: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        phone: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        passwordChanged: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        profile: z.ZodOptional<z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        email: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        phone: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        passwordChanged: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        profile: z.ZodOptional<z.ZodObject<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
            displayName: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        email: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            email: z.ZodOptional<z.ZodString>;
            isEmailVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        phone: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            phone: z.ZodOptional<z.ZodString>;
            isPhoneVerified: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>>;
        passwordChanged: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    machine: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        hasSecret: z.ZodOptional<z.ZodBoolean>;
        accessTokenType: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        hasSecret: z.ZodOptional<z.ZodBoolean>;
        accessTokenType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        hasSecret: z.ZodOptional<z.ZodBoolean>;
        accessTokenType: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">>;
declare const Org: z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    organizationId: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    organizationId: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
type UserT = z.infer<typeof User>;
type OrgT = z.infer<typeof Org>;
export interface AuditUsersArgs {
    users: UserT[];
    now?: string;
}
export declare function audit_users(args: AuditUsersArgs): string;
export interface CredentialArgs {
    users: UserT[];
}
export declare function credential_report(args: CredentialArgs): string;
export interface OrgCoverageArgs {
    users: UserT[];
    organizations?: OrgT[];
}
export declare function org_coverage(args: OrgCoverageArgs): string;
export {};
