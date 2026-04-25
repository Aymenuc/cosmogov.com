/**
 * Z AI Web Dev SDK config (see z-ai-web-dev-sdk / `.z-ai-config` JSON).
 * When `Z_AI_BASE_URL` + `Z_AI_API_KEY` are set (e.g. on Vercel), env wins over disk.
 */
type ZAIBaseConfig = {
  baseUrl: string;
  apiKey: string;
  chatId?: string;
  userId?: string;
  token?: string;
};

function getConfigFromEnv(): ZAIBaseConfig | null {
  const baseUrl = process.env.Z_AI_BASE_URL?.trim();
  const apiKey = process.env.Z_AI_API_KEY?.trim();
  if (baseUrl && apiKey) {
    return {
      baseUrl,
      apiKey,
      chatId: process.env.Z_AI_CHAT_ID?.trim(),
      userId: process.env.Z_AI_USER_ID?.trim(),
      token: process.env.Z_AI_TOKEN?.trim(),
    };
  }
  return null;
}

/**
 * Returns a Z AI client. Uses `Z_AI_*` env vars if set; otherwise `ZAI.create()` and
 * project/home `/etc` `.z-ai-config` (see `agent-ctx/ai-api-configuration.md`).
 */
export async function createZAI() {
  const fromEnv = getConfigFromEnv();
  const { default: ZAI } = await import('z-ai-web-dev-sdk');
  if (fromEnv) {
    // SDK types mark constructor private; at runtime the class accepts config like `ZAI.create()`.
    return new (ZAI as unknown as new (c: ZAIBaseConfig) => InstanceType<typeof ZAI>)(fromEnv);
  }
  return ZAI.create();
}
