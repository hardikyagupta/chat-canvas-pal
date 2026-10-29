import { variableTokenRe } from "./smsTemplates.data";
import { CONTENT_FETCHES, PAYLOAD_EVENTS } from "./smsVariables.data";

/** Primary keys offered under "Recently used" in the preview-user field. */
export const RECENT_PREVIEW_USERS = [
  "john.doe@gmail.com",
  "priya.sharma@gmail.com",
  "aarav.mehta@bloomwood.com",
  "neha.kapoor@gmail.com",
];

type Row = Record<string, string>;

export interface PreviewContext {
  user: Row;
  payload: Row;
  content_fetch: Record<string, Row>;
}

/** Stable 32-bit hash, so the same key always generates the same person. */
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

const pick = <T,>(list: T[], seed: number, salt = 0): T => list[(seed + salt * 7919) % list.length];

const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur"];
/** Keys whose city is fixed, so a demo with a known id always reads the same. */
const KNOWN_CITY: Record<string, string> = {
  "john.doe@gmail.com": "Mumbai",
  "priya.sharma@gmail.com": "Bengaluru",
  "aarav.mehta@bloomwood.com": "Delhi",
  "neha.kapoor@gmail.com": "Pune",
};
const PRODUCTS = ["Amber Glow Candle", "Cedar Diffuser", "Linen Throw", "Ceramic Planter", "Oud Room Spray"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

function dateFrom(seed: number, salt: number): string {
  const day = 1 + ((seed >> salt) % 28);
  return `${day} ${MONTHS[(seed >> (salt + 3)) % 12]}`;
}

/** A believable profile for any primary key — name from the id, the rest seeded by it. */
export function profileFor(key: string): Row {
  const id = key.trim().toLowerCase();
  const seed = hash(id);
  const words = id.split("@")[0].split(/[._\-\d]+/).filter(Boolean);
  const first = titleCase(words[0] ?? "Customer");
  const last = words[1] ? titleCase(words[1]) : "";
  const orders = 2 + (seed % 23);
  return {
    email: id,
    first_name: first,
    last_name: last,
    name: [first, last].filter(Boolean).join(" "),
    phone_number: `+91 9${String(seed).padStart(9, "0").slice(-9)}`,
    city: KNOWN_CITY[id] ?? pick(CITIES, seed),
    country: "India",
    lifetime_orders: String(orders),
    lifetime_revenue: `Rs.${(orders * (900 + (seed % 1400))).toLocaleString("en-IN")}`,
    last_purchase_date: dateFrom(seed, 2),
    signup_date: `${dateFrom(seed, 5)} 2025`,
  };
}

/** Value for a payload / content-fetch field, chosen from what its name suggests. */
function valueFor(field: string, seed: number): string {
  const f = field.toLowerCase();
  if (/url|link/.test(f)) return `https://bwd.co/${(seed % 46656).toString(36).padStart(3, "0")}k`;
  if (/date|eta|expiry/.test(f)) return dateFrom(seed, 1);
  if (/value|amount|price|revenue|balance/.test(f)) return `Rs.${(499 + (seed % 4500)).toLocaleString("en-IN")}`;
  if (/count|orders|points/.test(f)) return String(1 + (seed % 12));
  if (/mode/.test(f)) return pick(["UPI", "Credit card", "Net banking"], seed);
  if (/status/.test(f)) return pick(["Confirmed", "Shipped", "Out for delivery"], seed);
  if (/tier/.test(f)) return pick(["Silver", "Gold", "Platinum"], seed);
  if (/code/.test(f)) return `BLOOM${10 + (seed % 40)}`;
  if (/id/.test(f)) return `BW${100000 + (seed % 900000)}`;
  if (/name|product/.test(f)) return pick(PRODUCTS, seed);
  return titleCase(pick(["sample", "example", "demo"], seed));
}

/** Everything a template can pull from for one user, optionally with one activity's payload loaded. */
export function previewContext(userKey: string, activityKey: string): PreviewContext {
  const seed = hash(userKey.trim().toLowerCase());
  const event = PAYLOAD_EVENTS.find((e) => e.key === activityKey);
  return {
    user: profileFor(userKey),
    payload: Object.fromEntries((event?.fields ?? []).map((f) => [f.key, valueFor(f.key, seed + hash(f.key))])),
    content_fetch: Object.fromEntries(
      CONTENT_FETCHES.map((g) => [g.key, Object.fromEntries(g.fields.map((f) => [f.key, valueFor(f.key, seed + hash(g.key + f.key))]))])
    ),
  };
}

const unquote = (s: string) => s.trim().replace(/^(["'])(.*)\1$/, "$2");

function applyFilter(value: string, filter: string): string {
  const [name, ...rest] = filter.split(":");
  const arg = unquote(rest.join(":"));
  switch (name.trim()) {
    case "upcase":
      return value.toUpperCase();
    case "downcase":
      return value.toLowerCase();
    case "capitalize":
      return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;
    case "strip":
      return value.trim();
    case "url_encode":
      return encodeURIComponent(value);
    case "truncate": {
      const n = Number(arg) || 50;
      return value.length > n ? `${value.slice(0, Math.max(0, n - 3))}...` : value;
    }
    default:
      return value;
  }
}

/** Fills every `{{ path | filter }}` in a mapping from the context; anything unknown falls back to its default or nothing. */
export function renderLiquid(expression: string, ctx: PreviewContext): string {
  return expression.replace(/\{\{\s*([^}]*?)\s*\}\}/g, (_, inner: string) => {
    const [path, ...filters] = inner.split("|").map((p) => p.trim());
    const [root, ...keys] = path.split(".");
    let value: unknown = (ctx as unknown as Record<string, unknown>)[root];
    for (const k of keys) value = (value as Record<string, unknown> | undefined)?.[k];
    let out = typeof value === "string" ? value : "";
    for (const f of filters) {
      if (f.startsWith("default")) {
        if (!out) out = unquote(f.split(":").slice(1).join(":"));
      } else {
        out = applyFilter(out, f);
      }
    }
    return out;
  });
}

/** The message as the chosen user would receive it: each variable replaced by its rendered mapping. */
export function renderBody(body: string, mappings: Record<string, string>, ctx: PreviewContext): string {
  let tagOrdinal = 0;
  return body.replace(variableTokenRe(), (token, n: string | undefined) => {
    const key = n !== undefined ? n : `#${++tagOrdinal}`;
    const mapping = mappings[key]?.trim();
    return (mapping && renderLiquid(mapping, ctx)) || token;
  });
}
