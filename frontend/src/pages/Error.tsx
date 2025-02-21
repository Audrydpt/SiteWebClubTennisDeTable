import { AlertCircle, Ban, Home, Server, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ErrorType = '404' | '403' | '500' | 'crash';

interface ErrorConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  '404': {
    title: '404 - Page Not Found',
    description: "Oops! The page you're looking for doesn't exist.",
    icon: <AlertCircle className="h-12 w-12 text-muted-foreground" />,
  },
  '403': {
    title: '403 - Access Forbidden',
    description: "Sorry, you don't have permission to access this page.",
    icon: <ShieldAlert className="h-12 w-12 text-destructive" />,
  },
  '500': {
    title: '500 - Server Error',
    description: 'Oops! Something went wrong on our server.',
    icon: <Server className="h-12 w-12 text-destructive" />,
  },
  crash: {
    title: 'Application Error',
    description: 'Sorry, the application has encountered an unexpected error.',
    icon: <Ban className="h-12 w-12 text-destructive" />,
  },
};

interface ErrorPageProps {
  type: ErrorType;
}

export default function ErrorPage({ type }: ErrorPageProps) {
  const navigate = useNavigate();
  const config = ERROR_CONFIGS[type];

  return (
    <Card className="max-w-md mx-auto mt-20 shadow-lg">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">{config.icon}</div>
        <CardTitle className="text-4xl font-bold">{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-lg text-muted-foreground">{config.description}</p>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Button
          variant="default"
          onClick={() => navigate('/dashboard')}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Return Home
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </CardFooter>
    </Card>
  );
}
