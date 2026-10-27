import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { formatAlerts, formatScales, formatSpeed, SpaceWeatherError, alerts, scales, solarWindSpeed } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
export function createServer(): McpServer {
  const server = new McpServer({ name: "space-weather-mcp", version: "1.0.0" })
  server.tool("get_solar_wind", "Get recent NOAA proton solar wind speed readings.", {}, async () => { try { return text(formatSpeed(await solarWindSpeed())) } catch (e) { return text(error(e)) } })
  server.tool("get_noaa_scales", "Get NOAA current radio, solar radiation, and geomagnetic scales.", {}, async () => { try { return text(formatScales(await scales())) } catch (e) { return text(error(e)) } })
  server.tool("get_alerts", "Get recent NOAA Space Weather Prediction Center alerts.", {}, async () => { try { return text(formatAlerts(await alerts())) } catch (e) { return text(error(e)) } })
  return server
}
export { SpaceWeatherError }
