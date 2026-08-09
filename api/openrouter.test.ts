import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createOpenRouterHandler } from './openrouter.ts'

type JsonBody = Record<string, unknown>

class MockResponse {
  statusCode = 200
  headers = new Map<string, string>()
  body = ''
  jsonBody: JsonBody | null = null

  status(code: number) {
    this.statusCode = code
    return this
  }

  json(value: JsonBody) {
    this.jsonBody = value
    return this
  }

  setHeader(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value)
    return this
  }

  write(chunk: Uint8Array | string) {
    this.body += typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk)
    return true
  }

  end() {
    return this
  }
}

const request = (overrides: Partial<VercelRequest> = {}): VercelRequest => ({
  method: 'POST',
  headers: { authorization: 'Bearer user-token' },
  body: { messages: [{ role: 'user', content: 'Tell a short story' }] },
  ...overrides,
} as VercelRequest)

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'supabase-anon-key',
  OPENROUTER_API_KEY: 'server-only-key',
  OPENROUTER_MODEL: 'test/model',
}

test('rejects unauthenticated requests before contacting an upstream service', async () => {
  let calls = 0
  const handler = createOpenRouterHandler({
    env,
    fetch: async () => {
      calls += 1
      throw new Error('unexpected fetch')
    },
  })
  const res = new MockResponse()

  await handler(request({ headers: {} }), res as unknown as VercelResponse)

  assert.equal(res.statusCode, 401)
  assert.equal(calls, 0)
})

test('rejects malformed prompt payloads after authenticating the user', async () => {
  const calls: string[] = []
  const handler = createOpenRouterHandler({
    env,
    fetch: async (input) => {
      calls.push(String(input))
      return new Response(JSON.stringify({ id: 'user-id' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    },
  })
  const res = new MockResponse()

  await handler(
    request({ body: { messages: [{ role: 'owner', content: 'invalid role' }] } }),
    res as unknown as VercelResponse,
  )

  assert.equal(res.statusCode, 400)
  assert.equal(calls.length, 1)
})

test('authenticates the user and streams OpenRouter through the server-only key', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const handler = createOpenRouterHandler({
    env,
    fetch: async (input, init) => {
      calls.push({ url: String(input), init })
      if (calls.length === 1) {
        return new Response(JSON.stringify({ id: 'user-id' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    },
  })
  const res = new MockResponse()

  await handler(request(), res as unknown as VercelResponse)

  assert.equal(res.statusCode, 200)
  assert.equal(calls[0]?.url, 'https://project.supabase.co/auth/v1/user')
  assert.equal(new Headers(calls[0]?.init?.headers).get('authorization'), 'Bearer user-token')
  assert.equal(calls[1]?.url, 'https://openrouter.ai/api/v1/chat/completions')
  assert.equal(new Headers(calls[1]?.init?.headers).get('authorization'), 'Bearer server-only-key')
  assert.match(res.body, /Hello/)
  assert.match(res.body, /\[DONE\]/)
})

test('fails closed when server-side credentials are missing', async () => {
  let calls = 0
  const handler = createOpenRouterHandler({
    env: { ...env, OPENROUTER_API_KEY: '' },
    fetch: async () => {
      calls += 1
      throw new Error('unexpected fetch')
    },
  })
  const res = new MockResponse()

  await handler(request(), res as unknown as VercelResponse)

  assert.equal(res.statusCode, 503)
  assert.equal(calls, 0)
})

test('the browser client uses the authenticated proxy and contains no OpenRouter credential', async () => {
  const client = await readFile(new URL('../src/lib/openrouter.ts', import.meta.url), 'utf8')
  const exampleEnv = await readFile(new URL('../.env.example', import.meta.url), 'utf8')

  assert.match(client, /supabase\.auth\.getSession/)
  assert.match(client, /fetch\(['"]\/api\/openrouter['"]/)
  assert.doesNotMatch(client, /VITE_OPENROUTER_(API_KEY|MODEL|BASE_URL)/)
  assert.doesNotMatch(exampleEnv, /VITE_OPENROUTER_API_KEY/)
  assert.match(exampleEnv, /^OPENROUTER_API_KEY=/m)
})
