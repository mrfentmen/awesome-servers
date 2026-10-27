export class StripeError extends Error {
    constructor(message) {
        super(message);
        this.name = "StripeError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function headers() {
    const k = process.env.STRIPE_SECRET_KEY;
    if (!k)
        throw new StripeError("Set STRIPE_SECRET_KEY (Stripe test-mode key).");
    return { ...UA, Accept: "application/json", Authorization: `Basic ${Buffer.from(`${k}:`).toString("base64")}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch("https://api.stripe.com/v1" + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new StripeError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new StripeError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function listCharges(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/charges?limit=${n}`);
}
export function listCustomers(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/customers?limit=${n}`);
}
export function getBalance() {
    return get("/balance");
}
export function listInvoices(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/invoices?limit=${n}`);
}
export function listSubscriptions(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/subscriptions?limit=${n}`);
}
export function listProducts(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/products?limit=${n}`);
}
export function listPrices(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/prices?limit=${n}`);
}
export function listRefunds(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/refunds?limit=${n}`);
}
export function listDisputes(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/disputes?limit=${n}`);
}
export function listCoupons(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/coupons?limit=${n}`);
}
