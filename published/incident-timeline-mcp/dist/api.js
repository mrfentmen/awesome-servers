// ---- muxB tools:
const ERROR_LINE = /\b(?:error|errors|fatal|critical|panic|exception|traceback|failed|failure)\b/i;
const WARN_LINE = /\b(?:warn|warning|deprecated|retry|retried|throttled|timeout|timed out)\b/i;
const ISO_STAMP = /\b(20\d{2})[-/](\d{2})[-/](\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;
const STACK_LINE = /(?:\bat\s+[\w$.<>[\]]+\s*\(|\.ts:\d+:\d+|\.js:\d+:\d+|File\s+"[^"]+",\s+line\s+\d+)/;
const EXCEPTION_NAME = /\b[A-Z][A-Za-z0-9]*(?:Error|Exception|Failure|Panic)\b/;
const HTTP_STATUS = /\b(?:status|status_?code|http)\D{0,4}(\d{3})\b|\b([45]\d{2})\b/;
const DURATION = /\b\d+(?:\.\d+)?\s?(?:ms|us|µs|ns|s)\b/;
function levelOf(line) {
    if (ERROR_LINE.test(line))
        return "error";
    if (WARN_LINE.test(line))
        return "warning";
    return "other";
}
function stampMs(line) {
    const match = ISO_STAMP.exec(line);
    if (!match)
        return null;
    const value = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), match[6] ? Number(match[6]) : 0);
    return Number.isFinite(value) ? value : null;
}
function pad(label, width = 16) {
    return label.length >= width ? label : label + " ".repeat(width - label.length);
}
export async function classifyLogLine(args) {
    const line = args.line ?? "";
    if (!line.trim())
        throw new Error("Provide one log line in line to classify");
    if (line.length > 20000)
        throw new Error("Keep the line under 20000 characters");
    const level = levelOf(line);
    const status = HTTP_STATUS.exec(line);
    const statusCode = status ? Number(status[1] ?? status[2]) : null;
    const hasStack = STACK_LINE.test(line);
    const hasException = EXCEPTION_NAME.test(line);
    const hasDuration = DURATION.test(line);
    const hasStamp = stampMs(line) !== null;
    const fatal = /\b(?:fatal|critical|panic|segfault|out of memory|oom)\b/i.test(line);
    let score = 0;
    if (fatal)
        score += 5;
    else if (level === "error")
        score += 3;
    else if (level === "warning")
        score += 1;
    if (hasException)
        score += 1;
    if (hasStack)
        score += 2;
    if (statusCode !== null && !Number.isNaN(statusCode))
        score += statusCode >= 500 ? 3 : statusCode >= 400 ? 1 : 0;
    if (hasDuration)
        score += 1;
    const bounded = Math.min(10, score);
    const band = bounded >= 8 ? "critical" : bounded >= 6 ? "high" : bounded >= 3 ? "medium" : bounded >= 1 ? "low" : "unclassified";
    const signals = [
        `timestamp=${hasStamp ? "yes" : "no"}`,
        `httpStatus=${statusCode === null || Number.isNaN(statusCode) ? "no" : String(statusCode)}`,
        `stackFrame=${hasStack ? "yes" : "no"}`,
        `exceptionName=${hasException ? "yes" : "no"}`,
        `duration=${hasDuration ? "yes" : "no"}`,
    ].join("  ");
    return [
        `Log line classification (${line.length} characters; line text not echoed)`,
        `${pad("Level")}${level}`,
        `${pad("Signals")}${signals}`,
        `${pad("Severity score")}${bounded}/10`,
        `${pad("Band")}${band}`,
        `${pad("Scoring")}fatal 5 / error 3 / warning 1, +1 exception name, +2 stack frame, +3 http 5xx, +1 http 4xx, +1 duration token, capped at 10`,
    ].join("\n");
}
