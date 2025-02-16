import React from 'react';
import { FileText, Activity, CircleArrowOutUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function Diagnostic() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2" />
          System Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" className="w-full">
          <FileText className="mr-2" />
          Create Server Report
        </Button>
        <Button variant="outline" className="w-full mt-2">
          <CircleArrowOutUpRight className="mr-2" />
          Access Netdata
        </Button>
      </CardContent>
    </Card>
  );
}

export default Diagnostic;
