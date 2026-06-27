// Shared Tavily Web Search API client

const TAVILY_API_URL = 'https://api.tavily.com/search';

/**
 * Perform a web search using Tavily search endpoint.
 * @param {string} apiKey Tavily API key
 * @param {object} params Tavily request body parameters
 * @returns {Promise<{ results: Array<{ title: string, url: string, content: string, score: number }> }>}
 */
export async function callTavilySearch(apiKey, params) {
  const key = apiKey?.trim();
  if (!key) {
    throw new Error('Tavily API key is not configured.');
  }

  const body = {
    api_key: key, // Tavily accepts api_key inside JSON request body
    search_depth: params.search_depth || 'basic',
    max_results: params.max_results || 15,
    include_raw_content: false,
    include_answer: false,
    ...params,
  };

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = errText;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed?.detail || parsed?.error?.message || errText;
      } catch {
        // ignore
      }
      throw new Error(`Tavily API error (${response.status}): ${msg}`);
    }

    const data = await response.json();
    return {
      results: Array.isArray(data.results) ? data.results : [],
    };
  } catch (err) {
    console.error('[Applyflow] Tavily search error:', err);
    throw err;
  }
}
