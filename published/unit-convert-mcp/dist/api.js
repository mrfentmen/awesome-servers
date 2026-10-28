/**
 * Unit Converter — keyless public API client.
 */
export class SourceError extends Error {
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
const CATEGORIES = {
    length: {
        base: "metre",
        units: {
            metre: 1, kilometre: 1000, centimetre: 0.01, millimetre: 0.001, micrometre: 0.000001,
            nanometre: 1e-9, mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254,
            "nautical mile": 1852, "light year": 9.4607304725808e15, angstrom: 1e-10,
        },
    },
    mass: {
        base: "kilogram",
        units: {
            kilogram: 1, gram: 0.001, milligram: 0.000001, microgram: 1e-9, tonne: 1000,
            pound: 0.45359237, ounce: 0.028349523125, stone: 6.35029318, "short ton": 907.18474,
            "long ton": 1016.0469088, carat: 0.0002,
        },
    },
    temperature: {
        base: "celsius",
        units: { celsius: 1, fahrenheit: 1, kelvin: 1 },
    },
    volume: {
        base: "litre",
        units: {
            litre: 1, millilitre: 0.001, "cubic metre": 1000, "cubic centimetre": 0.001,
            "us gallon": 3.785411784, "imperial gallon": 4.54609, "us quart": 0.946352946,
            "us pint": 0.473176473, "us cup": 0.2365882365, "us fluid ounce": 0.0295735295625,
            "imperial fluid ounce": 0.0284130625, tablespoon: 0.01478676478125, teaspoon: 0.00492892159375,
            "oil barrel": 158.987294928,
        },
    },
    area: {
        base: "square metre",
        units: {
            "square metre": 1, "square kilometre": 1000000, "square centimetre": 0.0001,
            "square mile": 2589988.110336, hectare: 10000, acre: 4046.8564224,
            "square foot": 0.09290304, "square inch": 0.00064516, "square yard": 0.83612736,
        },
    },
    speed: {
        base: "metre per second",
        units: {
            "metre per second": 1, "kilometre per hour": 1 / 3.6, "mile per hour": 0.44704,
            knot: 0.5144444444444445, mach: 340.29, "foot per second": 0.3048,
        },
    },
    data: {
        base: "byte",
        units: {
            byte: 1, bit: 0.125, kilobyte: 1000, megabyte: 1e6, gigabyte: 1e9, terabyte: 1e12,
            petabyte: 1e15, kibibyte: 1024, mebibyte: 1048576, gibibyte: 1073741824,
            tebibyte: 1099511627776, pebibyte: 1125899906842624,
        },
    },
    energy: {
        base: "joule",
        units: {
            joule: 1, kilojoule: 1000, calorie: 4.184, kilocalorie: 4184, "watt hour": 3600,
            "kilowatt hour": 3.6e6, btu: 1055.05585262, electronvolt: 1.602176634e-19,
            erg: 1e-7, "foot pound": 1.3558179483314004,
        },
    },
    pressure: {
        base: "pascal",
        units: {
            pascal: 1, kilopascal: 1000, megapascal: 1e6, bar: 100000, millibar: 100,
            atmosphere: 101325, psi: 6894.757293168, torr: 133.32236842105263,
            "inch of mercury": 3386.389,
        },
    },
    time: {
        base: "second",
        units: {
            second: 1, millisecond: 0.001, microsecond: 1e-6, minute: 60, hour: 3600, day: 86400,
            week: 604800, fortnight: 1209600, year: 31557600, "julian year": 31557600,
        },
    },
    angle: {
        base: "radian",
        units: { radian: 1, degree: 0.017453292519943295, gradian: 0.015707963267948967, turn: 6.283185307179586, arcminute: 0.0002908882086657216 },
    },
};
const ALIASES = {
    m: "metre", km: "kilometre", cm: "centimetre", mm: "millimetre", um: "micrometre",
    nm: "nanometre", mi: "mile", yd: "yard", yds: "yard", ft: "foot", feet: "foot",
    in: "inch", ins: "inch", nmi: "nautical mile", ly: "light year",
    kg: "kilogram", g: "gram", mg: "milligram", ug: "microgram", t: "tonne", lb: "pound",
    lbs: "pound", oz: "ounce", st: "stone",
    c: "celsius", celsius: "celsius", centigrade: "celsius", f: "fahrenheit", k: "kelvin",
    l: "litre", liter: "litre", lt: "litre", ml: "millilitre", milliliter: "millilitre",
    gal: "us gallon", gallon: "us gallon", qt: "us quart", quart: "us quart", pt: "us pint",
    pint: "us pint", cup: "us cup", tbsp: "tablespoon", tsp: "teaspoon",
    kph: "kilometre per hour", kmh: "kilometre per hour", kmph: "kilometre per hour",
    mph: "mile per hour", mps: "metre per second", fps: "foot per second",
    b: "byte", bit: "bit", kb: "kilobyte", mb: "megabyte", gb: "gigabyte", tb: "terabyte",
    pb: "petabyte", kib: "kibibyte", mib: "mebibyte", gib: "gibibyte", tib: "tebibyte", pib: "pebibyte",
    j: "joule", kj: "kilojoule", cal: "calorie", kcal: "kilocalorie", wh: "watt hour",
    kwh: "kilowatt hour", ev: "electronvolt",
    pa: "pascal", kpa: "pascal", mpa: "megapascal", atm: "atmosphere", inhg: "inch of mercury",
    s: "second", sec: "second", ms: "millisecond", min: "minute", h: "hour", hr: "hour",
    d: "day", yr: "year", y: "year",
    rad: "radian", deg: "degree", grad: "gradian",
};
function normalise(value) {
    return clean(value).toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ");
}
function findUnit(input) {
    const name = normalise(input);
    if (!name)
        throw new SourceError("unit name is required");
    const alias = ALIASES[name];
    const candidates = [name, alias, name.replace(/s$/, ""), ALIASES[name.replace(/s$/, "")]].filter(Boolean);
    for (const candidate of candidates) {
        for (const [category, def] of Object.entries(CATEGORIES)) {
            if (Object.prototype.hasOwnProperty.call(def.units, candidate))
                return { category, unit: candidate };
        }
    }
    throw new SourceError(`unknown unit "${clean(input)}" — use list_units to see the supported names`);
}
function temperature(value, from, to) {
    const toC = (v, unit) => (unit === "celsius" ? v : unit === "fahrenheit" ? ((v - 32) * 5) / 9 : v - 273.15);
    const fromC = (v, unit) => (unit === "celsius" ? v : unit === "fahrenheit" ? (v * 9) / 5 + 32 : v + 273.15);
    return fromC(toC(value, from), to);
}
function fmt(n) {
    if (!Number.isFinite(n))
        return "n/a";
    if (n === 0)
        return "0";
    const abs = Math.abs(n);
    if (abs >= 1e15 || abs < 1e-6)
        return n.toExponential(6).replace(/\.?0+e/, "e");
    return String(Number(n.toPrecision(10)));
}
export async function convert(a) {
    const value = Number(a.value);
    if (!Number.isFinite(value))
        throw new SourceError("value must be a finite number");
    const from = findUnit(a.from);
    const to = findUnit(a.to);
    if (from.category !== to.category) {
        throw new SourceError(`"${clean(a.from)}" is ${from.category} but "${clean(a.to)}" is ${to.category} — convert within one category`);
    }
    let result;
    if (from.category === "temperature") {
        result = temperature(value, from.unit, to.unit);
    }
    else {
        const units = CATEGORIES[from.category].units;
        result = (value * units[from.unit]) / units[to.unit];
    }
    const exactSame = from.unit === to.unit;
    return [
        `${fmt(value)} ${from.unit} = ${fmt(result)} ${to.unit}`,
        "",
        bullet("category", from.category),
        bullet("result", fmt(result)),
        bullet("full precision", String(result)),
        exactSame ? "Same unit on both sides." : "",
        "",
        "Values are shown to 10 significant digits; use full precision for exact comparisons.",
    ]
        .filter(Boolean)
        .join("\n");
}
export async function listUnits(a) {
    const wanted = a.category ? normalise(a.category) : "";
    const names = Object.keys(CATEGORIES).filter((c) => !wanted || c === wanted || c.includes(wanted));
    if (!names.length)
        throw new SourceError(`no category "${clean(a.category)}" — try: ${Object.keys(CATEGORIES).join(", ")}`);
    const lines = [`${names.length} categor${names.length === 1 ? "y" : "ies"}, base unit in brackets:`];
    for (const category of names) {
        const def = CATEGORIES[category];
        lines.push("", `${category} [${def.base}]`, `  ${Object.keys(def.units).sort().join(", ")}`);
    }
    lines.push("", "Aliases such as m, km, ft, lb, mph, kb and k also work in convert.");
    return lines.join("\n");
}
