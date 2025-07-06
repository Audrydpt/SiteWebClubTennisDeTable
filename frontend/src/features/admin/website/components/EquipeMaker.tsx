import { Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminUsers() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des equipes et rencontres
          </CardTitle>
          <CardDescription>Gérer les equipes et les rencontres</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Section en développement
            </h3>
            <p className="text-gray-500">La section sera bientôt disponible.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
