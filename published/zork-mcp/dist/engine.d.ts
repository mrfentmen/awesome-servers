/**
 * A compact interactive-fiction (text adventure) engine.
 *
 * Rooms, takeable items, locked exits, dark rooms, and per-item use
 * effects are declared as plain data in games.ts. The engine handles
 * natural-language-ish command parsing, player state, and scoring.
 * It is deliberately tiny (no Z-machine) but supports real gameplay:
 * moving, inventory, combat-light puzzles, lighting, and unlocking.
 */
export type Direction = "north" | "south" | "east" | "west" | "up" | "down";
export interface GameState {
    roomId: string;
    inventory: string[];
    flags: Record<string, boolean>;
    lights: string[];
    moves: number;
    score: number;
    maxScore: number;
    won: boolean;
}
export interface GameItem {
    id: string;
    name: string;
    aliases: string[];
    takeable: boolean;
    description: string;
    /** Called when the player "use <item>" (optionally "use <item> on <target>"). */
    use?: (state: GameState, target?: string) => string;
}
export interface Room {
    id: string;
    name: string;
    description: string;
    exits: Partial<Record<Direction, string>>;
    dark?: boolean;
    items?: string[];
    /** Exit blocked until `flag` is set — e.g. a troll guarding it. */
    block?: {
        exit: Direction;
        flag: string;
        message: string;
    };
    /** Exit requiring a lit light source. */
    needsLight?: Direction;
    /** Optional room-specific text hooks. */
    onLook?: (state: GameState) => string;
}
export interface Game {
    id: string;
    name: string;
    intro: string;
    startRoom: string;
    winMessage: string;
    rooms: Record<string, Room>;
    items: Record<string, GameItem>;
    hints: Record<string, string>;
    /** Item ids worth 1 point each; game won when all are collected. */
    treasures: string[];
}
export declare class Adventure {
    game: Game;
    state: GameState;
    constructor(game: Game);
    start(): string;
    /** Execute a natural-language command, returning the game's response. */
    act(command: string): string;
    private doLook;
    private doMove;
    private doTake;
    private doDrop;
    private doInventory;
    private doUse;
    private doHelp;
    doScore(): string;
    hint(): string;
    private describeItem;
    private roomDescription;
    private grueAttack;
    private bumpScore;
}
