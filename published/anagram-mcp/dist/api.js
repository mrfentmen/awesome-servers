export class AnagramError extends Error {
}
function canon(s) {
    return s.toLowerCase().replace(/[^a-z]/g, "").split("").sort().join("");
}
function* permutations(arr) {
    if (arr.length <= 1) {
        yield arr;
        return;
    }
    for (let i = 0; i < arr.length; i++) {
        const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
        for (const p of permutations(rest))
            yield [arr[i], ...p];
    }
}
export async function checkAnagram(args) {
    const a = (args.a ?? "").trim();
    const b = (args.b ?? "").trim();
    if (!a || !b)
        throw new AnagramError("Provide two words");
    const is = canon(a) === canon(b) && canon(a) !== "";
    return is ? `"${a}" and "${b}" are anagrams` : `"${a}" and "${b}" are not anagrams`;
}
export async function anagramsOf(args) {
    const word = (args.word ?? "").trim().toLowerCase();
    if (!/^[a-z]+$/.test(word))
        throw new AnagramError("Provide a word with only letters");
    const limit = Math.min(args.limit ?? 12, 100);
    const letters = word.split("");
    const seen = new Set();
    const out = [];
    for (const p of permutations(letters)) {
        const cand = p.join("");
        if (cand !== word && !seen.has(cand)) {
            seen.add(cand);
            out.push(cand);
            if (out.length >= limit)
                break;
        }
    }
    return `${word}: ${out.length} rearrangements\n${out.join(", ")}`;
}
export async function letterProfile(args) {
    const text = (args.text ?? '').trim();
    if (!text)
        throw new AnagramError('Provide the text to profile.');
    const letters = canon(text);
    if (!letters)
        throw new AnagramError('That text has no letters to profile.');
    const counts = new Map();
    for (const ch of letters)
        counts.set(ch, (counts.get(ch) ?? 0) + 1);
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const vowels = 'aeiou'.split('').reduce((s, ch) => s + (counts.get(ch) ?? 0), 0);
    const doubles = ranked.filter(([, n]) => n > 1).map(([ch, n]) => `${ch}${n}`);
    return [
        `Letter profile of "${text.length} character(s)": ${letters.length} letter(s), ${counts.size} distinct.`,
        `Vowels ${vowels} (${Math.round((vowels / letters.length) * 100)}%) | consonants ${letters.length - vowels}`,
        `Most frequent: ${ranked.slice(0, 5).map(([ch, n]) => `${ch} ${n}`).join(', ')}`,
        `Repeated letters: ${doubles.length ? doubles.join(', ') : 'none'}`,
        `Anagram signature: ${letters.split('').sort().join('')}`,
        'Only a-z letters are counted, so accents and digits are ignored.',
    ].join('\n');
}
