

// ---- muxG tools:
const INVOICE_FX = "https://api.frankfurter.app"

// Country prefix -> national VAT number length, for the checks that are plain
// mod-11 over the national part. Others are listed for the report only.
const VAT_LENGTHS: Record<string, number> = {
  AT: 9, BE: 10, BG: 10, CY: 9, CZ: 10, DE: 9, DK: 8, EE: 9, EL: 9, ES: 9, FI: 8,
  FR: 11, HR: 11, HU: 9, IE: 9, IT: 11, LT: 10, LV: 11, NL: 12, PL: 10, PT: 9,
  RO: 10, SE: 12, SI: 10, SK: 10,
}

const IBAN_LENGTHS: Record<string, number> = {
  AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
  BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, EG: 29,
  ES: 24, FI: 18, FO: 18, FR: 27, GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28,
  HR: 21, HU: 28, IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
  LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19, MR: 27, MT: 31,
  MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22,
  SA: 24, SE: 24, SI: 19, SK: 24, SM: 27, ST: 25, SV: 28, TL: 23, TN: 24, TR: 26,
  UA: 29, VA: 22, VG: 24, XK: 20,
}

const digits = (value: string): string => value.replace(/\D/g, "")

/** The ISO 7064 MOD 11-2 check digit scheme, which most EU VAT numbers use. */
const mod11 = (body: string): number => {
  let total = 0;
  let double = true;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    let value = Number(body[i]);
    if (double) {
      value *= 2;
      if (value > 9) value = (value % 10) + 1;
    }
    total += value;
    double = !double;
  }
  return (10 - (total % 10)) % 10;
}

/** Checks one national VAT number with the scheme its country actually uses. */
export async function vatNumberCheck(args: { vat_number: string }): Promise<string> {
  const raw = String(args?.vat_number ?? "").trim().toUpperCase().replace(/[\s.\-]/g, "");
  if (!raw) throw new Error("Provide a VAT number, with or without its country prefix.");
  const country = raw.slice(0, 2);
  const national = raw.slice(2);
  if (!/^[A-Z]{2}\d/.test(raw)) throw new Error(`"${args.vat_number}" does not start with a two-letter country code and a digit.`);

  const lines = [`VAT number ${raw}: country prefix ${country}, national part ${national || "(empty)"}`];
  if (!/^\d+$/.test(national)) {
    lines.push("The national part is not all digits, so no checksum can be computed for it.");
    return lines.join("\n");
  }

  const expectedLength = VAT_LENGTHS[country];
  if (expectedLength && national.length !== expectedLength) {
    lines.push(`Warning: ${country} VAT numbers are ${expectedLength} digits after the prefix; this one has ${national.length}.`);
  } else if (!expectedLength) {
    lines.push(`${country} is not in the mod-11 list, so only the structure below is checked.`);
  }

  if (country === "GB") {
    // UK: 9 digits, then a weight of 8 down to 2, then a mod-11 check character
    const body = national.slice(0, 9);
    const check = Number(national[9]);
    let total = 0;
    for (let i = 0; i < body.length; i += 1) total += Number(body[i]) * (8 - i);
    const remainder = total % 97;
    const expected = remainder === 0 ? 0 : 97 - remainder;
    lines.push(`UK check: weights 8..2 give remainder ${remainder}, so the check character should be ${expected} and is ${national[9] ?? "missing"}.`);
    lines.push(remainder === 0 && check === expected ? "The UK checksum matches." : "The UK checksum does NOT match.");
  } else if (expectedLength) {
    const body = national.slice(0, -1);
    const check = Number(national.slice(-1));
    const expected = mod11(body);
    lines.push(`MOD 11-2: the body ${body} gives check digit ${expected}; the number carries ${check}.`);
    lines.push(check === expected ? "The checksum matches." : "The checksum does NOT match - re-read the number.");
  } else {
    lines.push("No checksum was computed; treat this as a format check only.");
  }

  lines.push("A matching checksum only proves the number was typed consistently. It is not proof the business is registered; the EU VIES service is what answers that.");
  return lines.join("\n");
}

export async function ibanCheck(args: { iban: string }): Promise<string> {
  const raw = String(args?.iban ?? "").trim().toUpperCase().replace(/\s/g, "");
  if (!raw) throw new Error("Provide an IBAN.");
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(raw)) {
    throw new Error(`"${args.iban}" is not in IBAN form: two letters, two digits, then letters and digits.`);
  }
  const country = raw.slice(0, 2);
  const checkDigits = raw.slice(2, 4);
  const bban = raw.slice(4);
  const expectedLength = IBAN_LENGTHS[country];
  const lines = [`IBAN ${country} ${checkDigits} ${bban.length} character(s) of BBAN`];

  if (expectedLength) {
    lines.push(
      raw.length === expectedLength
        ? `Length ${raw.length} matches the ${country} IBAN length.`
        : `Length ${raw.length} does NOT match: a ${country} IBAN is ${expectedLength} characters.`,
    );
  } else {
    lines.push(`${country} is not in the IBAN length table, so only the mod-97 check below is reported.`);
  }

  // ISO 7064 mod 97-10: move the first four characters to the end in their original
  // order (country, then check digits), then map letters to numbers A=10..Z=35
  const rearranged = bban + country + checkDigits;
  const numeric = rearranged
    .split("")
    .map((char) => (/[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char))
    .join("");
  const remainder = BigInt(numeric) % 97n;
  const valid = remainder === 1n;
  lines.push(`MOD 97-10 remainder: ${remainder} (1 means the check digits are correct)`);
  lines.push(valid ? "The IBAN checksum is valid." : "The IBAN checksum is NOT valid.");

  const bankCode = bban.slice(0, 4);
  const account = bban.slice(-6);
  lines.push(`Bank identifier ${bankCode || "not reported"} · account tail ${account || "not reported"}`);
  lines.push("A valid checksum does not mean the account exists; only the bank can answer that.");
  return lines.join("\n");
}

export interface InvoiceCurrencyArgs {
  amount: number;
  from: string;
  to: string;
}

/** Today's ECB reference rate for an invoice amount, so a foreign total can be quoted. */
export async function currencyReference(args: InvoiceCurrencyArgs): Promise<string> {
  const amount = Number(args?.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    throw new Error("amount must be a positive number up to 1,000,000,000.");
  }
  const from = String(args?.from ?? "").trim().toUpperCase();
  const to = String(args?.to ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) throw new Error("Use three-letter currency codes, for example USD and EUR.");
  if (from === to) return `${from} to ${to}: the invoice is already in that currency, so no conversion applies.`;

  const res = await fetch(`${INVOICE_FX}/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`, {
    headers: { "User-Agent": "invoice-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`The reference rate service returned ${res.status}`);
  const text = await res.text();
  if (!text.trim()) throw new Error("The reference rate service returned an empty body.");
  const data = JSON.parse(text) as { date?: string; rates?: Record<string, number> };
  const rate = data.rates?.[to];
  if (typeof rate !== "number") throw new Error(`No ${from} to ${to} rate was published.`);

  const converted = amount * rate;
  return [
    `Invoice total: ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${from}`,
    `ECB reference rate on ${data.date ?? "date not reported"}: 1 ${from} = ${rate} ${to}`,
    `Converted: ${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}`,
    "Reference rates are for reporting. A contract usually fixes the rate on the invoice date, and your bank will use its own.",
  ].join("\n");
}
