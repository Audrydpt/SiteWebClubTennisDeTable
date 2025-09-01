/* eslint-disable */
import type React from 'react';
import { useState } from 'react';
import { PlusCircle, Edit, ArrowLeft } from 'lucide-react';
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

interface SaisonSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  color: string;
}

export default function ResultatsManager() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const saisonSections: SaisonSection[] = [
    {
      id: 'create',
      title: 'Créer une Saison',
      description: 'Créer une nouvelle saison avec équipes et calendrier',
      icon: <PlusCircle className="h-6 w-6" />,
      component: <CreateSaison />,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'update',
      title: 'Modifier une Saison',
      description:
        'Modifier une saison existante, gérer les matchs et les informations des équipes adverses',
      icon: <Edit className="h-6 w-6" />,
      component: <UpdateSaison />,
      color: 'from-blue-500 to-blue-600',
    },
  ];

  // Si une section est active, afficher uniquement cette section
  if (activeSection) {
    const section = saisonSections.find((s) => s.id === activeSection);
    if (section) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg bg-gradient-to-r ${section.color} text-white`}
              >
                {section.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <p className="text-gray-600">{section.description}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg">{section.component}</div>
        </div>
      );
    }
  }

  // Vue de la liste des sections
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestion des Saisons & Résultats
        </h1>
        <p className="text-gray-600">
          Créez et gérez les saisons, matchs et informations des clubs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {saisonSections.map((section) => (
          <Card
            key={section.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            onClick={() => setActiveSection(section.id)}
          >
            <CardHeader className="pb-4">
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-r ${section.color} text-white flex items-center justify-center mb-4`}
              >
                {section.icon}
              </div>
              <CardTitle className="text-xl">{section.title}</CardTitle>
              <CardDescription className="text-gray-600">
                {section.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                {section.id === 'create' ? 'Créer' : 'Modifier'} →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
