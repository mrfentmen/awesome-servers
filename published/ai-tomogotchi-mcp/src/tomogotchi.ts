import { readFile, writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

export interface PetState {
  name: string
  hunger: number
  happiness: number
  energy: number
  health: number
  age: number
  mood: string
  lastFed: string
  lastPlayed: string
  createdAt: string
}

const SAVE_DIR = join(tmpdir(), "ai-tomogotchi")
const SAVE_FILE = join(SAVE_DIR, "pet.json")

const MOODS = ["happy", "sad", "hungry", "tired", "sick", "excited", "bored"]

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val))
}

function getMood(state: PetState): string {
  if (state.health < 20) return "sick"
  if (state.hunger < 20) return "hungry"
  if (state.energy < 20) return "tired"
  if (state.happiness > 70) return "excited"
  if (state.happiness < 30) return "sad"
  if (state.happiness > 50) return "happy"
  return "bored"
}

async function ensureSaveDir(): Promise<void> {
  await mkdir(SAVE_DIR, { recursive: true })
}

export async function createPet(name: string): Promise<PetState> {
  await ensureSaveDir()
  const state: PetState = {
    name,
    hunger: 80,
    happiness: 80,
    energy: 80,
    health: 100,
    age: 0,
    mood: "happy",
    lastFed: new Date().toISOString(),
    lastPlayed: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
  state.mood = getMood(state)
  await writeFile(SAVE_FILE, JSON.stringify(state, null, 2))
  return state
}

export async function loadPet(): Promise<PetState | null> {
  try {
    const data = await readFile(SAVE_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return null
  }
}

export async function savePet(state: PetState): Promise<void> {
  await ensureSaveDir()
  await writeFile(SAVE_FILE, JSON.stringify(state, null, 2))
}

export async function feedPet(): Promise<PetState> {
  const state = await loadPet()
  if (!state) throw new Error("No pet exists. Create one first with create_pet.")
  state.hunger = clamp(state.hunger + 30)
  state.happiness = clamp(state.happiness + 10)
  state.health = clamp(state.health + 5)
  state.lastFed = new Date().toISOString()
  state.mood = getMood(state)
  await savePet(state)
  return state
}

export async function playWithPet(): Promise<PetState> {
  const state = await loadPet()
  if (!state) throw new Error("No pet exists. Create one first with create_pet.")
  state.happiness = clamp(state.happiness + 25)
  state.energy = clamp(state.energy - 15)
  state.hunger = clamp(state.hunger - 10)
  state.lastPlayed = new Date().toISOString()
  state.mood = getMood(state)
  await savePet(state)
  return state
}

export async function restPet(): Promise<PetState> {
  const state = await loadPet()
  if (!state) throw new Error("No pet exists. Create one first with create_pet.")
  state.energy = clamp(state.energy + 40)
  state.health = clamp(state.health + 10)
  state.mood = getMood(state)
  await savePet(state)
  return state
}

export async function healPet(): Promise<PetState> {
  const state = await loadPet()
  if (!state) throw new Error("No pet exists. Create one first with create_pet.")
  state.health = clamp(state.health + 30)
  state.mood = getMood(state)
  await savePet(state)
  return state
}

export async function checkPet(): Promise<PetState> {
  const state = await loadPet()
  if (!state) throw new Error("No pet exists. Create one first with create_pet.")
  state.mood = getMood(state)
  return state
}

export async function agePet(): Promise<PetState> {
  const state = await loadPet()
  if (!state) throw new Error("No pet exists. Create one first with create_pet.")
  state.age += 1
  state.hunger = clamp(state.hunger - 5)
  state.happiness = clamp(state.happiness - 3)
  state.energy = clamp(state.energy - 5)
  if (state.hunger < 30) state.health = clamp(state.health - 10)
  if (state.happiness < 30) state.health = clamp(state.health - 5)
  state.mood = getMood(state)
  await savePet(state)
  return state
}

export async function deletePet(): Promise<boolean> {
  const { rm } = await import("node:fs/promises")
  try {
    await rm(SAVE_FILE, { force: true })
    return true
  } catch {
    return false
  }
}
