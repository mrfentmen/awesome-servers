import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const segments = text
    .split("~")
    .map((segment) => segment.replace(/\r?\n/g, "").trim())
    .filter((segment) => segment.length > 0)

  if (segments.length === 0) {
    return { format: "X12 837", records, meta: { segments: 0 }, issues: [{ code: "empty", severity: "error", message: "File has no segments" }] }
  }

  const elements = segments.map((segment) => segment.split("*"))
  const names = elements.map((fields) => fields[0])
  const required = ["ISA", "GS", "ST", "SE", "GE", "IEA"]
  for (const name of required) {
    if (!names.includes(name)) {
      issues.push({ code: `missing-${name.toLowerCase()}`, severity: "error", message: `Interchange has no ${name} segment` })
    }
  }
  if (names[0] !== "ISA") {
    issues.push({ code: "bad-start", severity: "error", message: `File must start with ISA, found ${names[0] ?? "nothing"}` })
  }
  const isa = elements[0] ?? []
  if (isa.length > 0 && isa.length !== 17) {
    issues.push({ code: "bad-isa", severity: "error", message: `ISA must have 16 elements, found ${isa.length - 1}` })
  }
  const st = names.indexOf("ST")
  if (st >= 0 && !/^837/.test(elements[st][1] ?? "")) {
    issues.push({ code: "not-837", severity: "warning", message: `ST transaction set is ${elements[st][1]}, not 837` })
  }

  const seIndex = names.lastIndexOf("SE")
  const se = seIndex >= 0 ? elements[seIndex] : []
  const declared = Number(se[1])
  const actual = st >= 0 && seIndex >= 0 ? seIndex - st + 1 : 0
  if (seIndex >= 0 && Number.isInteger(declared) && declared !== actual) {
    issues.push({ code: "bad-se-count", severity: "error", message: `SE says ${declared} segments, ST..SE has ${actual}` })
  }

  const ge = elements[names.lastIndexOf("GE")] ?? []
  const iea = elements[names.lastIndexOf("IEA")] ?? []
  if (ge.length > 1 && Number(ge[1]) !== 1) {
    issues.push({ code: "bad-ge", severity: "warning", message: `GE counts ${ge[1]} transaction sets` })
  }
  if (iea.length > 1 && Number(iea[1]) !== 1) {
    issues.push({ code: "bad-iea", severity: "warning", message: `IEA counts ${iea[1]} interchanges` })
  }

  for (const [index, fields] of elements.entries()) {
    records.push({ id: `segment:${index + 1}`, kind: fields[0], fields: { name: fields[0], elements: fields.length - 1, line: index + 1 } })
  }

  return {
    format: "X12 837",
    records,
    meta: {
      segments: elements.length,
      transactionSet: st >= 0 ? elements[st][1] ?? "" : "",
      claimSegments: records.filter((record) => record.kind === "CLM").length,
      subscribers: records.filter((record) => record.kind === "NM1").length,
    },
    issues,
  }
}

const reference = [
  "X12 837 health care claim (EDI)",
  "",
  "ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *261112*1200*^*00501*000000001*0*P*:~",
  "GS*HC*SENDER*RECEIVER*20261112*1200*1*X*005010X222A1~",
  "ST*837*0001~",
  "BHT*0019*00*0123*20261112*1200*CH~",
  "CLM*12345*100***11:B:1*Y*A*Y*Y~",
  "SE*4*0001~",
  "GE*1*1~",
  "IEA*1*000000001~",
  "",
  "Segments end with ~ and elements are separated by *.",
  "ISA starts the interchange, GS the group, ST the transaction set.",
  "SE counts the segments from ST to SE inclusive.",
].join("\n")

export const format: FormatModule = {
  slug: "x12-837",
  displayName: "X12 837",
  extensions: [".edi", ".837"],
  description: "Parse X12 837 claims, validate ISA, ST/SE counts and claim segments.",
  reference,
  parse,
  sample: () =>
    [
      "ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *261112*1200*^*00501*000000001*0*P*:~",
      "GS*HC*SENDER*RECEIVER*20261112*1200*1*X*005010X222A1~",
      "ST*837*0001~",
      "BHT*0019*00*0123*20261112*1200*CH~",
      "CLM*12345*100***11:B:1*Y*A*Y*Y~",
      "NM1*IL*1*DOE*JANE****MI*123456789~",
      "SE*5*0001~",
      "GE*1*1~",
      "IEA*1*000000001~",
    ].join("\n") + "\n",
}
