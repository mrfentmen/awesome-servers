

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

export interface InvoiceCurrencyArgs {
  amount: number;
  from: string;
  to: string;
}

