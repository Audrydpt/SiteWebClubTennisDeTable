import { Upload, CheckSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Firmware() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckSquare className="mr-2" />
          Firmware Update
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Card className="bg-gray-100 flex p-4 mb-4 h-24">
          {' '}
          <CardContent>
            <p className="text-sm text-gray-700">
              You need 2 specific files supplied by ACIC: firmware.mvf and
              firmware.mvk.
            </p>
          </CardContent>
        </Card>

        <div className="mt-2">
          {' '}
          <Button variant="outline" className="mr-2">
            <Search className="mr-2" />
            Browse Files
          </Button>
          <Button variant="outline">
            <Upload className="mr-2" />
            Upload and Install
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default Firmware;
