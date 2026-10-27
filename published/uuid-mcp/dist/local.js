import { randomUUID } from "node:crypto";
export async function generateUuid(_args) {
    return randomUUID();
}
export async function generateMany(args) {
    const n = Math.min(Math.max(args.count ?? 5, 1), 100);
    return Array.from({ length: n }, () => randomUUID()).join("\n");
}
