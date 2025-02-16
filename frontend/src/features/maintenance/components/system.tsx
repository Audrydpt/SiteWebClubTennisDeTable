import { Power } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function System() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Power className="mr-2" />
          System Control
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" className="w-full">
          Stop System
        </Button>
        <Button variant="default" className="w-full mt-2">
          Reboot System
        </Button>
      </CardContent>
    </Card>
  );
}

export default System;
