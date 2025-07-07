'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import CreateSaison from '@/features/admin/website/components/content/saison/createSaison.tsx';
import UpdateSaison from '@/features/admin/website/components/content/saison/updateSaison.tsx';
import UpdateResults from '@/features/admin/website/components/content/saison/updateResults.tsx';

type SectionType = 'menu' | 'create' | 'update' | 'results';

export default function ResultatsAdminPage() {
  const [section, setSection] = useState<SectionType>('menu');

  const renderContent = () => {
    switch (section) {
      case 'create':
        return <CreateSaison />;
      case 'update':
        return <UpdateSaison />;
      case 'results':
        return <UpdateResults />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in-50">
            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-300"
              onClick={() => setSection('create')}
            >
              <CardHeader>
                <CardTitle>Créer une saison</CardTitle>
                <CardDescription>
                  Définir une nouvelle saison, ses séries, équipes et créer le
                  calendrier manuellement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Commencer la création</Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-300"
              onClick={() => setSection('update')}
            >
              <CardHeader>
                <CardTitle>Modifier une saison</CardTitle>
                <CardDescription>
                  Éditer les informations, équipes, séries et calendrier
                  d&#39;une saison existante.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="secondary">
                  Modifier
                </Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-300"
              onClick={() => setSection('results')}
            >
              <CardHeader>
                <CardTitle>Mettre à jour les résultats</CardTitle>
                <CardDescription>
                  Saisir les scores des matchs pour chaque journée de
                  championnat.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="secondary">
                  Gérer les scores
                </Button>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Gestion des Saisons & Résultats
          </h1>
          {section !== 'menu' && (
            <Button variant="outline" onClick={() => setSection('menu')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au menu
            </Button>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
