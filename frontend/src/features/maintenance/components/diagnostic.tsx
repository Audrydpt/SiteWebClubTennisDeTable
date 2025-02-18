import React from 'react';
import { FileText, Activity, CircleArrowOutUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useDump from '../hooks/use-dump';
import LoadingSpinner from '@/components/loading';

function Diagnostic() {
  const { downloadDump, loading } = useDump();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2" />
          System Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="secondary"
          className="w-full"
          onClick={downloadDump}
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner className="mr-2" />
              Generating Report...
            </>
          ) : (
            <>
              <FileText className="mr-2" />
              Create Server Report
            </>
          )}
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
