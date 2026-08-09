import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEFAULT_MODEL = 'google/gemma-4-26b-a4b-it:free'
const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'
const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 4_000
const MAX_TOTAL_LENGTH = 12_000

type Environment = Record<string, string | undefined>
type Fetch = typeof fetch

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface HandlerDependencies {
  env?: Environment
  fetch?: Fetch
}

function bearerToken(header: string | string[] | undefined): string | null {
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token || null
}

function parseMessages(body: unknown): OpenRouterMessage[] | null {
  let value = body
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }

  if (!value || typeof value !== 'object' || !('messages' in value)) return null
  const messages = (value as { messages?: unknown }).messages
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null

  let totalLength = 0
  const valid = messages.every((message) => {
    if (!message || typeof message !== 'object') return false
    const { role, content } = message as { role?: unknown; content?: unknown }
    if (!['system', 'user', 'assistant'].includes(String(role))) return false
    if (typeof content !== 'string' || content.length === 0 || content.length > MAX_MESSAGE_LENGTH) {
      return false
    }
    totalLength += content.length
    return totalLength <= MAX_TOTAL_LENGTH
  })

  return valid ? messages as OpenRouterMessage[] : null
}

export function createOpenRouterHandler(dependencies: HandlerDependencies = {}) {
  const env = dependencies.env ?? process.env
  const fetchImpl = dependencies.fetch ?? fetch

  return async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const supabaseUrl = env.SUPABASE_URL
    const supabaseAnonKey = env.SUPABASE_ANON_KEY
    const openRouterApiKey = env.OPENROUTER_API_KEY
    if (!supabaseUrl || !supabaseAnonKey || !openRouterApiKey) {
      res.status(503).json({ error: 'AI narrative is not configured' })
      return
    }

    const token = bearerToken(req.headers.authorization)
    if (!token) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    try {
      const authResponse = await fetchImpl(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
        headers: {
          apikey: supabaseAnonKey,
          authorization: `Bearer ${token}`,
        },
      })
      if (!authResponse.ok) {
        res.status(401).json({ error: 'Invalid authentication token' })
        return
      }

      const messages = parseMessages(req.body)
      if (!messages) {
        res.status(400).json({ error: 'Invalid messages payload' })
        return
      }

      const upstream = await fetchImpl(
        `${(env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')}/chat/completions`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${openRouterApiKey}`,
            'content-type': 'application/json',
            'x-title': 'Quest Forge',
          },
          body: JSON.stringify({
            model: env.OPENROUTER_MODEL || DEFAULT_MODEL,
            messages,
            stream: true,
            temperature: 0.8,
            max_tokens: 500,
          }),
        },
      )

      if (!upstream.ok || !upstream.body) {
        res.status(upstream.ok ? 502 : upstream.status).json({ error: 'AI provider request failed' })
        return
      }

      res.status(200)
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('X-Content-Type-Options', 'nosniff')

      const reader = upstream.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
      res.end()
    } catch (error) {
      console.error('OpenRouter proxy error:', error)
      if (!res.headersSent) {
        res.status(502).json({ error: 'AI provider is unavailable' })
      } else {
        res.end()
      }
    }
  }
}

export default createOpenRouterHandler()
