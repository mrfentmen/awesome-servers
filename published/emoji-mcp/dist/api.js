const UA = "mrfentmen-emoji-mcp/1.0";
export class EmojiError extends Error {
}
// Compact catalog: keyword groups -> emoji characters.
const CATALOG = {
    smile: ["😀", "😁", "😂", "🤣", "😊", "😄", "😃", "🙂", "😉", "😍", "🥰", "😘"],
    heart: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💖", "💕", "💗"],
    sad: ["😢", "😭", "😞", "😔", "😟", "😩", "😫", "🥺", "😣", "😖"],
    angry: ["😡", "😠", "🤬", "😤", "😾"],
    animal: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🦄", "🐝", "🦋"],
    dog: ["🐶", "🦮", "🐕", "🐩"],
    cat: ["🐱", "🐈", "🐈‍⬛"],
    food: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🍞", "🧀", "🍕", "🍔", "🍟", "🌭", "🍿", "🍩", "🍪", "🎂", "🍰", "🍫", "🍬"],
    fruit: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝"],
    drink: ["☕", "🍵", "🧋", "🧃", "🥤", "🧉", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹"],
    coffee: ["☕", "🫖"],
    weather: ["☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "💨", "🌪️", "🌈", "☔", "⚡"],
    sun: ["☀️", "🌞", "🌅", "🌄"],
    moon: ["🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🌚"],
    star: ["⭐", "🌟", "✨", "💫"],
    travel: ["✈️", "🚀", "🚗", "🚕", "🚌", "🚎", "🚓", "🚑", "🚒", "🚙", "🚚", "🚲", "🛵", "🏍️", "🚁", "🛸", "⛵", "🛳️"],
    rocket: ["🚀", "🛸", "🛰️"],
    car: ["🚗", "🚕", "🚙", "🚌", "🏎️", "🚓", "🚑", "🚒"],
    sport: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "⛳", "🏹", "🎳", "🏆", "🥇", "🥈", "🥉"],
    music: ["🎵", "🎶", "🎼", "🎤", "🎧", "🎷", "🎺", "🎸", "🎻", "🥁", "🎹"],
    phone: ["📱", "📲", "☎️", "📞", "📟"],
    computer: ["💻", "🖥️", "⌨️", "🖱️", "🖨️", "💾", "💿", "📀"],
    money: ["💰", "💵", "💶", "💷", "💴", "🪙", "💳", "🧾"],
    fire: ["🔥", "🧨"],
    love: ["❤️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "🥰", "😍"],
    party: ["🎉", "🎊", "🎈", "🎂", "🥳", "🎁", "🪅"],
    sleep: ["😴", "💤", "🛌", "🌙"],
    thinking: ["🤔", "🧐", "🤨", "💭"],
    cool: ["😎", "🕶️", "😏", "🤙"],
    hand: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👏", "🙌", "🙏", "🤝", "💪"],
    flag: ["🏁", "🚩", "🎌", "🏳️", "🏴"],
    christmas: ["🎄", "🎅", "🤶", "🧑‍🎄", "❄️", "⛄"],
    halloween: ["🎃", "👻", "💀", "☠️", "🧛", "🧟"],
};
export async function search(args) {
    const q = (args.query ?? "").trim().toLowerCase();
    if (!q)
        throw new EmojiError("Provide a keyword like smile or heart");
    const limit = Math.min(args.limit ?? 20, 60);
    const keys = Object.keys(CATALOG).filter((k) => k.includes(q) || q.includes(k));
    if (!keys.length)
        return `No emoji found for "${q}"`;
    const seen = new Set();
    const out = [];
    for (const key of keys) {
        for (const e of CATALOG[key]) {
            if (!seen.has(e)) {
                seen.add(e);
                out.push(e);
            }
            if (out.length >= limit)
                break;
        }
        if (out.length >= limit)
            break;
    }
    return `Emoji for "${q}" (${out.length}):\n${out.join(" ")}`;
}
export async function categories(args) {
    return `Emoji categories (${Object.keys(CATALOG).length}):\n${Object.keys(CATALOG).sort().join(", ")}`;
}
