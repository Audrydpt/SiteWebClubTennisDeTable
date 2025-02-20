import { Item } from './types';

const BASE_URL = process.env.BACK_API_URL;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Authentication helper that accepts the sessionId as a parameter
export const getAuthHeader = (sessionId: string) => ({
  Authorization: `X-Session-Id ${sessionId}`,
});

// Generic fetch function that also accepts the sessionId parameter
async function fetchApi<T>(
  endpoint: string,
  sessionId: string,
  options?: RequestInit
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

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Specific API endpoints updated to receive the sessionId
export async function getStreams(sessionId: string) {
  return fetchApi<Item[]>('/streams', sessionId);
}

export async function getSourceLog(sourceId: string, sessionId: string) {
  return fetchApi<string>(`/sourceLog/${sourceId}`, sessionId);
}
