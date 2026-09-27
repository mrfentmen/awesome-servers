import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listForms,
  getForm,
  listResponses,
  findResponse,
  accountImages,
  accountImage,
  createForm,
  themes,
  themeDetails,
  workspaces,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "typeform-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_forms",
    {
      title: "List forms",
      description: "All Typeform forms, with id and title.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listForms());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_form",
    {
      title: "Get form",
      description: "One form's structure: fields, logic and settings.",
      inputSchema: z.object({
        form_id: z.string().describe("Form ID from the Typeform URL, e.g. abc123XY")
      }),
      annotations: READ_ONLY,
    },
    async ({ form_id }) => {
      try {
        return text(await getForm(form_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_responses",
    {
      title: "Responses",
      description: "Recent responses to a form, newest first.",
      inputSchema: z.object({
        form_id: z.string().describe("Form ID from the Typeform URL, e.g. abc123XY")
      }),
      annotations: READ_ONLY,
    },
    async ({ form_id }) => {
      try {
        return text(await listResponses(form_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "find_response",
    {
      title: "Find response",
      description: "Response by token.",
      inputSchema: z.object({
        form_id: z.string().describe("Form ID."),
        response_id: z.string().describe("Response token.")
      }),
      annotations: READ_ONLY,
    },
    async ({ form_id, response_id }) => {
      try {
        return text(await findResponse(form_id, response_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "account_images",
    {
      title: "Account images",
      description: "Image library.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await accountImages());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "account_image",
    {
      title: "Image details",
      description: "Single image.",
      inputSchema: z.object({
        image_id: z.string().describe("Image ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ image_id }) => {
      try {
        return text(await accountImage(image_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "themes",
    {
      title: "Themes",
      description: "All themes.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await themes());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "theme_details",
    {
      title: "Theme details",
      description: "Single theme.",
      inputSchema: z.object({
        theme_id: z.string().describe("Theme ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ theme_id }) => {
      try {
        return text(await themeDetails(theme_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "workspaces",
    {
      title: "Workspaces",
      description: "All workspaces.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await workspaces());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "create_form",
    {
      title: "Create form",
      description: "Create a REAL empty form.",
      inputSchema: z.object({
        title: z.string().describe("Form title.")
      }),
      annotations: MUTATING,
    },
    async ({ title }) => {
      try {
        return text(await createForm(title));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}