/* eslint-disable no-console,react-hooks/exhaustive-deps,@typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';

export interface ForensicTask {
  id: string;
  status: 'SUCCESS' | 'PENDING' | 'REVOKED' | 'FAILURE' | string;
  type: string;
  created: string;
  count: number;
  size?: number;
}

export interface ForensicTaskResponse {
  tasks: {
    [key: string]: {
      status: string;
      type: string;
      created: string;
      count: number;
      size?: number;
    };
  };
}

export interface TabJob {
  tabIndex: number;
  jobId?: string;
  status?: 'idle' | 'running' | 'completed' | 'error';
  isNew?: boolean;
}

export default function useJobs(clearResults?: () => void) {
  const [tasks, setTasks] = useState<ForensicTask[]>([]);
  const [tabJobs, setTabJobs] = useState<TabJob[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Conversion du statut de l'API vers le statut du TabJob
  const mapTaskStatusToTabStatus = (
    taskStatus: string
  ): 'idle' | 'running' | 'completed' | 'error' => {
    switch (taskStatus) {
      case 'SUCCESS':
        return 'completed';
      case 'PENDING':
      case 'STARTED':
        return 'running';
      case 'REVOKED':
      case 'FAILURE':
        return 'error';
      default:
        return 'idle';
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${process.env.MAIN_API_URL}/forensics`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data: ForensicTaskResponse = await response.json();

      // Transformation des données de l'API
      const tasksArray: ForensicTask[] = Object.entries(data.tasks).map(
        ([id, task]) => ({
          id,
          status: task.status,
          type: task.type,
          created: task.created,
          count: task.count,
          size: task.size,
        })
      );

      tasksArray.sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      );

      setTasks(tasksArray);

      // Conserver les onglets personnalisés avec isNew: true
      setTabJobs((prevTabs) => {
        // Identifier les onglets personnalisés à préserver
        const customTabs = prevTabs.filter((tab) => tab.isNew);

        // Créer les onglets basés sur les données API
        const apiTabs: TabJob[] = Array(5)
          .fill(0)
          .map((_, index) => ({
            tabIndex: index + 1,
            jobId: tasksArray[index]?.id,
            status: tasksArray[index]
              ? mapTaskStatusToTabStatus(tasksArray[index].status)
              : 'idle',
          }));

        // Fusionner en donnant priorité aux onglets personnalisés
        const mergedTabs = [...apiTabs];

        customTabs.forEach((customTab) => {
          const existingIndex = mergedTabs.findIndex(
            (tab) => tab.tabIndex === customTab.tabIndex
          );

          if (existingIndex >= 0) {
            mergedTabs[existingIndex] = customTab;
          } else {
            mergedTabs.push(customTab);
          }
        });

        return mergedTabs;
      });

      setError(null);
    } catch (err) {
      console.error(
        'Erreur lors de la récupération des tâches forensics:',
        err
      );
      setError('Impossible de charger les tâches forensiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedJobId = localStorage.getItem('currentJobId');

    if (storedJobId) {
      console.log('JobId trouvé dans localStorage:', storedJobId);

      // Attendre que les onglets soient chargés depuis l'API
      const checkAndSetActiveTab = () => {
        // Chercher l'onglet correspondant au jobId stocké
        const matchingTab = tabJobs.find((tab) => tab.jobId === storedJobId);

        if (matchingTab) {
          console.log(
            `Définition de l'onglet actif sur ${matchingTab.tabIndex} pour le job ${storedJobId}`
          );
          setActiveTabIndex(matchingTab.tabIndex);
          return true;
        }
        return false;
      };

      // Vérifier immédiatement si les données sont déjà chargées
      if (!checkAndSetActiveTab() && !loading) {
        // Si les données ne sont pas encore chargées, forcer un fetchTasks
        fetchTasks();
      }
    }
  }, [tabJobs, loading]);

  const addNewTab = () => {
    console.log("Tentative d'ajout d'un nouvel onglet");

    // Calculer le nombre d'onglets affichés (onglets avec un jobId ou l'onglet actif)
    const visibleTabs = tabJobs.filter(
      (tab) => tab.jobId || tab.tabIndex === activeTabIndex
    );

    if (visibleTabs.length >= 5) {
      console.log("Nombre maximum d'onglets atteint (5), ajout impossible");
      return;
    }

    // Calculer le prochain index disponible
    const maxIndex = tabJobs.reduce(
      (max, tab) => (tab.tabIndex > max ? tab.tabIndex : max),
      0
    );

    const nextIndex = maxIndex + 1;
    console.log('Index du nouvel onglet:', nextIndex);

    // Créer un nouvel onglet
    const newTab: TabJob = {
      tabIndex: nextIndex,
      status: 'idle',
      isNew: true,
    };

    console.log('Nouvel onglet créé:', newTab);

    // Ajouter le nouvel onglet
    setTabJobs((prev) => [...prev, newTab]);

    // Si clearResults est disponible, l'appeler pour nettoyer les résultats
    if (clearResults) {
      clearResults();
    }
  };

  const handleTabChange = (tabIndex: number) => {
    // Récupérer le tab vers lequel on change
    const targetTab = tabJobs.find((tab) => tab.tabIndex === tabIndex);

    // Si c'est un nouveau tab, effacer les résultats
    if (targetTab?.isNew && clearResults) {
      clearResults();
    } else if (targetTab?.isNew) {
      console.warn("La fonction clearResults n'est pas définie");
    }

    setActiveTabIndex(tabIndex);

    // Récupérer le jobId correspondant au nouvel onglet
    const selectedTab = tabJobs.find((tab) => tab.tabIndex === tabIndex);

    // Mettre à jour le localStorage avec le nouveau jobId
    if (selectedTab?.jobId) {
      localStorage.setItem('currentJobId', selectedTab.jobId);
      console.log(`JobId mis à jour dans localStorage: ${selectedTab.jobId}`);
    } else {
      // Si l'onglet n'a pas de jobId associé, effacer le localStorage
      localStorage.removeItem('currentJobId');
      console.log('JobId supprimé du localStorage (onglet sans job associé)');
    }
  };

  // Récupération d'une tâche par ID
  const getTaskById = (id?: string): ForensicTask | undefined => {
    if (!id) return undefined;
    return tasks.find((task) => task.id === id);
  };

  // Récupération de la tâche associée à l'onglet actif
  const getActiveTask = (): ForensicTask | undefined => {
    const activeTab = tabJobs.find((tab) => tab.tabIndex === activeTabIndex);
    return activeTab?.jobId ? getTaskById(activeTab.jobId) : undefined;
  };

  // Rafraîchissement périodique des tâches
  useEffect(() => {
    // Chargement initial
    fetchTasks();

    // Rafraîchissement toutes les 3 secondes
    const interval = setInterval(fetchTasks, 3000);

    return () => clearInterval(interval);
  }, []);

  const resumeActiveJob = async (
    resumeCallback: (id: string) => Promise<any>
  ) => {
    const activeTab = tabJobs.find((tab) => tab.tabIndex === activeTabIndex);

    if (!activeTab?.jobId) {
      console.log('Aucun job associé à cet onglet');
      return null;
    }

    console.log(
      `Reprise du job ${activeTab.jobId} avec statut ${activeTab.status}`
    );

    // Appeler resumeJob avec le jobId de l'onglet actif
    return resumeCallback(activeTab.jobId);
  };

  return {
    tasks,
    tabJobs,
    activeTabIndex,
    loading,
    error,
    fetchTasks,
    getTaskById,
    getActiveTask,
    handleTabChange,
    resumeActiveJob,
    setTabJobs,
    addNewTab,
  };
}
