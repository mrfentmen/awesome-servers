import { randomInt } from "node:crypto";
import { RngError } from "./api.js";
export async function rollDice(args) {
    const count = Math.min(Math.max(args.count ?? 1, 1), 20);
    const sides = Math.min(Math.max(args.sides ?? 6, 2), 100);
    const rolls = Array.from({ length: count }, () => randomInt(1, sides + 1));
    const total = rolls.reduce((a, b) => a + b, 0);
    return `Rolled ${count}d${sides}: [${rolls.join(", ")}]\nTotal: ${total}`;
}
export async function coinFlip(args) {
    const side = randomInt(0, 2) === 0 ? "heads" : "tails";
    return `Coin flip: ${side}`;
}
export async function randomNumber(args) {
    const min = Math.round(args.min ?? 0);
    const max = Math.round(args.max ?? 100);
    if (min > max)
        throw new RngError("Min must be less than or equal to max");
    const n = randomInt(min, max + 1);
    return `Random integer between ${min} and ${max}: ${n}`;
}
