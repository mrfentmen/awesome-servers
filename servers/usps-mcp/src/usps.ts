const USPS_API_BASE = process.env.USPS_API_URL || "https://api.usps.com"

function getAuth(): Record<string, string> {
  const apiKey = process.env.USPS_API_KEY
  if (apiKey) return { Authorization: `Bearer ${apiKey}` }
  return {}
}

async function uspsFetch(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${USPS_API_BASE}${path}`, {
    ...init,
    headers: { ...getAuth(), "Content-Type": "application/json", ...(init?.headers || {}) },
  })
  if (!res.ok) throw new Error(`USPS API error: ${res.status}`)
  return res.json()
}

export async function getRate(data: {
  destination: string
  weight: number
  service?: string
}): Promise<any> {
  return uspsFetch("/shipping/rates/v3", {
    method: "POST",
    body: JSON.stringify({
      destination: { address: { postalCode: data.destination } },
      package: { weight: { value: data.weight, unit: "LB" } },
      service: data.service || "PRIORITY",
    }),
  })
}

export async function createLabel(data: {
  from: { street: string; city: string; state: string; zip: string }
  to: { street: string; city: string; state: string; zip: string }
  weight: number
  service?: string
}): Promise<any> {
  return uspsFetch("/shipping/labels/v3", {
    method: "POST",
    body: JSON.stringify({
      from: data.from,
      to: data.to,
      package: { weight: { value: data.weight, unit: "LB" } },
      service: data.service || "PRIORITY",
    }),
  })
}

export async function trackPackage(trackingNumber: string): Promise<any> {
  return uspsFetch(`/tracking/v3/${encodeURIComponent(trackingNumber)}`)
}

export async function validateAddress(address: {
  street: string
  city: string
  state: string
  zip: string
}): Promise<any> {
  return uspsFetch("/addresses/v3/validate", {
    method: "POST",
    body: JSON.stringify(address),
  })
}

export async function getZipCode(address: {
  city: string
  state: string
}): Promise<any> {
  return uspsFetch(`/zipcodes/v3?city=${encodeURIComponent(address.city)}&state=${encodeURIComponent(address.state)}`)
}

export async function getAddressInfo(zip: string): Promise<any> {
  return uspsFetch(`/zipcodes/v3/${encodeURIComponent(zip)}`)
}

export async function schedulePickup(data: {
  address: { street: string; city: string; state: string; zip: string }
  packageCount: number
}): Promise<any> {
  return uspsFetch("/pickup/v3/request", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getServiceStandards(
  originZip: string,
  destZip: string,
): Promise<any> {
  return uspsFetch(`/servicestandards/v3/${originZip}/${destZip}`)
}
