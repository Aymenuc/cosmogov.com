import { createZAI } from '@/lib/z-ai-client';

const NVIDIA_URL_HINTS = /nvidia\.com|integrate\.api\.nvidia/i;

/**
 * When true, uses plain `fetch` to `{Z_AI_BASE_URL}/chat/completions` (OpenAI shape).
 * Use for NVIDIA NIM (e.g. `https://integrate.api.nvidia.com/v1`); the z-ai SDK adds
 * request fields some vendors do not accept.
 */
export function useNvidiaOpenAICompat(): boolean {
  if (process.env.Z_AI_USE_OPENAI_COMPAT === '1') return true;
  const base = process.env.Z_AI_BASE_URL?.trim() ?? '';
  return NVIDIA_URL_HINTS.test(base);
}

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

type CompletionResponse = {
  choices: Array<{
    message: { content: string | null };
  }>;
};

/**
 * OpenAI-style chat completion. Routes to NVIDIA-compatible HTTP when
 * `Z_AI_BASE_URL` is an NVIDIA integrate URL (or `Z_AI_USE_OPENAI_COMPAT=1`);
 * otherwise uses `z-ai-web-dev-sdk` via `createZAI()`.
 */
export async function chatCompletionsCreate(options: {
  messages: ChatMsg[];
  temperature?: number;
  max_tokens?: number;
}): Promise<CompletionResponse> {
  const { messages, temperature, max_tokens } = options;
  const model = process.env.Z_AI_MODEL?.trim() || 'deepseek-ai/deepseek-v4-pro';

  if (useNvidiaOpenAICompat()) {
    const baseUrl = (process.env.Z_AI_BASE_URL ?? '').replace(/\/$/, '');
    const apiKey = process.env.Z_AI_API_KEY?.trim();
    if (!baseUrl || !apiKey) {
      throw new Error('NVIDIA / OpenAI-compat mode requires Z_AI_BASE_URL and Z_AI_API_KEY in the environment');
    }
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: temperature ?? 1,
      top_p: 0.95,
      max_tokens: max_tokens ?? 4096,
      stream: false,
    };
    if (process.env.Z_AI_SKIP_CHAT_TEMPLATE_KWARGS !== '1') {
      body.chat_template_kwargs = { thinking: false };
    }
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Chat API ${res.status}: ${t.slice(0, 800)}`);
    }
    return (await res.json()) as CompletionResponse;
  }

  const zai = await createZAI();
  const payload: Record<string, unknown> = { messages, temperature, max_tokens };
  if (process.env.Z_AI_MODEL?.trim()) {
    payload.model = process.env.Z_AI_MODEL.trim();
  }
  return (await zai.chat.completions.create(payload as never)) as CompletionResponse;
}
