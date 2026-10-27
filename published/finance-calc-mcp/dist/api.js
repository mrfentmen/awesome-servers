/**
 * Finance Calculator — keyless public API client.
 */
const BASE = "https://example.invalid";
const SOURCE = "Finance Calculator";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "finance-calc-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
const money = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export async function loanPayment(a) {
    const months = Math.round(a.years * 12);
    if (months < 1 || months > 600)
        throw new SourceError("loan term must be between 1 month and 50 years");
    const r = a.annualRatePercent / 100 / 12;
    const payment = r === 0 ? a.principal / months : (a.principal * r) / (1 - Math.pow(1 + r, -months));
    let balance = a.principal;
    const rows = [];
    for (let m = 1; m <= months && m <= 12; m++) {
        const interest = balance * r;
        const principalPart = payment - interest;
        balance = Math.max(0, balance - principalPart);
        rows.push(`${String(m).padStart(2)}  interest ${money(interest).padStart(12)}  principal ${money(principalPart).padStart(12)}  balance ${money(balance).padStart(13)}`);
    }
    const total = payment * months;
    return [
        `Loan: ${money(a.principal)} at ${a.annualRatePercent}% for ${a.years} years (${months} payments)`,
        `Monthly payment: ${money(payment)}`,
        `Total paid: ${money(total)}`,
        `Total interest: ${money(total - a.principal)}`,
        "",
        "First months:",
        ...rows,
    ].join("\n");
}
export async function compoundInterest(a) {
    const r = a.annualRatePercent / 100;
    const periods = a.years * a.compoundsPerYear;
    if (periods > 100000)
        throw new SourceError("that compounding schedule has too many periods");
    const future = a.principal * Math.pow(1 + r / a.compoundsPerYear, periods);
    const effective = Math.pow(1 + r / a.compoundsPerYear, a.compoundsPerYear) - 1;
    return [
        `Principal: ${money(a.principal)}`,
        `Rate: ${a.annualRatePercent}% compounded ${a.compoundsPerYear}x per year for ${a.years} years`,
        `Future value: ${money(future)}`,
        `Interest earned: ${money(future - a.principal)}`,
        `Effective annual rate: ${(effective * 100).toFixed(4)}%`,
        `Growth: ${((future / a.principal - 1) * 100).toFixed(2)}%`,
    ].join("\n");
}
export async function netPresentValue(a) {
    const r = a.ratePercent / 100;
    if (r <= -1)
        throw new SourceError("discount rate must be above -100%");
    const npv = a.cashflows.reduce((t, c, i) => t + c / Math.pow(1 + r, i), 0);
    const f = (rate) => a.cashflows.reduce((t, c, i) => t + c / Math.pow(1 + rate, i), 0);
    let lo = -0.9999, hi = 10;
    let irr = null;
    if (f(lo) * f(hi) < 0) {
        for (let i = 0; i < 200; i++) {
            const mid = (lo + hi) / 2;
            if (f(lo) * f(mid) <= 0)
                hi = mid;
            else
                lo = mid;
        }
        irr = (lo + hi) / 2;
    }
    return [
        `Discount rate: ${a.ratePercent}%`,
        `Cash flows: ${a.cashflows.length} periods`,
        `NPV: ${money(npv)}`,
        `Decision: ${npv > 0 ? "positive NPV - worth doing at this rate" : npv < 0 ? "negative NPV - destroys value at this rate" : "break-even"}`,
        `IRR: ${irr === null ? "not found in -100%..1000% range" : `${(irr * 100).toFixed(4)}%`}`,
    ].join("\n");
}
