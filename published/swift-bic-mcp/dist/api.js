const UA = "mrfentmen-swift-bic-mcp/1.0";
export class SwiftError extends Error {
}
// Bundled directory of common bank BICs. Best effort, not exhaustive.
const DIRECTORY = [
    { bic: "BOFAUS3N", bank: "Bank of America", country: "US" },
    { bic: "CHASUS33", bank: "JPMorgan Chase", country: "US" },
    { bic: "WFBIUS6S", bank: "Wells Fargo", country: "US" },
    { bic: "CITIUS33", bank: "Citibank", country: "US" },
    { bic: "GSIBUS33", bank: "Goldman Sachs", country: "US" },
    { bic: "MSFFUS33", bank: "Morgan Stanley", country: "US" },
    { bic: "HBUKGB4B", bank: "HSBC Bank", country: "GB" },
    { bic: "NWBKGB2L", bank: "National Westminster Bank", country: "GB" },
    { bic: "BARCGB22", bank: "Barclays Bank", country: "GB" },
    { bic: "LOYDGB2L", bank: "Lloyds Bank", country: "GB" },
    { bic: "RBOSGB2L", bank: "Royal Bank of Scotland", country: "GB" },
    { bic: "SANTGB2L", bank: "Santander UK", country: "GB" },
    { bic: "DEUTDEFF", bank: "Deutsche Bank", country: "DE" },
    { bic: "COBADEFF", bank: "Commerzbank", country: "DE" },
    { bic: "DRESDEFF", bank: "Commerzbank (ex Dresdner)", country: "DE" },
    { bic: "HYVEDEMM", bank: "UniCredit Bank Germany", country: "DE" },
    { bic: "BNPAFRPP", bank: "BNP Paribas", country: "FR" },
    { bic: "CRLYFRPP", bank: "Credit Lyonnais", country: "FR" },
    { bic: "SOGEFRPP", bank: "Societe Generale", country: "FR" },
    { bic: "AGRIFRPP", bank: "Credit Agricole", country: "FR" },
    { bic: "UNCRITMM", bank: "UniCredit", country: "IT" },
    { bic: "BCITITMM", bank: "Intesa Sanpaolo", country: "IT" },
    { bic: "MONZITMM", bank: "Banca Monte dei Paschi", country: "IT" },
    { bic: "ABNANL2A", bank: "ABN AMRO", country: "NL" },
    { bic: "INGBNL2A", bank: "ING Bank", country: "NL" },
    { bic: "RABONL2U", bank: "Rabobank", country: "NL" },
    { bic: "UBSWCHZH", bank: "UBS", country: "CH" },
    { bic: "CRESCHZZ", bank: "Credit Suisse", country: "CH" },
    { bic: "ZUERCHZZ", bank: "Zurcher Kantonalbank", country: "CH" },
    { bic: "BKCHUS33", bank: "Bank of China (New York)", country: "US" },
    { bic: "ICBKUS33", bank: "ICBC New York", country: "US" },
    { bic: "SMBCJPJT", bank: "Sumitomo Mitsui Banking", country: "JP" },
    { bic: "BOTKJPJT", bank: "Bank of Tokyo-Mitsubishi UFJ", country: "JP" },
    { bic: "BKIDINBB", bank: "Bank of India", country: "IN" },
    { bic: "SBININBB", bank: "State Bank of India", country: "IN" },
    { bic: "RZBAATWW", bank: "Raiffeisen Bank", country: "AT" },
    { bic: "BKAUATWW", bank: "Bank Austria", country: "AT" },
    { bic: "BBRUBEBB", bank: "ING Belgium", country: "BE" },
    { bic: "GEBABEBB", bank: "BNP Paribas Fortis", country: "BE" },
    { bic: "CAIXESBB", bank: "CaixaBank", country: "ES" },
    { bic: "BBVAESMM", bank: "BBVA", country: "ES" },
    { bic: "ESPBESMM", bank: "Banco Santander", country: "ES" },
    { bic: "DABAIE2D", bank: "Allied Irish Banks", country: "IE" },
    { bic: "BOFIIE2D", bank: "Bank of Ireland", country: "IE" },
    { bic: "SEBKPTSH", bank: "SEB Bank", country: "SE" },
    { bic: "HANDSESS", bank: "Handelsbanken", country: "SE" },
    { bic: "NORWNOKK", bank: "DNB Bank", country: "NO" },
    { bic: "DABADKKK", bank: "Danske Bank", country: "DK" },
    { bic: "OKOYFIHH", bank: "OP Financial Group", country: "FI" },
    { bic: "NEDSZAJJ", bank: "Nedbank", country: "ZA" },
    { bic: "FIRNZAJJ", bank: "First National Bank", country: "ZA" },
    { bic: "ABNAAU2S", bank: "ABN AMRO Australia", country: "AU" },
    { bic: "CTBAAU2S", bank: "Commonwealth Bank of Australia", country: "AU" },
    { bic: "ROYCGB22", bank: "NatWest (ex Royal Bank of Scotland)", country: "GB" },
    { bic: "NADEAU2S", bank: "National Australia Bank", country: "AU" },
    { bic: "BCMLMXMM", bank: "Bancomer BBVA Mexico", country: "MX" },
    { bic: "BRLIARBA", bank: "Banco de la Nacion Argentina", country: "AR" },
    { bic: "ITUBBRSL", bank: "Itau Unibanco", country: "BR" },
    { bic: "BBDEBGSF", bank: "Bulgarian American Credit Bank", country: "BG" },
];
export async function search(args) {
    const q = (args.query ?? "").trim().toUpperCase();
    if (!q)
        throw new SwiftError("Provide a BIC, bank name, or country code");
    const limit = Math.min(args.limit ?? 10, 25);
    const hits = DIRECTORY.filter((e) => e.bic.includes(q) || e.bank.toUpperCase().includes(q) || e.country.toUpperCase() === q).slice(0, limit);
    if (!hits.length)
        return `No BIC found for "${q}"`;
    return hits.map((e, i) => `${i + 1}. ${e.bic} | ${e.bank} | ${e.country}`).join("\n");
}
export async function validate(args) {
    const bic = (args.bic ?? "").trim().toUpperCase();
    if (!bic)
        throw new SwiftError("Provide a BIC code");
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) {
        return `${bic} is not a valid BIC format (8 or 11 characters)`;
    }
    const country = bic.slice(4, 6);
    const match = DIRECTORY.find((e) => e.bic === bic);
    return `${bic} is a valid BIC\nCountry: ${country}${match ? `\nBank: ${match.bank}` : ""}${match ? "" : "\nBank: not in bundled directory (code may still be valid)"}`;
}
