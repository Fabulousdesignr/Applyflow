// Shared Gemini API client — retries, backoff, and model fallbacks for 503/429 spikes

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
];

const RETRYABLE_STATUS = new Set([429, 500, 503, 529]);
const MAX_ATTEMPTS_PER_MODEL = 3;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseErrorSnippet(errText) {
  try {
    const parsed = JSON.parse(errText);
    return parsed?.error?.message || errText.slice(0, 200);
  } catch {
    return errText.slice(0, 200);
  }
}

/**
 * Call Gemini generateContent with retries and model fallbacks.
 * @returns {Promise<{ data: object, model: string }>}
 */
export async function callGeminiGenerateContent(apiKey, body, options = {}) {
  const key = apiKey?.trim();
  if (!key) {
    throw new Error('Gemini API key is not configured.');
  }

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: options.signal,
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          return { data, model };
        }

        const errText = await response.text();
        const snippet = parseErrorSnippet(errText);
        lastError = new Error(`Gemini API error (${response.status}): ${snippet}`);

        if (RETRYABLE_STATUS.has(response.status)) {
          if (attempt < MAX_ATTEMPTS_PER_MODEL - 1) {
            await delay(1500 * 2 ** attempt);
            continue;
          }
          break;
        }

        throw lastError;
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        lastError = err;
        if (attempt < MAX_ATTEMPTS_PER_MODEL - 1) {
          await delay(1500 * 2 ** attempt);
          continue;
        }
        break;
      }
    }
  }

  if (lastError?.message?.includes('503') || lastError?.message?.includes('UNAVAILABLE')) {
    throw new Error(
      'Gemini is temporarily overloaded (high demand). Wait a minute and try again — we already retried with alternate models.'
    );
  }

  throw lastError || new Error('Gemini request failed. Please try again later.');
}

export function extractGeminiText(data) {
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
    ''
  );
}
