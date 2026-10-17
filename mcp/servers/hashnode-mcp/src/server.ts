import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, me, publicationPosts, getUser, publicationInfo, postDetails, seriesList, tagInfo, userStats, userPublications, publicationMembers, userProfile, authorEngagement } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "hashnode-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "me",
    {
      title: "My profile",
      description: "The Hashnode user the token belongs to.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await me());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "publication_posts",
    {
      title: "Publication posts",
      description: "Recent posts in a Hashnode publication.",
      inputSchema: z.object({
        host: z.string().describe("Publication host."),
        limit: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ host, limit }) => {
      try {
        return text(await publicationPosts(host, limit));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_user",
    {
      title: "Get user",
      description: "One Hashnode profile by username.",
      inputSchema: z.object({
        username: z.string().describe("Hashnode username, e.g. john")
      }),
      annotations: READ_ONLY,
    },
    async ({ username }) => {
      try {
        return text(await getUser(username));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "publication_info",
    {
      title: "Publication info",
      description: "About a blog.",
      inputSchema: z.object({
        host: z.string().describe("Publication host.")
      }),
      annotations: READ_ONLY,
    },
    async ({ host }) => {
      try {
        return text(await publicationInfo(host));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "post_details",
    {
      title: "Post details",
      description: "Single post.",
      inputSchema: z.object({
        host: z.string().describe("Publication host."),
        slug: z.string().describe("Post slug.")
      }),
      annotations: READ_ONLY,
    },
    async ({ host, slug }) => {
      try {
        return text(await postDetails(host, slug));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "series_list",
    {
      title: "Series list",
      description: "Blog series.",
      inputSchema: z.object({
        host: z.string().describe("Publication host."),
        limit: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ host, limit }) => {
      try {
        return text(await seriesList(host, limit));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "tag_info",
    {
      title: "Tag info",
      description: "Tag details.",
      inputSchema: z.object({
        slug: z.string().describe("Tag slug.")
      }),
      annotations: READ_ONLY,
    },
    async ({ slug }) => {
      try {
        return text(await tagInfo(slug));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "user_stats",
    {
      title: "User stats",
      description: "Follower count.",
      inputSchema: z.object({
        username: z.string().describe("Username.")
      }),
      annotations: READ_ONLY,
    },
    async ({ username }) => {
      try {
        return text(await userStats(username));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "user_publications",
    {
      title: "User blogs",
      description: "Blogs by a user.",
      inputSchema: z.object({
        username: z.string().describe("Username.")
      }),
      annotations: READ_ONLY,
    },
    async ({ username }) => {
      try {
        return text(await userPublications(username));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "publication_members",
    {
      title: "Blog team",
      description: "Members and roles.",
      inputSchema: z.object({
        host: z.string().describe("Publication host.")
      }),
      annotations: READ_ONLY,
    },
    async ({ host }) => {
      try {
        return text(await publicationMembers(host));
      } catch (e) {
        return textError(String(e));
      }
    }
  )


  server.registerTool(
    "user_profile",
    {
      title: "User profile",
      description: "The social and professional footprint of a Hashnode account: tagline, location, what they are available for, linked social accounts and badges.",
      inputSchema: z.object({ username: z.string().describe("Hashnode username, e.g. sandeep") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await userProfile(args.username)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "author_engagement",
    {
      title: "Author engagement",
      description: "How an author's recent posts actually performed: reactions, comments, replies, reading time, age and tags, with the best received post called out. Public data, no token needed.",
      inputSchema: z.object({ username: z.string().describe("Hashnode username, e.g. sandeep"), limit: z.number().int().min(1).max(20).default(8).describe("How many posts to report (default 8, max 20).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await authorEngagement(args)) } catch (e) { return textError(String(e)) }
    }
  )

  return server
}