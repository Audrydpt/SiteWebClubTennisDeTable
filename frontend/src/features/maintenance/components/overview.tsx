import { CheckCircle, Clock, Package } from 'lucide-react';

import LoadingSpinner from '@/components/loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import useOverview from '../hooks/use-overview';

function VersionDisplay() {
  const { version, productVersion, isLoading, error } = useOverview();

  if (isLoading) {
    return <LoadingSpinner className="size-4" />;
  }

  if (error) {
    return <span className="text-destructive">Error: {error}</span>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">API Version</span>
        <span>{version}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">Product Version</span>
        <span>{productVersion}</span>
      </div>
    </div>
  );
}

function Overview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 md:mb-0 md:mr-4">
            <span className="text-primary font-bold">Operational</span>
            <p className="text-sm">Last checked: 5 minutes ago</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2" />
            Current Versions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 md:mb-0 md:mr-4">
            <VersionDisplay />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2" />
            Last Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <span className="text-secondary">7 days ago</span>
            <p className="text-sm text-muted-foreground">
              Next scheduled: In 2 days
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Overview;
