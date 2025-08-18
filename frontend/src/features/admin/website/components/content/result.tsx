import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-3 animate-in fade-in-50"
          >
            <AccordionItem value="create" className="border-none">
              <Card className="overflow-hidden rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 hover:no-underline hover:bg-gray-50/50 flex justify-between w-full items-center">
                  <CardTitle className="text-lg">Créer une saison</CardTitle>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <CardDescription className="mb-4">
                    Définir une nouvelle saison, ses séries, équipes et créer le
                    calendrier manuellement.
                  </CardDescription>
                  <Button
                    className="w-full"
                    onClick={() => setSection('create')}
                  >
                    Commencer la création
                  </Button>
                </AccordionContent>
              </Card>
            </AccordionItem>

            <AccordionItem value="update" className="border-none">
              <Card className="overflow-hidden rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 hover:no-underline hover:bg-gray-50/50 flex justify-between w-full items-center">
                  <CardTitle className="text-lg">Modifier une saison</CardTitle>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <CardDescription className="mb-4">
                    Éditer les informations, équipes, séries et calendrier
                    d&#39;une saison existante.
                  </CardDescription>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => setSection('update')}
                  >
                    Modifier
                  </Button>
                </AccordionContent>
              </Card>
            </AccordionItem>

            <AccordionItem value="results" className="border-none">
              <Card className="overflow-hidden rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 hover:no-underline hover:bg-gray-50/50 flex justify-between w-full items-center">
                  <CardTitle className="text-lg">
                    Mettre à jour les résultats
                  </CardTitle>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <CardDescription className="mb-4">
                    Saisir les scores des matchs et encoder les joueurs de CTT
                    Frameries ayant participé à chaque rencontre (y compris lors
                    des derbys).
                  </CardDescription>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => setSection('results')}
                  >
                    Gérer les scores et joueurs
                  </Button>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        );
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
            Gestion des Saisons & Résultats
          </h1>
          {section !== 'menu' && (
            <Button
              variant="outline"
              onClick={() => setSection('menu')}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au menu
            </Button>
          )}
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
