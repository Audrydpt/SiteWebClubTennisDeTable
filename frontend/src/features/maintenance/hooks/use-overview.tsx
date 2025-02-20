import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context.tsx';

interface Version {
  major: number;
  minor: number;
  revision: number;
}

interface ProductVersion {
  name: string;
  version: string;
}

interface OverviewState {
  version: string;
  productVersion: string;
  isLoading: boolean;
  error: string | null;
}

export default function useOverview() {
  const [state, setState] = useState<OverviewState>({
    version: '',
    productVersion: '',
    isLoading: true,
    error: null,
  });
  const { sessionId } = useAuth();

  useEffect(() => {
    async function fetchVersions() {
      try {
        const [versionResponse, productVersionResponse] = await Promise.all([
          fetch(`${process.env.BACK_API_URL}/version`, {
            headers: {
              Authorization: `X-Session-Id ${sessionId}`,
            },
          }),
          fetch(`${process.env.BACK_API_URL}/productVersion`, {
            headers: {
              Authorization: `X-Session-Id ${sessionId}`,
            },
          }),
        ]);

        if (!versionResponse.ok || !productVersionResponse.ok) {
          throw new Error('Failed to fetch versions');
        }

        const versionData: Version = await versionResponse.json();
        const productData: ProductVersion = await productVersionResponse.json();

        const formattedVersion = `v${versionData.major}.${versionData.minor}.${versionData.revision}`;
        const formattedProductVersion = `v${productData.version}`;

        setState({
          version: formattedVersion,
          productVersion: formattedProductVersion,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }

    fetchVersions();
  }, [sessionId]);

  return state;
}
