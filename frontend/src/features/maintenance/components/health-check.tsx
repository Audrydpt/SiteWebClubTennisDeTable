import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  HeartPulse,
  Play,
  XCircle,
} from 'lucide-react';
import { JSX, useState } from 'react';

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

function renderDetailItem(service: ServiceType, item: DetailItem): string {
  switch (service) {
    case ServiceType.CAMERA_ACTIVITY:
    case ServiceType.CAMERA_ANOMALY:
    case ServiceType.IMAGE_IN_STREAMS:
    case ServiceType.AVERAGE_FPS:
      return `${item.name || item.id} ${item.message}`;
    default:
      return item.message || '';
  }
}

function renderServiceStatus(
  service: ServiceType,
  statuses: Record<string, ServiceStatus | undefined>
): JSX.Element {
  const serviceData = statuses[service];

  if (serviceData?.status) {
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
          {SERVICE_LABELS[service]}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center">
      <LoadingSpinner className="size-4 mr-2" />
      <span className="text-muted-foreground">
        {SERVICE_LABELS[service]} checking...
      </span>
    </div>
  );
}

function hasDetails(
  service: ServiceType,
  statuses: Record<string, ServiceStatus | undefined>
): boolean {
  const serviceData = statuses[service];
  return Boolean(serviceData?.details && serviceData.details.length > 0);
}

export default function HealthCheck() {
  const { sessionId } = useAuth();
  const { progress, running, statuses, startHealthCheck } = useHealthCheck();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStartHealthCheck = () => {
    if (!sessionId) return;
    setHasStarted(true);
    startHealthCheck(sessionId);
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
        {hasStarted && <Progress value={progress} className="mt-4" />}
        {hasStarted && (
          <div className="mt-4 space-y-2">
            {Object.values(ServiceType).map((service) => (
              <Collapsible key={service}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {renderServiceStatus(service, statuses)}
                  </div>
                  {hasDetails(service, statuses) && (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 size-6 group"
                      >
                        <ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
                {hasDetails(service, statuses) && (
                  <CollapsibleContent className="mt-2">
                    <ul className="ml-6 text-sm text-muted-foreground">
                      {(statuses[service] as ServiceStatus).details?.map(
                        (item: DetailItem) => (
                          <li key={item.id}>
                            {renderDetailItem(service, item)}
                          </li>
                        )
                      )}
                    </ul>
                  </CollapsibleContent>
                )}
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
