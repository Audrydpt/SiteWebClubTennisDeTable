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

  // Fonction pour générer une couleur d'arrière-plan basée sur le statut
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return '';
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
        <TabsList
          className={`grid w-full ${displayTabs.length > 0 ? `grid-cols-${displayTabs.length}` : 'grid-cols-1'}`}
        >
          {displayTabs.map((tab) => {
            const hasJob = 'jobId' in tab && !!tab.jobId;
            const isActive = activeTabIndex === tab.tabIndex;

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
                className={`
                  ${hasJob ? 'font-medium' : ''}
                  ${isActive && hasJob ? getStatusColor(tab.status) : ''}
                `}
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
