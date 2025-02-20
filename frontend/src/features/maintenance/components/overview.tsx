import { CheckCircle, Package, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import useOverview from '../hooks/use-overview';

function VersionDisplay({
  isLoading,
  error,
  version,
  productVersion,
}: {
  isLoading: boolean;
  error: string | null;
  version: string;
  productVersion: string;
}) {
  if (isLoading) {
    return <span className="text-gray-400">Loading...</span>;
  }

  if (error) {
    return <span className="text-red-500">Error: {error}</span>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">API Version</span>
        <span className="font-mono text-lg font-medium">{version}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">Product Version</span>
        <span className="font-mono text-lg font-medium">{productVersion}</span>
      </div>
    </div>
  );
}

function Overview() {
  const { version, productVersion, isLoading, error } = useOverview();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2" />
            System Status :
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 md:mb-0 md:mr-4">
            <span className="text-green-600 font-bold">Operational</span>
            <p className="text-sm text-gray-500">Last checked: 5 minutes ago</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2" />
            Currents Versions :
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 md:mb-0 md:mr-4">
            <VersionDisplay
              isLoading={isLoading}
              error={error}
              version={version}
              productVersion={productVersion}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2" />
            Last Backup :
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <span className="text-yellow-500">7 days ago</span>
            <p className="text-sm text-gray-500">Next scheduled: In 2 days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Overview;
