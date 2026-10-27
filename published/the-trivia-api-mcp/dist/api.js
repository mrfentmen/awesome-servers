const BASE = 'https://the-trivia-api.com/v2/questions';
export async function questions(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
    const res = await fetch(`${BASE}?limit=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-the-trivia-api-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`The Trivia API returned ${res.status}`);
    const rows = (await res.json());
    if (!rows.length)
        return 'No questions returned.';
    return `Trivia questions (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const answers = [...(r.incorrectAnswers ?? []), r.correctAnswer ?? ''];
            return `${i + 1}. [${r.category ?? ''}] ${r.question?.text ?? ''}\n   A: ${answers.join(' | ')}\n   Correct: ${r.correctAnswer ?? ''}`;
        })
            .join('\n');
}
// ---- muxB tools:
const CATEGORIES = `${BASE.replace('/questions', '/categories')}`;
