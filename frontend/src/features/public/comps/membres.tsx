/* eslint-disable */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectMembreProps {
  membres: string[];
  onSelect: (membre: string) => void;
}

export function SelectMembre({ membres, onSelect }: SelectMembreProps) {
  const [selection, setSelection] = useState<string>('');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Identification</CardTitle>
          <CardDescription>
            Qui passe la commande ? Veuillez sélectionner votre nom dans la
            liste.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={setSelection} value={selection}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez votre nom..." />
            </SelectTrigger>
            <SelectContent>
              {membres.map((membre) => (
                <SelectItem key={membre} value={membre}>
                  {membre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => onSelect(selection)}
            disabled={!selection}
            className="w-full"
          >
            Confirmer et commencer la commande
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
