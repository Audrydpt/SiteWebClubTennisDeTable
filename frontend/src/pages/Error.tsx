import { AlertCircle, Ban, Home, Server, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type ErrorType = '404' | '403' | '500' | 'crash';

interface ErrorConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  '404': {
    title: 'Page Not Found',
    description:
      "We couldn't find the page you're looking for. Please check the URL or navigate back.",
    icon: <AlertCircle className="h-16 w-16 text-muted-foreground" />,
  },
  '403': {
    title: 'Access Forbidden',
    description:
      "You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.",
    icon: <ShieldAlert className="h-16 w-16 text-destructive" />,
  },
  '500': {
    title: 'Server Error',
    description:
      'Our servers are experiencing issues. Please try again later or contact support if the problem persists.',
    icon: <Server className="h-16 w-16 text-destructive" />,
  },
  crash: {
    title: 'Application Error',
    description:
      'The application encountered an unexpected error. Please refresh the page or contact support if the issue continues.',
    icon: <Ban className="h-16 w-16 text-destructive" />,
  },
};

interface ErrorPageProps {
  type: ErrorType;
}

export default function ErrorPage({ type }: ErrorPageProps) {
  const navigate = useNavigate();
  const config = ERROR_CONFIGS[type];

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-muted/10">{config.icon}</div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-4xl font-bold">{config.title}</CardTitle>
            <CardDescription className="text-lg">
              {config.description}
            </CardDescription>
          </div>
        </CardHeader>
        <Separator className="my-2" />
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="default"
              size="lg"
              onClick={() => navigate('/')}
              className="flex gap-2 w-full sm:w-auto"
            >
              <Home className="h-5 w-5" />
              Return Home
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
