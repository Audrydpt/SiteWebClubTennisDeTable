/* eslint-disable prettier/prettier */
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
import { HealthStatus, ServiceType, SERVICE_LABELS } from '../lib/utils/types';
import { useAuth } from '@/providers/auth-context.tsx';

interface DetailItem {
  id?: string;
  name?: string;
  reason?: string;
  message?: string;
  application?: string;
}

interface ServiceStatus {
  status?: HealthStatus;
  details?: DetailItem[];
}

function getStatusColor(status: HealthStatus): string {
  switch (status) {
    case HealthStatus.OK:
      return 'text-green-500';
    case HealthStatus.WARNING:
      return 'text-yellow-500';
    default:
      return 'text-red-500';
  }
}

function HealthCheck() {
  const { sessionId } = useAuth();
  const { progress, running, statuses, startHealthCheck } = useHealthCheck();
  const [expandedServices, setExpandedServices] = useState<
    Record<ServiceType, boolean>
  >(() =>
    Object.values(ServiceType).reduce(
      (acc, service) => ({
        ...acc,
        [service]: false,
      }),
      {} as Record<ServiceType, boolean>
    )
  );
  const [hasStarted, setHasStarted] = useState(false);

  const toggleDetails = (service: ServiceType) => {
    setExpandedServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
  };

  const handleStartHealthCheck = () => {
    if (!sessionId) {
      return;
    }
    setHasStarted(true);
    startHealthCheck(sessionId);
  };

  const renderDetailItem = (service: ServiceType, item: DetailItem) => {
    if (service === ServiceType.CAMERA_ACTIVITY) {
      return `${item.name || item.id} ${item.message}`;
    }
    if (service === ServiceType.CAMERA_ANOMALY) {
      return `Stream ${item.id} ${item.reason}`;
    }
    if (service === ServiceType.IMAGE_IN_STREAMS) {
      return `${item.name} ${item.reason}`;
    }
    if (service === ServiceType.AI_SERVICE) {
      return item.message || '';
    }
    if (service === ServiceType.AVERAGE_FPS) {
      return `Camera ${item.id} ${item.message}`;
    }
    if (service === ServiceType.SECONDARY) {
      return item.message || '';
    }
    return item.message || '';
  };

  const renderServiceStatus = (service: ServiceType) => {
    const serviceData = statuses[service] as ServiceStatus | undefined;

    if (!running && serviceData?.status) {
      return (
        <div className="flex items-center">
          {serviceData.status === HealthStatus.OK && (
            <CheckCircle className="text-green-500 mr-2" />
          )}
          {serviceData.status === HealthStatus.WARNING && (
            <AlertTriangle className="text-yellow-500 mr-2" />
          )}
          {serviceData.status === HealthStatus.ERROR && (
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

  const hasDetails = (service: ServiceType): boolean => {
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
            {Object.values(ServiceType).map((service) => (
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
                              (statuses[service] as ServiceStatus)?.status ||
                                HealthStatus.ERROR
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
