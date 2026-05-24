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

export type DriverMetrics = Driver & {
  total_orders: number
  current_order_count: number
  exception_count: number
  tardy_count: number
  exception_rate: number
  tardiness_rate: number
  unacceptable_metrics: boolean
  status: string
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
  severity: 'severity one' | 'severity two' | 'severity three'
  status: string
}

export type DailyReport = {
  id: string
  report_date: string
  location: string
  weather: {
    current?: {
      temperature_2m?: number
      precipitation?: number
      wind_speed_10m?: number
      wind_gusts_10m?: number
    }
  }
  traffic: {
    available?: boolean
    provider?: string
    message?: string
    incidents?: unknown[]
  }
  summary: string
  generated_at: string
}

type GetOrdersOptions = {
  beforeTime?: string
  clientAccountId?: string
  fromTime?: string
  limit?: number
  offset?: number
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

export function getDriverMetrics() {
  return getJson<DriverMetrics[]>('/api/drivers/metrics')
}

export function getDailyReport() {
  return getJson<DailyReport>('/api/daily-report')
}

export function getOrders(options: GetOrdersOptions = {}) {
  const params = new URLSearchParams()

  if (options.clientAccountId) {
    params.set('client_account_id', options.clientAccountId)
  }
  if (options.fromTime) {
    params.set('from_time', options.fromTime)
  }
  if (options.beforeTime) {
    params.set('before_time', options.beforeTime)
  }
  if (options.limit) {
    params.set('limit', String(options.limit))
  }
  if (options.offset) {
    params.set('offset', String(options.offset))
  }

  const query = params.toString()
  return getJson<ApiOrder[]>(`/api/orders${query ? `?${query}` : ''}`)
}
