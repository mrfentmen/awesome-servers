import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  NamSorError,
  chineseNameCandidates,
  formatBatch,
  formatCandidates,
  formatCountry,
  formatDiaspora,
  formatFlat,
  formatGender,
  formatUsRaceEthnicity,
  getApiKeyInfo,
  getApiStatus,
  getApiUsage,
  inferCountry,
  inferCountryBatch,
  inferDiaspora,
  inferDiasporaBatch,
  inferGender,
  inferGenderBatch,
  inferGenderFull,
  inferGenderFullGeo,
  inferUsRaceEthnicity,
  inferUsRaceEthnicityBatch,
  japaneseNameKanjiCandidates,
  listApiServices,
  matchChineseName,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

const nameInput = z.object({
  id: z.string().optional().describe("Your own identifier, echoed back in the result"),
  firstName: z.string().describe("First / given name, e.g. 'John'"),
  lastName: z.string().describe("Last / family name, e.g. 'Smith'"),
})

const batchSchema = {
  personalNames: z
    .array(nameInput)
    .min(1)
    .max(100)
    .describe("Names to classify in one request (NamSor allows up to 100)"),
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "namsor-mcp",
    version: "1.0.0",
  })

  server.tool(
    "get_api_status",
    "Check whether each NamSor classifier is currently up, plus its version and any downtime.",
    {},
    async () => {
      try {
        return text(formatFlat("NamSor API status", await getApiStatus()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_api_usage",
    "Show how many NamSor units your API key has used this period and how many remain.",
    {},
    async () => {
      try {
        return text(formatFlat("NamSor API usage", await getApiUsage()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_api_key_info",
    "Show which NamSor plan and quota the configured API key belongs to.",
    {},
    async () => {
      try {
        return text(formatFlat("NamSor API key", await getApiKeyInfo()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_api_services",
    "List the NamSor classification services available and the unit cost of each.",
    {},
    async () => {
      try {
        return text(formatFlat("NamSor services", await listApiServices()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "infer_gender",
    "Infer the likely gender of a first name, or of a first + last name pair.",
    {
      firstName: z.string().describe("First / given name, e.g. 'John'"),
      lastName: z.string().optional().describe("Last / family name — improves accuracy"),
    },
    async ({ firstName, lastName }) => {
      try {
        return text(formatGender(await inferGender(firstName, lastName)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "infer_gender_full",
    "Infer the likely gender of a full name written as one string, e.g. 'John H. Smith'.",
    { fullName: z.string().describe("Full name in one string, e.g. 'John H. Smith'") },
    async ({ fullName }) => {
      try {
        return text(formatGender(await inferGenderFull(fullName)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "infer_gender_full_geo",
    "Infer the likely gender of a full name using the cultural context of an ISO2 country.",
    {
      fullName: z.string().describe("Full name in one string, e.g. 'John H. Smith'"),
      countryIso2: z.string().describe("ISO2 country giving the cultural context, e.g. 'US'"),
    },
    async ({ fullName, countryIso2 }) => {
      try {
        return text(formatGender(await inferGenderFullGeo(fullName, countryIso2)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "infer_gender_batch",
    "Infer the likely gender for up to 100 names in a single NamSor request.",
    batchSchema,
    async ({ personalNames }) => {
      try {
        const results = await inferGenderBatch(personalNames)
        return text(formatBatch("gender predictions", results, formatGender))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "infer_country",
    "Infer the likely country of residence or origin of a full name.",
    {
      personalNameFull: z
        .string()
        .describe("Full name in one string, e.g. 'John Smith' or 'Wang Wei'"),
    },
    async ({ personalNameFull }) => {
      try {
        return text(formatCountry(await inferCountry(personalNameFull)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "infer_country_batch",
    "Infer the likely country for up to 100 full names in one request.",
    batchSchema,
    async ({ personalNames }) => {
      try {
        const results = await inferCountryBatch(personalNames)
        return text(formatBatch("country predictions", results, formatCountry))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "infer_diaspora",
    "Infer the likely ethnicity/diaspora of a name, given the country the person lives in.",
    {
      countryIso2: z.string().describe("ISO2 country of residence, e.g. 'US'"),
      firstName: z.string().describe("First / given name"),
      lastName: z.string().describe("Last / family name"),
    },
    async ({ countryIso2, firstName, lastName }) => {
      try {
        return text(formatDiaspora(await inferDiaspora(countryIso2, firstName, lastName)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "infer_diaspora_batch",
    "Infer the likely ethnicity/diaspora for up to 100 names in one request.",
    batchSchema,
    async ({ personalNames }) => {
      try {
        const results = await inferDiasporaBatch(personalNames)
        return text(formatBatch("diaspora predictions", results, formatDiaspora))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "infer_us_race_ethnicity",
    "Infer US race/ethnicity probabilities from a name plus 5-digit ZIP code.",
    {
      firstNameLastName: z
        .string()
        .describe("First and last name separated by a space, e.g. 'John Smith'"),
      zip5Code: z.string().describe("5-digit US ZIP code, e.g. '90210'"),
      countryIso2: z.string().describe("ISO2 country, normally 'US'"),
    },
    async ({ firstNameLastName, zip5Code, countryIso2 }) => {
      try {
        return text(
          formatUsRaceEthnicity(
            await inferUsRaceEthnicity(firstNameLastName, zip5Code, countryIso2)
          )
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "infer_us_race_ethnicity_batch",
    "Infer US race/ethnicity for up to 100 names in one request.",
    batchSchema,
    async ({ personalNames }) => {
      try {
        const results = await inferUsRaceEthnicityBatch(personalNames)
        return text(formatBatch("US race/ethnicity predictions", results, formatUsRaceEthnicity))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "chinese_name_candidates",
    "List Chinese characters that match a romanised (pinyin) surname and given name.",
    {
      chineseSurnameLatin: z.string().describe("Romanised surname, e.g. 'Wang'"),
      chineseGivenNameLatin: z.string().describe("Romanised given name, e.g. 'Wei'"),
    },
    async ({ chineseSurnameLatin, chineseGivenNameLatin }) => {
      try {
        const result = await chineseNameCandidates(chineseSurnameLatin, chineseGivenNameLatin)
        return text(
          formatCandidates(
            `${chineseSurnameLatin} ${chineseGivenNameLatin} — Chinese character candidates`,
            result
          )
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "match_chinese_name",
    "Score how well a Chinese character name matches a romanised surname + given name.",
    {
      chineseSurnameLatin: z.string().describe("Romanised surname, e.g. 'Wang'"),
      chineseGivenNameLatin: z.string().describe("Romanised given name, e.g. 'Wei'"),
      chineseName: z.string().describe("Chinese name in characters, e.g. '王伟'"),
    },
    async ({ chineseSurnameLatin, chineseGivenNameLatin, chineseName }) => {
      try {
        const result = await matchChineseName(
          chineseSurnameLatin,
          chineseGivenNameLatin,
          chineseName
        )
        return text(formatFlat("Chinese name match", result))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "japanese_name_kanji_candidates",
    "List kanji candidates for a romanised Japanese surname and given name.",
    {
      japaneseSurnameLatin: z.string().describe("Romanised surname, e.g. 'Sato'"),
      japaneseGivenNameLatin: z.string().describe("Romanised given name, e.g. 'Akira'"),
    },
    async ({ japaneseSurnameLatin, japaneseGivenNameLatin }) => {
      try {
        const result = await japaneseNameKanjiCandidates(
          japaneseSurnameLatin,
          japaneseGivenNameLatin
        )
        return text(
          formatCandidates(
            `${japaneseSurnameLatin} ${japaneseGivenNameLatin} — kanji candidates`,
            result
          )
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof NamSorError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
