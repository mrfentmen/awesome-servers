/**
 * Australia Post Shipping & Tracking client.
 *
 * Auth is a single `AUTH-KEY` header holding the API key from the
 * Australia Post developer portal. All endpoints are JSON.
 *
 * Note on units: weights are kilograms, dimensions are centimetres,
 * and every monetary value is in AUD.
 */
const BASE = "https://digitalapi.auspost.com.au";

export class AusPostError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AusPostError";
    this.status = status;
  }
}

function apiKey(): string {
  const key = process.env.AUSPOST_API_KEY;
  if (!key) {
    throw new AusPostError(
      "Missing AUSPOST_API_KEY. Create a free key at https://developers.auspost.com.au and set it in the environment."
    );
  }
  return key;
}

function errorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { errors?: Array<{ message?: string; code?: string }> };
    const first = parsed.errors?.[0];
    if (first?.message) return first.code ? `${first.code}: ${first.message}` : first.message;
  } catch {
    /* body was not JSON, fall through to the raw text */
  }
  const trimmed = body.trim();
  return trimmed.length > 300 ? `${trimmed.slice(0, 300)}...` : trimmed;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "AUTH-KEY": apiKey(),
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new AusPostError(`Australia Post error ${res.status} for ${path}: ${errorMessage(body)}`, res.status);
  }
  if (!body) return {} as T;
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new AusPostError(`Australia Post returned non-JSON for ${path}`);
  }
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/* ---------------------------------------------------------------- types */

export interface TrackingEvent {
  description?: string;
  date_time?: string;
  location?: string;
  status?: string;
}

export interface TrackedArticle {
  article_id?: string;
  article_status?: string;
  events?: TrackingEvent[];
}

export interface TrackingResult {
  tracking_id?: string;
  status?: string;
  articles?: TrackedArticle[];
  message?: string;
}

export interface TrackingResponse {
  tracking_results?: TrackingResult[];
  errors?: Array<{ message?: string; code?: string }>;
  [key: string]: unknown;
}

export interface Order {
  order_id?: string;
  order_status?: string;
  order_reference?: string;
  customer_reference?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface OrderList {
  orders?: Order[];
  [key: string]: unknown;
}

export interface Label {
  label_id?: string;
  label_status?: string;
  order_id?: string;
  tracking_id?: string;
  [key: string]: unknown;
}

export interface LabelList {
  labels?: Label[];
  [key: string]: unknown;
}

export interface PostageService {
  code?: string;
  name?: string;
  price?: string;
  max_extra_cover?: string;
  [key: string]: unknown;
}

export interface PostageServices {
  services?: PostageService[];
  [key: string]: unknown;
}

export interface PostageQuote {
  postage_result?: {
    service?: string;
    total_cost?: string;
    delivery_time?: string;
    costs?: Record<string, string>;
  };
  [key: string]: unknown;
}

export interface ParcelInput {
  fromPostcode: string;
  toPostcode: string;
  length: number;
  width: number;
  height: number;
  weight: number;
}

/* ----------------------------------------------------------- operations */

export function trackItems(trackingIds: string[]): Promise<TrackingResponse> {
  if (trackingIds.length === 0) throw new AusPostError("Provide at least one tracking id.");
  return request<TrackingResponse>(`/shipping/v1/track${query({ tracking_ids: trackingIds.join(",") })}`);
}

export function createOrder(payload: Record<string, unknown>): Promise<Order> {
  return request<Order>("/shipping/v1/orders", { method: "POST", body: JSON.stringify(payload) });
}

export function listOrders(params: { page?: number; perPage?: number; status?: string } = {}): Promise<OrderList> {
  return request<OrderList>(
    `/shipping/v1/orders${query({ page: params.page, per_page: params.perPage, status: params.status })}`
  );
}

export function getOrder(orderId: string): Promise<Order> {
  return request<Order>(`/shipping/v1/orders/${encodeURIComponent(orderId)}`);
}

export function getOrderSummary(orderId: string): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(`/shipping/v1/orders/${encodeURIComponent(orderId)}/summary`);
}

export function cancelOrder(orderId: string): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(`/shipping/v1/orders/${encodeURIComponent(orderId)}`, { method: "DELETE" });
}

export function createLabel(payload: Record<string, unknown>): Promise<Label> {
  return request<Label>("/shipping/v1/labels", { method: "POST", body: JSON.stringify(payload) });
}

export function listLabels(params: { page?: number; perPage?: number } = {}): Promise<LabelList> {
  return request<LabelList>(`/shipping/v1/labels${query({ page: params.page, per_page: params.perPage })}`);
}

export function getLabel(labelId: string): Promise<Label> {
  return request<Label>(`/shipping/v1/labels/${encodeURIComponent(labelId)}`);
}

export function getLabelDetails(labelId: string): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(`/shipping/v1/labels/${encodeURIComponent(labelId)}/details`);
}

export function createOrderLabels(orderId: string, payload: Record<string, unknown> = {}): Promise<Label> {
  return request<Label>(`/shipping/v1/orders/${encodeURIComponent(orderId)}/labels`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function parcelQuery(input: ParcelInput): string {
  return query({
    from_postcode: input.fromPostcode,
    to_postcode: input.toPostcode,
    length: input.length,
    width: input.width,
    height: input.height,
    weight: input.weight,
  });
}

export function listDomesticServices(input: ParcelInput): Promise<PostageServices> {
  return request<PostageServices>(`/postage/parcel/domestic/service.json${parcelQuery(input)}`);
}

export function calculateDomesticPostage(input: ParcelInput & { serviceCode: string }): Promise<PostageQuote> {
  return request<PostageQuote>(
    `/postage/parcel/domestic/calculate.json${parcelQuery(input)}${parcelQuery(input) ? "&" : "?"}service_code=${encodeURIComponent(
      input.serviceCode
    )}`
  );
}

/* ----------------------------------------------------------- formatting */

function fallback(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function formatTracking(response: TrackingResponse): string {
  const results = response.tracking_results;
  if (!results || results.length === 0) {
    return `No tracking data returned.\n${fallback(response)}`;
  }
  return results
    .map((result) => {
      const lines = [`Tracking ${result.tracking_id ?? "unknown"} — ${result.status ?? "status unknown"}`];
      for (const article of result.articles ?? []) {
        lines.push(`  Article ${article.article_id ?? "unknown"}: ${article.article_status ?? "status unknown"}`);
        for (const event of (article.events ?? []).slice(0, 10)) {
          const when = event.date_time ? `${event.date_time} ` : "";
          const where = event.location ? ` (${event.location})` : "";
          lines.push(`    - ${when}${event.description ?? event.status ?? "event"}${where}`);
        }
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

export function formatOrder(order: Order): string {
  if (!order.order_id) return fallback(order);
  return [
    `Order ${order.order_id}`,
    `Status: ${order.order_status ?? "unknown"}`,
    order.order_reference ? `Reference: ${order.order_reference}` : "",
    order.customer_reference ? `Customer ref: ${order.customer_reference}` : "",
    order.created_at ? `Created: ${order.created_at}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatOrderList(list: OrderList): string {
  const orders = list.orders ?? [];
  if (orders.length === 0) return `No orders returned.\n${fallback(list)}`;
  return [`${orders.length} order(s):`, ...orders.map((o, i) => `${i + 1}. ${o.order_id ?? "unknown"} — ${o.order_status ?? "unknown"}`)].join(
    "\n"
  );
}

export function formatLabel(label: Label): string {
  if (!label.label_id) return fallback(label);
  return [
    `Label ${label.label_id}`,
    `Status: ${label.label_status ?? "unknown"}`,
    label.order_id ? `Order: ${label.order_id}` : "",
    label.tracking_id ? `Tracking: ${label.tracking_id}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatServices(response: PostageServices): string {
  const services = response.services ?? [];
  if (services.length === 0) return `No services returned.\n${fallback(response)}`;
  return [
    `${services.length} domestic service(s):`,
    ...services.map((s) => `- ${s.code ?? "?"} ${s.name ?? ""} — $${s.price ?? "?"}`),
  ].join("\n");
}

export function formatQuote(quote: PostageQuote): string {
  const result = quote.postage_result;
  if (!result) return fallback(quote);
  const lines = [
    `Service: ${result.service ?? "unknown"}`,
    `Total: $${result.total_cost ?? "?"}`,
    result.delivery_time ? `Delivery: ${result.delivery_time}` : "",
  ].filter(Boolean);
  for (const [name, value] of Object.entries(result.costs ?? {})) {
    lines.push(`  ${name}: $${value}`);
  }
  return lines.join("\n");
}
