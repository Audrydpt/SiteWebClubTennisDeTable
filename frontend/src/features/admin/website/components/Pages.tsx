import type React from 'react';
import { useState } from 'react';
import { FileText, Phone, Info, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import AboutManager from '@/features/admin/website/components/content/about.tsx';
import ContactManager from '@/features/admin/website/components/content/contact.tsx';
import GeneralManager from '@/features/admin/website/components/content/general.tsx';
import PalmaresManager from '@/features/admin/website/components/content/palmares.tsx';

interface PageSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  color: string;
}

export default function AdminPages() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const pageSections: PageSection[] = [
    {
      id: 'about',
      title: 'Page À Propos',
      description: 'Gérer les informations et statistiques du club',
      icon: <Info className="h-6 w-6" />,
      component: <AboutManager />,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      id: 'contact',
      title: 'Page Contact',
      description: 'Gérer les informations de contact et FAQ',
      icon: <Phone className="h-6 w-6" />,
      component: <ContactManager />,
      color: 'from-teal-500 to-teal-600',
    },
    {
      id: 'palmares',
      title: 'Palmarès',
      description: 'Gérer les trophées et récompenses',
      icon: <FileText className="h-6 w-6" />,
      component: <PalmaresManager />,
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      id: 'general',
      title: 'Paramètres Généraux',
      description: 'Configuration générale du site',
      icon: <Settings className="h-6 w-6" />,
      component: <GeneralManager />,
      color: 'from-gray-500 to-gray-600',
    },
  ];

  // Si une section est active, afficher uniquement cette section
  if (activeSection) {
    const section = pageSections.find((s) => s.id === activeSection);
    if (section) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
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
          Gestion des Pages
        </h1>
        <p className="text-gray-600">
          Gérez les pages statiques et la configuration de votre site
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pageSections.map((section) => (
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
                Configurer →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
