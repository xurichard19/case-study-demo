const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export type ClientAccount = {
  id: string
  name: string
  contact_email: string | null
}

export type Driver = {
  id: string
  display_name: string | null
  active: boolean
}

export type ApiOrder = {
  id: string
  client_account_id: string
  client_name: string
  order_time: string | null
  pickup_zip: string | null
  delivery_zip: string | null
  service_type: string | null
  driver_id: string | null
  dispatch_time: string | null
  pickup_time: string | null
  delivery_time: string | null
  promised_eta: string | null
  on_time: boolean | null
  exception_notes: string | null
  driver_idle_min: number | null
  fuel_cost_usd: string | null
  redelivery_flag: boolean
  status: string
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function getClients() {
  return getJson<ClientAccount[]>('/api/clients')
}

export function getDrivers() {
  return getJson<Driver[]>('/api/drivers')
}

export function getOrders(clientAccountId?: string) {
  const params = clientAccountId ? `?client_account_id=${encodeURIComponent(clientAccountId)}` : ''
  return getJson<ApiOrder[]>(`/api/orders${params}`)
}
