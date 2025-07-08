import type React from 'react';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Trophy,
  Calendar,
  // Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import ActualitesManager from '@/features/admin/website/components/content/actu.tsx';
import TournoisManager from '@/features/admin/website/components/content/tournament.tsx';
import ResultatsManager from '@/features/admin/website/components/content/result.tsx';
import SponsorsManager from '@/features/admin/website/components/content/sponsor.tsx';

interface ContentSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  color: string;
}

export default function AdminContent() {
  const [openSections, setOpenSections] = useState<string[]>(['']);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const contentSections: ContentSection[] = [
    {
      id: 'actualites',
      title: 'Gestion des Actualités',
      description: 'Créer, modifier et supprimer les actualités',
      icon: <FileText className="h-5 w-5 text-green-600" />,
      component: <ActualitesManager />,
      color: 'bg-green-100',
    },

    {
      id: 'sponsors',
      title: 'Gestion des Sponsors',
      description: 'Créer, modifier et supprimer les sponsors',
      icon: <FileText className="h-5 w-5 text-purple-600" />,
      component: <SponsorsManager />,
      color: 'bg-purple-100',
    },

    {
      id: 'resultats',
      title: 'Gestion des Résultats',
      description: 'Créer, modifier et supprimer les matchs',
      icon: <Calendar className="h-5 w-5 text-blue-600" />,
      component: <ResultatsManager />,
      color: 'bg-blue-100',
    },
    {
      id: 'tournois',
      title: 'Gestion des Tournois',
      description: 'Créer, modifier et supprimer les tournois',
      icon: <Trophy className="h-5 w-5 text-yellow-600" />,
      component: <TournoisManager />,
      color: 'bg-yellow-100',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion du Contenu</h2>
      </div>

      {contentSections.map((section) => (
        <Card key={section.id} className="overflow-hidden">
          <Collapsible
            open={openSections.includes(section.id)}
            onOpenChange={() => toggleSection(section.id)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 ${section.color} rounded-lg flex items-center justify-center`}
                    >
                      {section.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                  {openSections.includes(section.id) ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 max-h-[600px] overflow-y-auto">
                {section.component}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
