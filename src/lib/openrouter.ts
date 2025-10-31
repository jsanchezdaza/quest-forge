import type { GameSession, Scene, CharacterClass } from '../types'

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3.1:free'
const OPENROUTER_BASE_URL = import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
const DEFAULT_TIMEOUT = 10000
const MAX_RETRIES = 3

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  timeout = DEFAULT_TIMEOUT
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < retries; i++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
      return await Promise.race([fn(), timeoutPromise])
    } catch (error) {
      lastError = error as Error
      console.warn(`Attempt ${i + 1}/${retries} failed:`, error)

      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
  }

  throw lastError || new Error('All retry attempts failed')
}
export async function streamFromOpenRouter(
  messages: OpenRouterMessage[],
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  if (!OPENROUTER_API_KEY) {
    onError(new Error('OpenRouter API key not configured'))
    return
  }

  try {
    await retryWithTimeout(async () => {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Quest Forge'
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          stream: true,
          temperature: 0.8,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body from OpenRouter')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          onComplete()
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              onComplete()
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content

              if (content) {
                onChunk(content)
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', e)
            }
          }
        }
      }
    })
  } catch (error) {
    onError(error as Error)
  }
}

function buildNarrativeContext(
  session: GameSession,
  previousChoice?: string,
  sceneHistory?: Scene[]
): string {
  const { character_name, character_class, game_state } = session
  const { level, health, maxHealth, stats, inventory } = game_state

  const parts = [
    `Character: ${character_name}, a level ${level} ${character_class}`,
    `Health: ${health}/${maxHealth}`,
    `Stats: STR ${stats.strength}, DEX ${stats.dexterity}, INT ${stats.intelligence}, WIS ${stats.wisdom}, CON ${stats.constitution}, CHA ${stats.charisma}`
  ]

  if (inventory.length > 0) {
    parts.push(`Inventory: ${inventory.join(', ')}`)
  }

  if (previousChoice) {
    parts.push(`\nPrevious action: ${previousChoice}`)
  }

  if (sceneHistory?.length) {
    const recentScenes = sceneHistory.slice(-3)
    parts.push('\nRecent story:')
    recentScenes.forEach((scene, idx) => {
      parts.push(`${idx + 1}. ${scene.narrative.slice(0, 100)}...`)
      if (scene.player_choice) {
        parts.push(`   → Player chose: ${scene.player_choice}`)
      }
    })
  }

  return parts.join('\n')
}

export async function generateSceneNarrativeWithAI(
  session: GameSession,
  choice: string,
  sceneHistory: Scene[],
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  const context = buildNarrativeContext(session, choice, sceneHistory)

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `You are a creative fantasy game narrator for Quest Forge, a text-based RPG.
Generate immersive, descriptive narrative text (2-3 paragraphs) based on the player's choice.
Style: Medieval fantasy, descriptive, engaging, second-person perspective.
Keep it concise but vivid. Include sensory details and consequences of the player's action.`
    },
    {
      role: 'user',
      content: `${context}\n\nNarrate what happens after the player chooses: "${choice}"`
    }
  ]

  await streamFromOpenRouter(messages, onChunk, onComplete, onError)
}

export async function generatePlayerChoicesWithAI(
  session: GameSession,
  currentNarrative: string,
  sceneHistory: Scene[],
  onComplete: (choices: string[]) => void,
  onError: (error: Error) => void
): Promise<void> {
  const context = buildNarrativeContext(session, undefined, sceneHistory)
  let accumulatedText = ''

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `You are a creative fantasy game narrator for Quest Forge.
Generate exactly 3-4 contextual player choices based on the current narrative.
Each choice should be a short action statement (5-10 words).
Format: Return ONLY the choices, one per line, no numbers or bullet points.
Make choices diverse: combat, exploration, social, or clever solutions.`
    },
    {
      role: 'user',
      content: `${context}\n\nCurrent scene: ${currentNarrative}\n\nGenerate 3-4 possible actions the player can take:`
    }
  ]

  await streamFromOpenRouter(
    messages,
    (chunk) => { accumulatedText += chunk },
    () => {
      const choices = accumulatedText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.length < 100)
        .slice(0, 4)

      choices.length >= 3
        ? onComplete(choices)
        : onError(new Error('Failed to generate enough choices'))
    },
    onError
  )
}

export async function generateBackstoryWithAI(
  characterName: string,
  characterClass: CharacterClass,
  stats: GameSession['game_state']['stats'],
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `You are a creative fantasy writer for Quest Forge.
Generate a compelling character backstory (1-2 paragraphs) for a new adventurer.
Style: Medieval fantasy, personal, hints at motivations and past experiences.
Keep it concise but evocative.`
    },
    {
      role: 'user',
      content: `Create a backstory for:
Name: ${characterName}
Class: ${characterClass}
Stats: STR ${stats.strength}, DEX ${stats.dexterity}, INT ${stats.intelligence}, WIS ${stats.wisdom}, CON ${stats.constitution}, CHA ${stats.charisma}

Write a brief backstory explaining who they are and why they became a ${characterClass}.`
    }
  ]

  await streamFromOpenRouter(messages, onChunk, onComplete, onError)
}

export function isOpenRouterConfigured(): boolean {
  return OPENROUTER_API_KEY.length > 0
}
