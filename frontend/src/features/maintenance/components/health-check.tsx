import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  HeartPulse,
  Play,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

import LoadingSpinner from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/providers/auth-context.tsx';

import useHealthCheck from '../hooks/use-healthCheck';
import { HealthStatus, SERVICE_LABELS, ServiceType } from '../lib/utils/types';

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
      return 'text-primary';
    case HealthStatus.WARNING:
      return 'text-secondary';
    case HealthStatus.ERROR:
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

function HealthCheck() {
  const { sessionId } = useAuth();
  const { progress, running, statuses, startHealthCheck } = useHealthCheck();
  const [hasStarted, setHasStarted] = useState(false);

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
            <CheckCircle
              className={`${getStatusColor(serviceData.status)} mr-2`}
            />
          )}
          {serviceData.status === HealthStatus.WARNING && (
            <AlertTriangle
              className={`${getStatusColor(serviceData.status)} mr-2`}
            />
          )}
          {serviceData.status === HealthStatus.ERROR && (
            <XCircle className={`${getStatusColor(serviceData.status)} mr-2`} />
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
              <Collapsible key={service}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">{renderServiceStatus(service)}</div>
                  {hasDetails(service) && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 collapsible-rotate" />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
                <CollapsibleContent className="mt-2">
                  {(statuses[service] as ServiceStatus)?.details && (
                    <ul className="ml-6 text-sm text-gray-500">
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
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HealthCheck;
