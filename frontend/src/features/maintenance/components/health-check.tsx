/* eslint-disable */
import {
  HeartPulse,
  Play,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import useHealthCheck from '../hooks/use-healthCheck';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import LoadingSpinner from '@/components/loading';

const SERVICE_LABELS: Record<string, string> = {
  'ai-service': 'AI Service',
  'camera-activity': 'Camera Activity',
  'camera-anomaly': 'Camera Configuration',
  'image-in-streams': 'Snapshot Configuration',
};

interface DetailItem {
  id?: string;
  name?: string;
  reason?: string;
  message?: string;
  application?: string;
}

interface ServiceStatus {
  status?: string;
  details?: DetailItem[];
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ok':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    default:
      return 'text-red-500';
  }
}

function HealthCheck() {
  const { progress, running, statuses, startHealthCheck } = useHealthCheck();
  const [expandedServices, setExpandedServices] = useState<
    Record<string, boolean>
  >({});
  const [hasStarted, setHasStarted] = useState(false);

  const toggleDetails = (service: string) => {
    setExpandedServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
  };

  const handleStartHealthCheck = () => {
    setHasStarted(true);
    startHealthCheck();
  };

  const renderDetailItem = (service: string, item: DetailItem) => {
    if (service === 'camera-activity') {
      return `${item.name || item.id} ${item.reason}`;
    }
    if (service === 'camera-anomaly') {
      return `Stream ${item.id} ${item.reason}`;
    }
    if (service === 'image-in-streams') {
      return `${item.name} ${item.reason}`;
    }
    return item.message;
  };

  const renderServiceStatus = (service: string) => {
    const serviceData = statuses[service] as ServiceStatus | undefined;

    if (!running && serviceData?.status) {
      return (
        <div className="flex items-center">
          {serviceData.status === 'ok' && (
            <CheckCircle className="text-green-500 mr-2" />
          )}
          {serviceData.status === 'warning' && (
            <AlertTriangle className="text-yellow-500 mr-2" />
          )}
          {serviceData.status === 'error' && (
            <XCircle className="text-red-500 mr-2" />
          )}
          <span className={getStatusColor(serviceData.status)}>
            {SERVICE_LABELS[service]} is {serviceData.status.toUpperCase()}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <LoadingSpinner className="w-4 h-4 mr-2" />
        <span className="text-gray-500">
          {SERVICE_LABELS[service]} checking...
        </span>
      </div>
    );
  };

  const hasDetails = (service: string): boolean => {
    const serviceData = statuses[service] as ServiceStatus | undefined;
    return Boolean(serviceData?.details && serviceData.details.length > 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <HeartPulse className="mr-2" />
          System Health Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleStartHealthCheck}
          disabled={running}
        >
          <Play className="mr-2" />
          {running ? 'Running...' : 'Run Health Check'}
        </Button>
        {progress > 0 && <Progress value={progress} className="mt-4" />}
        {hasStarted && (
          <div className="mt-4 space-y-2">
            {Object.keys(SERVICE_LABELS).map((service) => (
              <div key={service} className="mb-2">
                <div className="flex items-center justify-between">
                  {renderServiceStatus(service)}
                  {hasDetails(service) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-6 w-6"
                      onClick={() => toggleDetails(service)}
                    >
                      {expandedServices[service] ? (
                        <ChevronDown />
                      ) : (
                        <ChevronRight />
                      )}
                    </Button>
                  )}
                </div>
                {expandedServices[service] &&
                  (statuses[service] as ServiceStatus)?.details && (
                    <ul className="ml-6 mt-2 text-sm text-gray-500">
                      {(statuses[service] as ServiceStatus).details?.map(
                        (item) => (
                          <li
                            key={`${service}-${item.id || item.name || item.message}`}
                            className={getStatusColor(
                              (statuses[service] as ServiceStatus).status || ''
                            )}
                          >
                            {renderDetailItem(service, item)}
                          </li>
                        )
                      )}
                    </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HealthCheck;
