/* eslint-disable */
import type React from 'react';
import { useState } from 'react';
import {
  FileText,
  Calendar,
  Image as ImageIcon,
  Users,
  Trophy,
  ArrowLeft,
  CalendarX,
  Dumbbell,
  UtensilsCrossed,
  Building,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import ActualitesManager from '@/features/admin/website/components/content/actu.tsx';
import VenuesAndMatchInfos from '@/features/admin/website/components/content/venuesInfos.tsx';
import SponsorsManager from '@/features/admin/website/components/content/sponsor.tsx';
import GaleryManager from '@/features/admin/website/components/content/galery.tsx';
import EventManager from '@/features/admin/website/components/content/event.tsx';
import AbsenceManager from '@/features/admin/website/components/content/absence.tsx';
import TrainingManager from '@/features/admin/website/components/content/training.tsx';
import PlatsManager from '@/features/admin/website/components/content/plats.tsx';
import ZonesCommandeManager from '@/features/admin/website/components/content/zones-commande.tsx';

interface ContentSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  color: string;
}

export default function AdminContent() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const contentSections: ContentSection[] = [
    {
      id: 'absences',
      title: 'Absences',
      description: 'Gérer toutes les absences des membres',
      icon: <CalendarX className="h-6 w-6" />,
      component: <AbsenceManager />,
      color: 'from-red-500 to-red-600',
    },
    {
      id: 'plats',
      title: 'Plats',
      description: 'Gérer les plats disponibles',
      icon: <UtensilsCrossed className="h-6 w-6" />,
      component: <PlatsManager />,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'clubs-infos',
      title: 'Clubs & Infos Matchs',
      description:
        'Adresses des clubs (province H) et infos exceptionnelles par match',
      icon: <MapPin className="h-6 w-6" />,
      component: <VenuesAndMatchInfos />,
      color: 'from-red-500 to-red-600',
    },
    {
      id: 'evenements',
      title: 'Événements',
      description: 'Gérer le calendrier des événements',
      icon: <Calendar className="h-6 w-6" />,
      component: <EventManager />,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'galerie',
      title: 'Galerie',
      description: 'Gérer les photos et vidéos',
      icon: <ImageIcon className="h-6 w-6" />,
      component: <GaleryManager />,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'sponsors',
      title: 'Sponsors',
      description: 'Gérer les partenaires et sponsors',
      icon: <Users className="h-6 w-6" />,
      component: <SponsorsManager />,
      color: 'from-orange-500 to-orange-600',
    },

    {
      id: 'training',
      title: 'Entraînements',
      description: 'Créer et gérer les entraînements',
      icon: <Dumbbell className="h-6 w-6" />,
      component: <TrainingManager />,
      color: 'from-blue-500 to-blue-600',
    },

    {
      id: 'zones-commande',
      title: 'Zones de commande',
      description: 'Créer et gérer les zones de commande',
      icon: <UtensilsCrossed className="h-6 w-6" />,
      component: <ZonesCommandeManager />,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'actualites',
      title: 'Actualités',
      description: 'Gérer les actualités du site',
      icon: <FileText className="h-6 w-6" />,
      component: <ActualitesManager />,
      color: 'from-teal-500 to-teal-600',
    }
  ];

  // Si une section est active, afficher uniquement cette section
  if (activeSection) {
    const section = contentSections.find((s) => s.id === activeSection);
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
          Gestion du Contenu
        </h1>
        <p className="text-gray-600">
          Gérez les éléments dynamiques de votre site web
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentSections.map((section) => (
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
                Gérer →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
