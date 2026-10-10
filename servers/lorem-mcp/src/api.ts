import { randomInt } from "node:crypto"

const WORDS = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate", "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"]

function sentence(): string {
  const n = randomInt(8, 18)
  const words = Array.from({ length: n }, () => WORDS[randomInt(WORDS.length)])
  const s = words.join(" ")
  return s.charAt(0).toUpperCase() + s.slice(1) + "."
}

export async function generate(args: { paragraphs?: number; words_per_paragraph?: number }): Promise<string> {
  const paragraphs = Math.min(Math.max(args.paragraphs ?? 3, 1), 20)
  const per = Math.min(Math.max(args.words_per_paragraph ?? 40, 10), 200)
  const out: string[] = []
  for (let p = 0; p < paragraphs; p++) {
    let text = ""
    while (text.split(" ").length < per) {
      text = text ? `${text} ${sentence()}` : sentence()
    }
    out.push(text)
  }
  return out.join("\n\n")
}

// ---- muxC tools:

function paragraphs(count: number, wordsEach: number): string[] {
  const out: string[] = []
  for (let p = 0; p < count; p++) {
    let text = ""
    while (text.split(" ").length < wordsEach) {
      const s = sentence()
      text = text ? `${text} ${s.toLowerCase()}` : s
    }
    out.push(text)
  }
  return out
}

