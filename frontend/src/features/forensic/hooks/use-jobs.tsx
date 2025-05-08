/* eslint-disable no-console,react-hooks/exhaustive-deps,@typescript-eslint/no-explicit-any,no-plusplus */
import { useEffect, useState } from 'react';

// Number of maximum results to keep
const FORENSIC_PAGINATION_ITEMS = parseInt(
  process.env.FORENSIC_PAGINATION_ITEMS || '12',
  10
);

export interface ForensicTask {
  id: string;
  status: 'SUCCESS' | 'PENDING' | 'REVOKED' | 'FAILURE' | string;
  type: string;
  created: string;
  count: number;
  size: number;
  total_pages?: number;
}

export interface ForensicTaskResponse {
  tasks: {
    [key: string]: {
      status: string;
      type: string;
      created: string;
      count: number;
      size: number;
      total_pages: number;
    };
  };
}

export interface TabJob {
  tabIndex: number;
  jobId?: string;
  status?: 'idle' | 'running' | 'completed' | 'error';
  isNew?: boolean;
}

export default function useJobs() {
  const [tasks, setTasks] = useState<ForensicTask[]>([]);
  const [tabJobs, setTabJobs] = useState<TabJob[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(1);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
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

  // Dans useJobs.ts, modifiez la fonction selectLeftmostTab
  const selectLeftmostTab = () =>
    new Promise<number>((resolve) => {
      setTimeout(() => {
        // Ne changer d'onglet que si aucun n'est actuellement actif
        // ou si l'onglet actif n'existe plus dans tabJobs
        const activeTabExists = tabJobs.some(
          (tab) => tab.tabIndex === activeTabIndex
        );

        if (!activeTabExists && tabJobs.length > 0) {
          const leftmostTab = [...tabJobs].sort(
            (a, b) => a.tabIndex - b.tabIndex
          )[0];
          setActiveTabIndex(leftmostTab.tabIndex);

          // Mettre à jour le jobId seulement si nécessaire
          if (leftmostTab.jobId) {
            setActiveJobId(leftmostTab.jobId);
            console.log(`JobId mis à jour: ${leftmostTab.jobId}`);
          }

          resolve(leftmostTab.tabIndex);
        } else if (tabJobs.length > 0) {
          // Garder l'onglet actif mais mettre à jour le jobId si nécessaire
          const currentTab = tabJobs.find(
            (tab) => tab.tabIndex === activeTabIndex
          );
          if (currentTab?.jobId && currentTab.jobId !== activeJobId) {
            setActiveJobId(currentTab.jobId);
            console.log(
              `JobId mis à jour pour l'onglet actif: ${currentTab.jobId}`
            );
          }
          resolve(activeTabIndex);
        } else {
          // Cas par défaut si aucun onglet n'existe
          setActiveTabIndex(1);
          setActiveJobId(null);
          resolve(1);
        }
      }, 1500); // Délai de 1.5 secondes
    });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.MAIN_API_URL}/forensics`);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data: ForensicTaskResponse = await response.json();

      if (!data.tasks) {
        setTasks([]);
        return [];
      }

      // Transformer les tâches en tableau
      const tasksArray: ForensicTask[] = Object.entries(data.tasks).map(
        ([id, task]) => ({
          id,
          status: task.status,
          type: task.type,
          created: task.created,
          count: task.count || 0,
          size: task.size || 0,
          total_pages: task.total_pages || 0,
        })
      );

      // Trier par date de création (plus récent en premier)
      tasksArray.sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      );

      setTasks(tasksArray);

      // Mettre à jour les onglets existants avec les nouvelles données
      setTabJobs((prevTabJobs) =>
        prevTabJobs.map((tab) => {
          if (tab.jobId) {
            // Chercher la tâche correspondante dans tasksArray
            const updatedTask = tasksArray.find(
              (task) => task.id === tab.jobId
            );
            if (updatedTask) {
              return {
                ...tab,
                status: mapTaskStatusToTabStatus(updatedTask.status),
                count: updatedTask.count,
                total_pages: updatedTask.total_pages,
              };
            }
          }
          return tab;
        })
      );

      // Créer les onglets à partir des tâches pour les nouveaux jobs
      // qu'on ne connaissait pas encore
      const existingJobIds = tabJobs
        .filter((tab) => tab.jobId)
        .map((tab) => tab.jobId);

      const newTasks = tasksArray.filter(
        (task) => !existingJobIds.includes(task.id)
      );

      const newTaskTabJobs = newTasks
        .slice(0, 5 - tabJobs.length)
        .map((task, index) => ({
          tabIndex: Math.max(...tabJobs.map((t) => t.tabIndex), 0) + index + 1,
          jobId: task.id,
          status: mapTaskStatusToTabStatus(task.status),
          isNew: false,
          count: task.count,
          total_pages: task.total_pages,
        }));

      // Conserver les onglets "isNew" existants
      const existingNewTabs = tabJobs.filter((tab) => tab.isNew);

      // Fusionner les trois types d'onglets: existants mis à jour, nouveaux, et nouveaux vides
      let combinedTabs: TabJob[] = [
        ...tabJobs.filter((tab) => tab.jobId),
        ...newTaskTabJobs,
      ];

      existingNewTabs.forEach((newTab) => {
        if (!combinedTabs.some((tab) => tab.tabIndex === newTab.tabIndex)) {
          combinedTabs.push(newTab);
        }
      });

      // Limiter à un maximum de 5 onglets
      combinedTabs = combinedTabs.slice(0, 5);

      setTabJobs(combinedTabs);

      // S'assurer que l'onglet actif existe toujours dans les nouveaux onglets
      if (!combinedTabs.some((tab) => tab.tabIndex === activeTabIndex)) {
        if (combinedTabs.length > 0) {
          setActiveTabIndex(combinedTabs[0].tabIndex);
          // Mettre à jour le jobId actif si nécessaire
          if (combinedTabs[0].jobId) {
            setActiveJobId(combinedTabs[0].jobId);
          }
        }
      }

      // Mise à jour du jobId actif si l'onglet actif a changé
      const activeTab = combinedTabs.find(
        (tab) => tab.tabIndex === activeTabIndex
      );
      if (activeTab?.jobId && activeTab.jobId !== activeJobId) {
        setActiveJobId(activeTab.jobId);
        console.log(`JobId actif mis à jour: ${activeTab.jobId}`);
      }

      setError(null);
      return combinedTabs;
    } catch (err) {
      console.error('Erreur lors de la récupération des tâches:', err);
      setError('Impossible de charger les tâches forensiques');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addNewTab = (cleanupCallback?: () => void) => {
    // Exécuter le callback de nettoyage si fourni
    if (cleanupCallback) cleanupCallback();

    // Trouver le prochain index disponible
    const maxIndex =
      tabJobs.length > 0 ? Math.max(...tabJobs.map((tab) => tab.tabIndex)) : 0;
    const nextTabIndex = maxIndex + 1;

    // Créer un nouvel onglet clairement marqué comme nouveau
    const newTab: TabJob = {
      tabIndex: nextTabIndex,
      isNew: true,
      status: 'idle',
    };

    // Mettre à jour la liste des onglets
    setTabJobs([...tabJobs, newTab]);

    // Activer immédiatement le nouvel onglet
    setActiveTabIndex(nextTabIndex);
    // Réinitialiser explicitement jobId à null
    setActiveJobId(null);
  };

  const handleTabChange = (tabIndex: number) => {
    console.log(`⚡ Changement vers l'onglet ${tabIndex}`);
    setActiveTabIndex(tabIndex);

    // Récupérer le TabJob complet pour le nouvel onglet
    const selectedTab = tabJobs.find((tab) => tab.tabIndex === tabIndex);

    // Vérification explicite de l'état isNew
    const isNewTab = selectedTab?.isNew === true;

    // Log complet de l'état de l'onglet
    console.log('⚡ Changement onglet - État complet:', {
      activeTabIndex: tabIndex,
      isNew: isNewTab,
      hasJobId: Boolean(selectedTab?.jobId),
      ongletComplet: selectedTab,
    });

    // Mettre à jour l'état avec le nouveau jobId
    if (selectedTab?.jobId) {
      setActiveJobId(selectedTab.jobId);
      console.log(`JobId mis à jour: ${selectedTab.jobId}`);
    } else {
      setActiveJobId(null);
      console.log(
        `JobId effacé (onglet ${isNewTab ? 'nouveau' : 'sans job associé'})`
      );
    }

    if (isNewTab) {
      console.log("Initialisation d'un nouvel onglet");
    }
  };

  const deleteAllTasks = async () => {
    try {
      const response = await fetch(
        `${process.env.MAIN_API_URL}/forensics/tasks/delete-all`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Erreur lors de la suppression de toutes les tâches');
      }
      // eslint-disable-next-line @typescript-eslint/no-shadow
    } catch (error) {
      console.error('Erreur lors de la communication avec le serveur:', error);
    }
  };

  // Fonction pour supprimer un onglet
  const deleteTab = async (tabIndex: number) => {
    // Trouver l'onglet à supprimer
    const tabToDelete = tabJobs.find((tab) => tab.tabIndex === tabIndex);

    // Si l'onglet a un jobId associé, supprimer la tâche forensique
    if (tabToDelete?.jobId) {
      try {
        // Appeler l'API backend pour supprimer les données de la tâche
        const response = await fetch(
          `${process.env.MAIN_API_URL}/forensics/delete/${tabToDelete.jobId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.error(
            `Erreur lors de la suppression de la tâche ${tabToDelete.jobId}:`,
            await response.text()
          );
        }
        setTabJobs((prevTabJobs) =>
          prevTabJobs.filter((tab) => tab.tabIndex !== tabIndex)
        );

        // eslint-disable-next-line @typescript-eslint/no-shadow
      } catch (error) {
        console.error(
          'Erreur lors de la communication avec le serveur:',
          error
        );
      }
    }

    // Vérifier si l'onglet à supprimer est l'onglet actif
    const isActiveTab = tabIndex === activeTabIndex;

    // Supprimer l'onglet de la liste
    setTabJobs((prev) => prev.filter((tab) => tab.tabIndex !== tabIndex));

    // Si c'était l'onglet actif, sélectionner un autre onglet
    if (isActiveTab) {
      const remainingTabs = tabJobs.filter((tab) => tab.tabIndex !== tabIndex);
      if (remainingTabs.length > 0) {
        const newActiveTab = [...remainingTabs].sort(
          (a, b) => a.tabIndex - b.tabIndex
        )[0];
        setActiveTabIndex(newActiveTab.tabIndex);

        // Mettre à jour le jobId actif
        if (newActiveTab.jobId) {
          setActiveJobId(newActiveTab.jobId);
        } else {
          setActiveJobId(null);
        }
      } else {
        // Pas d'onglets restants
        setActiveTabIndex(1);
        setActiveJobId(null);
      }
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

  // Fonction utilitaire pour accéder au jobId actif
  const getActiveJobId = (): string | null => activeJobId;

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
    if (!activeJobId) {
      console.log('Aucun job associé à cet onglet');
      return null;
    }

    console.log(`Reprise du job ${activeJobId}`);

    // Appeler resumeJob avec le jobId de l'onglet actif
    return resumeCallback(activeJobId);
  };

  const getActivePaginationInfo = () => {
    const activeTask = getActiveTask();

    console.log('Informations de pagination actualisées:', {
      jobId: activeJobId,
      count: activeTask?.count || 0,
      totalPages: activeTask?.total_pages || 0,
    });

    return {
      currentPage: 1, // À gérer ailleurs
      pageSize: FORENSIC_PAGINATION_ITEMS, // Ajustez selon votre configuration
      totalPages: activeTask?.total_pages || 0,
      total: activeTask?.count || 0,
    };
  };

  return {
    tasks,
    tabJobs,
    activeTabIndex,
    activeJobId,
    loading,
    error,
    fetchTasks,
    getTaskById,
    getActiveTask,
    getActiveJobId,
    getActivePaginationInfo,
    handleTabChange,
    resumeActiveJob,
    setTabJobs,
    addNewTab,
    selectLeftmostTab,
    deleteTab,
    deleteAllTasks,
  };
}
