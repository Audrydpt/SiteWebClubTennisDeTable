import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-context.tsx';

interface ApiVersion {
  major: number;
  minor: number;
  revision: number;
}

interface ProductVersion {
  name: string;
  version: string;
}

async function fetchVersion(sessionId: string) {
  const response = await fetch(`${process.env.BACK_API_URL}/version`, {
    headers: {
      Authorization: `X-Session-Id ${sessionId}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch version');
  }
  const data: ApiVersion = await response.json();
  return `v${data.major}.${data.minor}.${data.revision}`;
}

async function fetchProductVersion(sessionId: string) {
  const response = await fetch(`${process.env.BACK_API_URL}/productVersion`, {
    headers: {
      Authorization: `X-Session-Id ${sessionId}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch product version');
  }
  const data: ProductVersion = await response.json();
  return `v${data.version}`;
}

export default function useOverview() {
  const { sessionId } = useAuth();

  const versionQuery = useQuery({
    queryKey: ['version', sessionId],
    queryFn: () => fetchVersion(sessionId ?? ''),
    enabled: !!sessionId,
  });

  const productVersionQuery = useQuery({
    queryKey: ['productVersion', sessionId],
    queryFn: () => fetchProductVersion(sessionId ?? ''),
    enabled: !!sessionId,
  });

  const isLoading = versionQuery.isLoading || productVersionQuery.isLoading;
  const error = versionQuery.error || productVersionQuery.error;

  return {
    version: versionQuery.data ?? '',
    productVersion: productVersionQuery.data ?? '',
    isLoading,
    error: error ? error.message : null,
  };
}
