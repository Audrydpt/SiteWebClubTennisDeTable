/* eslint-disable no-console */
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface TabJob {
  tabIndex: number;
  jobId?: string;
  status?: 'idle' | 'running' | 'completed' | 'error';
  isNew?: boolean;
}

interface JobTabsProps {
  tabJobs: TabJob[];
  activeTabIndex: number;
  onTabChange: (tabIndex: number) => void;
  hideTitle?: boolean;
  isLoading?: boolean;
}

export default function JobTabs({
  tabJobs = [],
  activeTabIndex = 1,
  onTabChange,
  hideTitle = false,
  isLoading = false,
}: JobTabsProps) {
  const MAX_TABS = 5;

  // Utiliser directement les tabJobs fournis, sans triage
  let displayTabs = [...tabJobs];

  // Si aucun onglet n'est disponible, ajouter un onglet par défaut
  if (displayTabs.length === 0) {
    displayTabs = [{ tabIndex: 1, status: 'idle' }];
  }

  // S'assurer que l'onglet actif est toujours inclus
  if (!displayTabs.some((tab) => tab.tabIndex === activeTabIndex)) {
    displayTabs.push({ tabIndex: activeTabIndex, status: 'idle' });
  }

  // Limiter à MAX_TABS sans trier
  displayTabs = displayTabs.slice(0, MAX_TABS);

  // Fonction pour obtenir la classe de grille appropriée
  const getGridClass = (count: number) => {
    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-3';
      case 4:
        return 'grid-cols-4';
      case 5:
        return 'grid-cols-5';
      default:
        return 'grid-cols-1';
    }
  };

  // Afficher un état de chargement global
  if (isLoading && tabJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Chargement des tâches...</p>
      </div>
    );
  }

  console.log('Onglets à afficher:', displayTabs);

  return (
    <div className="flex flex-col">
      {!hideTitle && (
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">Résultats de recherche</h2>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </div>
      )}

      <Tabs
        value={activeTabIndex.toString()}
        className="w-full"
        onValueChange={(value) => onTabChange(parseInt(value, 10))}
      >
        <TabsList className={`grid w-full ${getGridClass(displayTabs.length)}`}>
          {displayTabs.map((tab) => {
            const hasJob = !!tab.jobId;
            // Générer l'affichage de l'onglet en fonction de son état
            let tabDisplay = `Recherche ${tab.tabIndex}`;
            let statusIndicator = null;

            if (hasJob) {
              tabDisplay = `R${tab.tabIndex}`;

              // Ajouter un indicateur visuel pour le statut
              if (tab.status === 'running') {
                statusIndicator = (
                  <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                );
              } else if (tab.status === 'completed') {
                statusIndicator = <span className="ml-1 text-primary">✓</span>;
              } else if (tab.status === 'error') {
                statusIndicator = (
                  <span className="ml-1 text-destructive">⚠️</span>
                );
              }
            }

            // Appliquer une classe spéciale pour les onglets actifs et en cours d'exécution
            const activeTabClass =
              activeTabIndex === tab.tabIndex ? 'ring-1 ring-primary' : '';

            const runningClass =
              tab.status === 'running' ? 'bg-muted/50 animate-pulse' : '';

            return (
              <TabsTrigger
                key={tab.tabIndex}
                value={tab.tabIndex.toString()}
                className={`${hasJob ? 'font-medium' : ''} ${activeTabClass} ${runningClass} transition-all`}
                disabled={isLoading}
              >
                {tabDisplay}
                {statusIndicator}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Les contenus des onglets - ils seront vides car le contenu sera injecté par le parent */}
        {displayTabs.map((tab) => (
          <TabsContent key={tab.tabIndex} value={tab.tabIndex.toString()}>
            {isLoading && (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
