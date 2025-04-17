import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface TabJob {
  tabIndex: number; // Index de l'onglet (1-5)
  jobId?: string; // ID du job associé (optionnel)
  status?: 'idle' | 'running' | 'completed' | 'error'; // État optionnel du job
  isNew?: boolean; // Indique si l'onglet est nouvellement créé
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

  // 1. Liste des onglets avec un job associé (onglets actifs)
  const activeTabsWithJob = tabJobs.filter((tab) => tab.jobId);

  // 2. Liste des onglets vides ajoutés via le bouton "+" (sans job, mais considérés comme actifs)
  const newEmptyTabs = tabJobs.filter(
    (tab) => !tab.jobId && (tab.isNew || tab.tabIndex > 5)
  );

  // 3. Préparation de la liste d'affichage
  let displayTabs: TabJob[] = [];

  // Toujours inclure l'onglet actif en premier
  const currentActiveTab = tabJobs.find(
    (tab) => tab.tabIndex === activeTabIndex
  );
  if (currentActiveTab) {
    displayTabs.push(currentActiveTab);
  }

  // Ajouter tous les nouveaux onglets vides (isNew: true) en priorité
  newEmptyTabs.forEach((tab) => {
    if (!displayTabs.some((t) => t.tabIndex === tab.tabIndex)) {
      displayTabs.push(tab);
    }
  });

  // Compléter avec les onglets qui ont un job associé
  activeTabsWithJob.forEach((tab) => {
    if (!displayTabs.some((t) => t.tabIndex === tab.tabIndex)) {
      displayTabs.push(tab);
    }
  });

  // Trier les onglets par index et limiter à MAX_TABS
  displayTabs = displayTabs
    .sort((a, b) => a.tabIndex - b.tabIndex)
    .slice(0, MAX_TABS);

  // S'il n'y a pas d'onglets, afficher un onglet par défaut
  if (displayTabs.length === 0) {
    displayTabs.push({ tabIndex: 1, status: 'idle' });
  }

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
            {/* Le contenu sera injecté par le composant parent */}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
