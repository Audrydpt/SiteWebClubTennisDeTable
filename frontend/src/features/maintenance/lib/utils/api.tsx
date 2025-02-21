import { Item } from './types';

const BASE_URL = process.env.BACK_API_URL;
const { MAIN_API_URL } = process.env;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export const getAuthHeader = (sessionId: string) => ({
  Authorization: `X-Session-Id ${sessionId}`,
});

export async function fetchApi<T>(
  endpoint: string,
  sessionId: string,
  options?: RequestInit & { responseType?: 'json' | 'text' }
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options?.headers,
        ...getAuthHeader(sessionId),
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data =
      options?.responseType === 'text'
        ? ((await response.text()) as unknown as T)
        : await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Shared API calls
export const apiService = {
  async getStreams(sessionId: string): Promise<ApiResponse<Item[]>> {
    return fetchApi<Item[]>('/streams', sessionId);
  },

  async getSourceLog(
    sourceId: string,
    sessionId: string
  ): Promise<ApiResponse<string>> {
    return fetchApi<string>(`/sourceLog/${sourceId}`, sessionId, {
      responseType: 'text',
    });
  },

  async getSnapshot(source: string, sessionId: string): Promise<Response> {
    return fetch(`${BASE_URL}/snapshot/${source}?width=32&height=32`, {
      headers: getAuthHeader(sessionId),
    });
  },

  async checkAIHealth(sessionId: string): Promise<Response> {
    return fetch(`${MAIN_API_URL}/health/aiServer/192.168.20.145`, {
      headers: getAuthHeader(sessionId),
    });
  },

  async checkSecondarySeverHealth(sessionId: string): Promise<Response> {
    return fetch(`${MAIN_API_URL}/health/secondaryServer/192.145.20.145`, {
      headers: getAuthHeader(sessionId),
    });
  },
};
