const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Request gagal: ${res.status} ${res.statusText}`)
  }
  return res.status === 204 ? null : res.json()
}
