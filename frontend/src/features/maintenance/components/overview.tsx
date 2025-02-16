import { CheckCircle, Package, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Overview() {
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
            Current Version :
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 md:mb-0 md:mr-4">
            <span className="font-mono">v3.2.24010</span>
            <p className="text-sm text-gray-500">Released on: 2024-01-10</p>
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
