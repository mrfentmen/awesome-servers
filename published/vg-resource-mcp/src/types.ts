export type ResourceType = "sprites" | "models" | "textures" | "sounds"

export interface Resource {
  type: ResourceType
  name: string
  baseUrl: string
}

export interface ConsoleEntry {
  name: string
  slug: string
  assetCount?: number
}

export interface GameEntry {
  name: string
  slug: string
  assetCount?: number
  console: string
  imageUrl?: string
}

export interface AssetEntry {
  name: string
  id: string
  game: string
  console: string
  thumbnailUrl?: string
  assetUrl: string
  resource: ResourceType
  downloadUrl?: string
  uploadDate?: string
}

export interface AssetDetail extends AssetEntry {
  uploader?: string
  fileSize?: string
  fileType?: string
  description?: string
  tags?: string[]
  gameName?: string
  consoleName?: string
}

export const RESOURCES: Record<ResourceType, Resource> = {
  sprites: { type: "sprites", name: "The Spriters Resource", baseUrl: "https://www.spriters-resource.com" },
  models: { type: "models", name: "The Models Resource", baseUrl: "https://models.spriters-resource.com" },
  textures: { type: "textures", name: "The Textures Resource", baseUrl: "https://textures.spriters-resource.com" },
  sounds: { type: "sounds", name: "The Sounds Resource", baseUrl: "https://sounds.spriters-resource.com" },
}
