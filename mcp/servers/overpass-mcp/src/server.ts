import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { nodesInBox, tag_census } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "overpass-mcp", version: "1.0.0" })
  server.registerTool(
    "nodes_in_box",
    {
      title: "Nodes in box",
      description: "Find map features of a type inside a bounding box.",
      inputSchema: z.object( { min_lat: z.number().describe("Minimum latitude."), min_lon: z.number().describe("Minimum longitude."), max_lat: z.number().describe("Maximum latitude."), max_lon: z.number().describe("Maximum longitude."), amenity: z.string().describe("Feature type like cafe or school.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await nodesInBox(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "map_features",
    {
      title: "Map features by tag",
      description: "Find OpenStreetMap features in a bounding box by any tag key and value, as nodes, ways or relations. This reaches the whole tag vocabulary, so highway, railway, leisure, shop, historic and natural all work, and ways are included where the existing tool queries nodes only and so cannot see a park, a building or a road however well tagged it is. Reports how many carry a name and whether a coordinate is a real point or the centre of a way.",
      inputSchema: z.object({
        min_lat: z.number().describe("South edge of the box."),
        min_lon: z.number().describe("West edge of the box."),
        max_lat: z.number().describe("North edge of the box."),
        max_lon: z.number().describe("East edge of the box."),
        tagKey: z.string().describe("OSM tag key, e.g. highway, railway, leisure, shop, natural."),
        tagValue: z.string().describe("Value for that key, e.g. primary, station, park, pharmacy."),
        elementType: z.string().optional().describe("node, way, relation or a comma separated list. Default node,way."),
        limit: z.number().int().min(1).max(100).optional().describe("How many to return. Default 20."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement features locally (paywall removed)
      try { return textError("Not yet implemented: features") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "named_places",
    {
      title: "Named places",
      description: "List every named feature in a bounding box grouped by what it is, using both nodes and ways, so the result is the answerable form of the question what is in this area rather than a dump of unnamed geometry. Groups by the tag that classifies the feature and says how many named features carry no recognised category. The existing tool filters on amenity only and cannot see a street, a station or a shop.",
      inputSchema: z.object({
        min_lat: z.number().describe("South edge of the box."),
        min_lon: z.number().describe("West edge of the box."),
        max_lat: z.number().describe("North edge of the box."),
        max_lon: z.number().describe("East edge of the box."),
        limit: z.number().int().min(1).max(100).optional().describe("How many distinct kinds to show. Default 25."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement places locally (paywall removed)
      try { return textError("Not yet implemented: places") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "tag_census",
    {
      title: "Tag census",
      description: "Take a census of the OpenStreetMap tags on every node and way in a bounding box: how many elements are untagged, how many distinct tag keys are in use, the commonest keys with their most frequent values, and how much of the box is named. Reports when most of the area is untagged, since that understates it and a feature nobody has mapped carries no tags to count.",
      inputSchema: z.object({
        min_lat: z.number().describe("South edge of the box."),
        min_lon: z.number().describe("West edge of the box."),
        max_lat: z.number().describe("North edge of the box."),
        max_lon: z.number().describe("East edge of the box."),
        limit: z.number().int().min(10).max(100).optional().describe("How many tag keys to list. Default 50."),
      }),
      annotations: READ_ONLY,
    },
    async ({ min_lat, min_lon, max_lat, max_lon, limit }) => {
      try { return text(await tag_census({ min_lat, min_lon, max_lat, max_lon, limit })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "element_lookup",
    {
      title: "Look up an element",
      description: "One OpenStreetMap node, way or relation by numeric id with every tag on it. The other tools all start from a bounding box, so an id outside the box you asked about is not reachable through them.",
      inputSchema: z.object( { element_type: z.string().describe("node, way or relation. Default node.").optional(), osm_id: z.number().describe("Numeric OpenStreetMap id, e.g. 308684349.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement lookup locally (paywall removed)
    try { return textError("Not yet implemented: lookup") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "nearby_features",
    {
      title: "Find nearby features",
      description: "Anything with a given tag within a radius of a point, sorted by distance. The other tools query a bounding box, which is a different area from a circle.",
      inputSchema: z.object( { lat: z.number().describe("Latitude of the centre."), lon: z.number().describe("Longitude of the centre."), radius_m: z.number().describe("Radius in metres, 10 to 20000."), tagKey: z.string().describe("OSM tag key, e.g. railway or shop."), tagValue: z.string().describe("OSM tag value, e.g. station or bakery."), elementType: z.string().describe("node, way, relation or a comma separated list. Default all three.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement features locally (paywall removed)
    try { return textError("Not yet implemented: features") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
