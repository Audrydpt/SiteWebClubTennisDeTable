import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface TabJob {
  tabIndex: number; // Index de l'onglet (1-5)
  jobId?: string; // ID du job associé (optionnel)
  status?: 'idle' | 'running' | 'completed' | 'error'; // État optionnel du job
}

interface JobTabsProps {
  tabJobs: TabJob[]; // Association entre tabs et jobs
  activeTabIndex: number; // Onglet actuellement actif (1-5)
  onTabChange: (tabIndex: number) => void; // Callback lors du changement d'onglet
  hideTitle?: boolean;
}

export default function JobTabs({
  tabJobs = [],
  activeTabIndex = 1,
  onTabChange,
  hideTitle = false,
}: JobTabsProps) {
  // Filtrer les tabJobs pour ne garder que ceux avec un jobId ou limiter à 5 maximum
  const activeTabs = tabJobs
    .filter((tab) => tab.jobId)
    .sort((a, b) => a.tabIndex - b.tabIndex)
    .slice(0, 5);

  // S'il n'y a pas de tabs actifs, afficher un tab par défaut
  const displayTabs: TabJob[] =
    activeTabs.length > 0
      ? activeTabs
      : [{ tabIndex: 1, status: 'idle' } as TabJob];

  // Nouvelle fonction pour obtenir la classe de grille appropriée
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

  return (
    <div className="flex flex-col">
      {!hideTitle && (
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">Résultats de recherche</h2>
        </div>
      )}

      <Tabs
        value={activeTabIndex.toString()}
        className="w-full"
        onValueChange={(value) => onTabChange(parseInt(value, 10))}
      >
        <TabsList className={`grid w-full ${getGridClass(displayTabs.length)}`}>
          {displayTabs.map((tab) => {
            const hasJob = 'jobId' in tab && !!tab.jobId;
            // Générer l'affichage de l'onglet en fonction de son état
            let tabDisplay = `Recherche ${tab.tabIndex}`;
            let statusIndicator = null;

            if (hasJob) {
              tabDisplay = `R${tab.tabIndex}`;

              // Ajouter un indicateur visuel pour le statut
              if (tab.status === 'running') {
                statusIndicator = (
                  <span className="ml-1 animate-pulse">⌛</span>
                );
              } else if (tab.status === 'completed') {
                statusIndicator = <span className="ml-1">✓</span>;
              } else if (tab.status === 'error') {
                statusIndicator = <span className="ml-1">⚠️</span>;
              }
            }

            return (
              <TabsTrigger
                key={tab.tabIndex}
                value={tab.tabIndex.toString()}
                className={hasJob ? 'font-medium' : ''}
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
            {/* Le contenu sera injecté par le composant parent */}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
