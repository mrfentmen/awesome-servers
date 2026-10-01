export class LagoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LagoError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
function base(): string {
  return (process.env.LAGO_BASE_URL ?? "https://api.getlago.com/api/v1").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.LAGO_API_KEY;
  if (!k) throw new LagoError("Set LAGO_API_KEY (Lago cloud or self-hosted).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new LagoError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new LagoError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listPlans(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/plans?per_page=${n}`);
}

export function listCustomers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/customers?per_page=${n}`);
}

export function listInvoices(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/invoices?per_page=${n}`);
}

// ---- muxG tools:
const MAX_LINES = 50

const cents = (value: number): number => Math.round(value * 100) / 100

const numberAt = (value: unknown, label: string, min: number, max: number): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new LagoError(`${label} must be a number.`);
  if (n < min || n > max) throw new LagoError(`${label} must be between ${min} and ${max}.`);
  return n;
}

const money = (value: number, currency: string): string => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents(value));
  } catch {
    return `${cents(value).toFixed(2)} (currency ${currency} not a valid ISO code)`;
  }
};

export interface InvoiceArithmeticArgs {
  invoice: string;
}

/**
 * Recomputes an invoice from its own line items. Nothing is fetched: this checks
 * the arithmetic a billing system has to get right, line by line.
 */
export async function invoiceArithmetic(args: InvoiceArithmeticArgs): Promise<string> {
  const raw = String(args?.invoice ?? "").trim();
  if (!raw) throw new LagoError("Provide the invoice as a JSON object, or an object with a lines array.");
  let data: Record<string, unknown>;
  try {
    data = typeof raw === "string" ? (JSON.parse(raw) as Record<string, unknown>) : (raw as unknown as Record<string, unknown>);
  } catch (e) {
    throw new LagoError(`That is not valid JSON: ${(e as Error).message}`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new LagoError("The invoice must be a JSON object.");
  }
  const lines = Array.isArray(data.lines) ? (data.lines as Array<Record<string, unknown>>) : [];
  if (!lines.length) throw new LagoError("The invoice has no lines array, or it is empty.");
  if (lines.length > MAX_LINES) throw new LagoError(`The invoice has ${lines.length} lines; this check reads at most ${MAX_LINES}.`);

  const currency = typeof data.currency === "string" && /^[A-Za-z]{3}$/.test(data.currency) ? data.currency.toUpperCase() : "USD";
  const problems: string[] = [];
  const rows: string[] = [];
  let subtotal = 0;
  let lineDiscountTotal = 0;
  let taxable = 0;
  let taxCollected = 0;

  for (const [i, line] of lines.slice(0, MAX_LINES).entries()) {
    const description = String(line.description ?? line.name ?? `line ${i + 1}`).slice(0, 70);
    const quantity = numberAt(line.quantity ?? 1, `Line ${i + 1} quantity`, 0, 1e9);
    const unitPrice = numberAt(line.unit_price ?? line.amount ?? 0, `Line ${i + 1} unit_price`, -1e9, 1e9);
    const discount = numberAt(line.discount ?? 0, `Line ${i + 1} discount`, 0, 1e9);
    const taxRate = numberAt(line.tax_rate ?? 0, `Line ${i + 1} tax_rate`, 0, 1);
    const computed = cents(quantity * unitPrice);
    const discountApplied = cents(Math.min(computed, discount));
    const net = cents(computed - discountApplied);
    const tax = cents(net * taxRate);
    subtotal += computed;
    lineDiscountTotal += discountApplied;
    taxable += net;
    taxCollected += tax;

    const declaredTotal = line.total === undefined ? null : numberAt(line.total, `Line ${i + 1} total`, -1e9, 1e9);
    const drift = declaredTotal === null ? 0 : cents(declaredTotal - net);
    if (Math.abs(drift) > 0.005) {
      problems.push(`Line ${i + 1} (${description}) declares total ${declaredTotal!.toFixed(2)} but the arithmetic gives ${net.toFixed(2)}, a ${drift.toFixed(2)} gap.`);
    }
    rows.push(
      `  ${i + 1}. ${description} - ${quantity} x ${money(unitPrice, currency)} = ${money(computed, currency)}` +
      `${discountApplied ? ` less ${money(discountApplied, currency)} discount` : ""}` +
      `${taxRate ? ` plus ${money(tax, currency)} tax at ${(taxRate * 100).toFixed(2)}%` : ""}` +
      ` = ${money(net + tax, currency)}`,
    );
  }

  const orderDiscount = numberAt(data.discount ?? 0, "Invoice discount", 0, 1e9);
  const discountApplied = cents(Math.min(taxable, orderDiscount));
  const afterDiscount = cents(taxable - discountApplied);
  const taxRate = numberAt(data.tax_rate ?? 0, "Invoice tax_rate", 0, 1);
  const orderTax = taxRate > 0 ? cents(afterDiscount * taxRate) : numberAt(data.tax ?? taxCollected, "Invoice tax", -1e9, 1e9);
  const total = cents(afterDiscount + orderTax);

  const lines_out = [
    `Invoice arithmetic check, ${lines.length} line(s) in ${currency}`,
    "",
    ...rows,
    "",
    `  gross subtotal ${money(subtotal, currency)}`,
    `  less line discounts ${money(lineDiscountTotal, currency)}`,
    `  taxable after line discounts ${money(taxable, currency)}`,
    discountApplied ? `  less order discount ${money(discountApplied, currency)}` : "  no order discount given",
    `  after all discounts ${money(afterDiscount, currency)}`,
    `  tax ${money(orderTax, currency)}${taxRate ? ` at ${(taxRate * 100).toFixed(2)}%` : " taken from the invoice as a fixed amount"}`,
    `  recomputed total ${money(total, currency)}`,
  ];

  if (data.total !== undefined) {
    const declared = numberAt(data.total, "Invoice total", -1e9, 1e9);
    const drift = cents(declared - total);
    lines_out.push("");
    if (Math.abs(drift) <= 0.005) {
      lines_out.push(`The invoice declares ${money(declared, currency)}, which matches the recomputed total.`);
    } else {
      lines_out.push(`The invoice declares ${money(declared, currency)}; the recomputed total is ${money(total, currency)}, a ${drift.toFixed(2)} gap.`);
      problems.unshift(`Invoice total is out by ${drift.toFixed(2)}.`);
    }
  } else {
    lines_out.push("No total was given on the invoice, so there is nothing to compare against.");
  }

  lines_out.push("");
  lines_out.push(
    problems.length
      ? `${problems.length} problem(s) found:\n${problems.map((p) => `  - ${p}`).join("\n")}`
      : "Every line and the invoice total add up.",
  );
  lines_out.push("This checks arithmetic only. It does not know your tax rules, proration or rounding policy.");
  return lines_out.join("\n");
}

export interface UsageBillArgs {
  base_price: number;
  included_units: number;
  overage_unit_price: number;
  usage: number;
  hard_cap_units?: number;
  minimum_charge?: number;
  currency?: string;
}

/**
 * Prices one usage bill against an included-then-overage plan, and shows the
 * curve at a few usage levels so the break-even is visible.
 */
export async function usageBill(args: UsageBillArgs): Promise<string> {
  const currency = typeof args?.currency === "string" && /^[A-Za-z]{3}$/.test(args.currency) ? args.currency.toUpperCase() : "USD";
  const base = numberAt(args?.base_price ?? 0, "base_price", 0, 1e9);
  const included = numberAt(args?.included_units ?? 0, "included_units", 0, 1e9);
  const overagePrice = numberAt(args?.overage_unit_price ?? 0, "overage_unit_price", 0, 1e6);
  const usage = numberAt(args?.usage ?? 0, "usage", 0, 1e9);
  const cap = args?.hard_cap_units === undefined ? null : numberAt(args.hard_cap_units, "hard_cap_units", 0, 1e9);
  const minimum = numberAt(args?.minimum_charge ?? 0, "minimum_charge", 0, 1e9);

  const bill = (units: number): { overage: number; capped: boolean; total: number; effective: number } => {
    const cappedUnits = cap === null ? units : Math.min(units, cap);
    const overage = Math.max(0, cappedUnits - included) * overagePrice;
    const total = cents(Math.max(base + overage, minimum));
    return {
      overage: cents(overage),
      capped: cap !== null && units > cap,
      total,
      effective: units > 0 ? cents(total / units) : Number.NaN,
    };
  };

  const thisBill = bill(usage);
  const breakEven = overagePrice > 0 ? cents(Math.max(0, minimum - base) / overagePrice + included) : null;

  const lines = [
    `Usage bill on an included-then-overage plan, priced in ${currency}`,
    `Plan: base ${money(base, currency)} covering ${included.toLocaleString("en-US")} unit(s), then ${money(overagePrice, currency)} per extra unit${cap !== null ? `, hard cap ${cap.toLocaleString("en-US")} unit(s)` : ""}${minimum ? `, minimum charge ${money(minimum, currency)}` : ""}`,
    "",
    `  usage ${usage.toLocaleString("en-US")} unit(s)`,
    `  overage units ${Math.max(0, Math.min(usage, cap ?? usage) - included).toLocaleString("en-US")} x ${money(overagePrice, currency)} = ${money(thisBill.overage, currency)}`,
    `  bill ${money(thisBill.total, currency)}`,
    `  effective price per unit ${Number.isFinite(thisBill.effective) ? money(thisBill.effective, currency) : "not computable at zero usage"}`,
  ];
  if (thisBill.capped) lines.push(`  The hard cap applies: usage above ${cap!.toLocaleString("en-US")} units costs nothing extra.`);
  if (breakEven !== null) {
    lines.push(`  break-even usage, where the bill equals the minimum charge, is ${breakEven.toLocaleString("en-US", { maximumFractionDigits: 2 })} unit(s)`);
  }

  const levels = [0, included, cap ?? Math.round(included * 2), Math.round((cap ?? included * 2) * 2)]
    .filter((value, index, all) => value >= 0 && all.indexOf(value) === index)
    .slice(0, 4);
  lines.push("");
  lines.push("Bill curve:");
  for (const level of levels) {
    const row = bill(level);
    const bar = "#".repeat(Math.max(1, Math.round(row.total / Math.max(1, base + overagePrice * included) * 20)));
    lines.push(`  ${level.toLocaleString("en-US").padStart(10)} unit(s) -> ${money(row.total, currency).padStart(14)}  ${bar}`);
  }
  lines.push("");
  lines.push("Computed from the plan figures you passed; no Lago account was read and no rate card was fetched.");
  return lines.join("\n");
}
