import type { Game, GameState } from "./engine.js";
/**
 * The bundled games. Each is declared as pure data — rooms, items with
 * use-effects, hints — so new games are easy to add without touching
 * the engine.
 */
export declare const colossalDungeon: Game;
export declare const brainrotManor: Game;
export declare const GAMES: Record<string, Game>;
export declare function describeGames(): string;
export type { GameState };
