/**
 * Environment configuration with Zod validation
 * Validates and exports environment variables for the Twilio MCP server
 */
import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    TWILIO_ACCOUNT_SID: z.ZodString;
    TWILIO_AUTH_TOKEN: z.ZodString;
    TWILIO_PHONE_NUMBER: z.ZodString;
    WEBHOOK_PORT: z.ZodDefault<z.ZodNumber>;
    WEBHOOK_BASE_URL: z.ZodString;
    DATABASE_PATH: z.ZodDefault<z.ZodString>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    AUTO_CREATE_CONVERSATIONS: z.ZodDefault<z.ZodBoolean>;
    ENABLE_AI_CONTEXT: z.ZodDefault<z.ZodBoolean>;
    ENABLE_MMS: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_PHONE_NUMBER: string;
    WEBHOOK_PORT: number;
    WEBHOOK_BASE_URL: string;
    DATABASE_PATH: string;
    LOG_LEVEL: "debug" | "info" | "warn" | "error";
    AUTO_CREATE_CONVERSATIONS: boolean;
    ENABLE_AI_CONTEXT: boolean;
    ENABLE_MMS: boolean;
}, {
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_PHONE_NUMBER: string;
    WEBHOOK_BASE_URL: string;
    WEBHOOK_PORT?: number | undefined;
    DATABASE_PATH?: string | undefined;
    LOG_LEVEL?: "debug" | "info" | "warn" | "error" | undefined;
    AUTO_CREATE_CONVERSATIONS?: boolean | undefined;
    ENABLE_AI_CONTEXT?: boolean | undefined;
    ENABLE_MMS?: boolean | undefined;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
export declare const config: {
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_PHONE_NUMBER: string;
    WEBHOOK_PORT: number;
    WEBHOOK_BASE_URL: string;
    DATABASE_PATH: string;
    LOG_LEVEL: "debug" | "info" | "warn" | "error";
    AUTO_CREATE_CONVERSATIONS: boolean;
    ENABLE_AI_CONTEXT: boolean;
    ENABLE_MMS: boolean;
};
export {};
//# sourceMappingURL=env.d.ts.map