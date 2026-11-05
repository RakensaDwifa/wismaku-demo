// ponytail: allowlist origin statis + regex preview vercel; tambahkan domain kustom via env ALLOWED_ORIGIN.
const DEFAULT_ALLOWED = [
  'https://wismaku-demo.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

const VERCEL_PREVIEW_RE = /^https:\/\/wismaku-demo(-[a-z0-9-]+)?\.vercel\.app$/i

export const resolveCorsOrigin = (req: Request): string => {
  const origin = (req.headers.get('Origin') ?? '').trim()
  if (!origin) return DEFAULT_ALLOWED[0]

  const customAllowed = (Deno.env.get('ALLOWED_ORIGIN') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  if (DEFAULT_ALLOWED.includes(origin) || customAllowed.includes(origin) || VERCEL_PREVIEW_RE.test(origin)) {
    return origin
  }
  return DEFAULT_ALLOWED[0]
}

export const getCorsHeaders = (req: Request): Record<string, string> => ({
  'Access-Control-Allow-Origin': resolveCorsOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
})

export const handleCorsOptions = (req: Request): Response =>
  new Response('ok', { headers: getCorsHeaders(req) })

export const jsonResponse = (req: Request, body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
      'Content-Type': 'application/json',
    },
  })
