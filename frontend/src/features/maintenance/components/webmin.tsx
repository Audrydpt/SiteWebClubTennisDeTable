import { CircleArrowOutUpRight, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function Webmin() {
  const handleOpenWebmin = () => {
    // eslint-disable-next-line no-alert
    alert('Opening Webmin Interface...');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2" />
          System Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" onClick={handleOpenWebmin}>
          <CircleArrowOutUpRight className="mr-2" />
          Open Webmin Interface
        </Button>
      </CardContent>
    </Card>
  );
}

export default Webmin;
