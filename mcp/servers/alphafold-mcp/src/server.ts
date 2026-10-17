import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { AlphaFoldError, formatPrediction, getPrediction, modelFiles, proteinIdentity } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "alphafold-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_prediction",
    {
      title: "Get structure prediction",
      description: "Get AlphaFold structure predictions for a UniProt accession: confidence scores, pipeline, dates.",
      inputSchema: z.object({
        accession: z.string().describe("UniProt accession, e.g. 'P69905' (find it with uniprot-mcp)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ accession }) => {
      try {
        const rows = await getPrediction(accession)
        if (rows.length === 0) return text(`No AlphaFold prediction for ${accession}.`)
        return text(rows.map(formatPrediction).join("\n\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "model_files",
    {
      title: "Model file links",
      description: "Direct AlphaFold model file links (mmCIF, PDB, PAE) plus the entry page, without fetching.",
      inputSchema: z.object({
        accession: z.string().describe("UniProt accession, e.g. 'P69905'"),
        version: z.enum(["v4", "v5", "v6"]).default("v6").describe("Model version"),
      }),
      annotations: READ_ONLY,
    },
    async ({ accession, version }) => {
      try {
        const f = modelFiles(accession, version)
        return text(`AlphaFold files for ${accession.trim().toUpperCase()}:\nmmCIF: ${f.cif}\nPDB: ${f.pdb}\nPAE: ${f.pae}\nPage: ${f.page}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "protein_identity",
    {
      title: "Protein identity",
      description: "Say what a UniProt accession actually is, read from the AlphaFold record: the description, gene name, organism and taxId, whether the entry is reviewed, how long the modelled sequence is, whether the entry is a complex with several models, which chain and residue range each model covers, and the sequence checksum. get_prediction returns an accession with confidence figures and never says which protein that is.",
      inputSchema: z.object({
        accession: z.string().describe("UniProt accession, e.g. 'P69905'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ accession }) => {
      try { return text(await proteinIdentity({ accession })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "confidence_profile",
    {
      title: "Confidence profile",
      description: "Break a prediction's confidence into the four pLDDT bands, very high, confident, low and very low, as fractions of the model, and say how much of the structure is trustworthy and how much is not. get_prediction prints the mean pLDDT and the two bad bands only, so it cannot distinguish a uniformly good model from one that is excellent in part and badly guessed in the rest.",
      inputSchema: z.object({
        accession: z.string().describe("UniProt accession, e.g. 'P69905'"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await confidenceProfile(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "model_versions",
    {
      title: "Model versions",
      description: "List which AlphaFold model versions exist for an accession, which the API names as latest, and every file the record actually offers: mmCIF, PDB, BinaryCIF, the PAE JSON and image, the per-residue confidence JSON, the MSA, and the three AlphaMissense annotation files. model_files builds four links by string substitution from a version you type, so it can return URLs that do not exist.",
      inputSchema: z.object({
        accession: z.string().describe("UniProt accession, e.g. 'P69905'"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await modelVersions(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "pae_summary",
    {
      title: "Predicted aligned error summary",
      description: "Open the PAE file the AlphaFold record names and report what it actually says: the matrix size, the mean PAE along the diagonal, the mean PAE between all other residue pairs, and the residues the model places least confidently against the rest of the chain. confidence_profile reports per-residue pLDDT out of the same record, which is how well each residue is modelled, not how the residues sit relative to each other, and model_versions lists the PAE file without opening it.",
      inputSchema: z.object({ accession: z.string().describe("UniProt accession, e.g. 'P69905'"), model: z.number().int().min(0).optional().describe("Which returned model to open, when the accession returns several. Default 0.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await paeSummary(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof AlphaFoldError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
