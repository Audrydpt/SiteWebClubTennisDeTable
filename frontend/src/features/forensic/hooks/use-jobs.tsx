/* eslint-disable no-console,react-hooks/exhaustive-deps,@typescript-eslint/no-explicit-any,no-plusplus */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Number of maximum results to keep
const FORENSIC_PAGINATION_ITEMS = parseInt(
  process.env.FORENSIC_PAGINATION_ITEMS || '12',
  10
);

export enum ForensicTaskStatus {
  PENDING = 'PENDING', // Tâche créée, pas encore préparée pour l'exécution
  RECEIVED = 'RECEIVED', // Tâche reçue, prête à être exécutée
  STARTED = 'STARTED', // Tâche en cours d'exécution
  SUCCESS = 'SUCCESS', // Tâche terminée avec succès
  FAILURE = 'FAILURE', // Tâche échouée
  REVOKED = 'REVOKED', // Tâche annulée
  RETRY = 'RETRY', // Tâche en cours de nouvelle tentative après échec
}
export function isForensicTaskCompleted(status: ForensicTaskStatus): boolean {
  return (
    status === ForensicTaskStatus.SUCCESS ||
    status === ForensicTaskStatus.REVOKED ||
    status === ForensicTaskStatus.FAILURE
  );
}

export interface ForensicTask {
  id?: string;
  status: ForensicTaskStatus;
  type: string;
  created: string;
  count: number;
  size: number;
  total_pages: number;
}

export interface ForensicTaskResponse {
  tasks: {
    [key: string]: ForensicTask;
  };
}

export interface TabJob {
  jobId?: string;
  status: ForensicTaskStatus;
  isNew?: boolean;
}

export default function useJobs() {
  const [tasks, setTasks] = useState<ForensicTask[]>([]);
  const [tabJobs, setTabJobs] = useState<TabJob[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { taskId: activeJobId } = useParams();

  const setActiveJobId = (jobId?: string) => {
    if (jobId === activeJobId) return;
    console.warn(`JobId mis à jour: ${jobId}`);

    if (jobId) {
      navigate(`/forensic/${jobId}`);
    } else {
      navigate('/forensic');
    }
  };

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

      // Mettre à jour les onglets en une seule opération fonctionnelle
      setTabJobs((prevTabJobs) => {
        // 1. Mettre à jour les tabs existants
        const updatedExistingTabs = prevTabJobs.map((tab) => {
          if (!tab.jobId) return tab;
          const updatedTask = tasksArray.find((t) => t.id === tab.jobId);
          return updatedTask ? { ...tab, ...updatedTask } : tab;
        });

        // 2. Récupérer IDs de jobs déjà représentés
        const existingJobIds = updatedExistingTabs
          .filter((tab) => tab.jobId)
          .map((tab) => tab.jobId as string);

        // 3. Créer de nouveaux tabs pour les jobs backend non encore représentés
        const freeSlots = Math.max(0, 5 - updatedExistingTabs.length);
        const newTasks = tasksArray.filter(
          (task) => !existingJobIds.includes(task.id as string)
        );
        const newTaskTabs = newTasks.slice(0, freeSlots).map((task) => ({
          tabIndex: task.id,
          jobId: task.id,
          status: task.status,
          isNew: false,
        }));

        // 4. Conserver les onglets 'isNew' que l'utilisateur a créés
        const existingNewTabs = updatedExistingTabs.filter((tab) => tab.isNew);

        // 5. Fusionner et limiter à 5 onglets
        return [
          ...updatedExistingTabs.filter((tab) => tab.jobId),
          ...newTaskTabs,
          ...existingNewTabs,
        ].slice(0, 5);
      });

      setError(null);
      return [];
    } catch (err) {
      console.error('Erreur lors de la récupération des tâches:', err);
      setError('Impossible de charger les tâches forensiques');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addNewTab = (cleanupCallback?: () => void) => {
    if (cleanupCallback) cleanupCallback();

    // Utiliser un UUID ou un timestamp comme identifiant unique
    const nextTabIndex = crypto.randomUUID();

    const newTab: TabJob = {
      jobId: nextTabIndex,
      isNew: true,
      status: ForensicTaskStatus.PENDING,
    };

    setTabJobs([...tabJobs, newTab]);
    setActiveJobId(nextTabIndex);
  };

  const handleTabChange = (tabIndex: string) => {
    console.log(`⚡ Changement vers l'onglet ${tabIndex}`);
    setActiveJobId(tabIndex);

    const selectedTab = tabJobs.find((tab) => tab.jobId === tabIndex);

    // Vérification explicite de l'état isNew
    const isNewTab = selectedTab?.isNew === true;

    // Log complet de l'état de l'onglet
    console.log('⚡ Changement onglet - État complet:', {
      activeTabIndex: tabIndex,
      isNew: isNewTab,
      hasJobId: Boolean(selectedTab?.jobId),
      ongletComplet: selectedTab,
    });

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
  const deleteTab = async (tabIndex: string) => {
    // Trouver l'onglet à supprimer
    const tabToDelete = tabJobs.find((tab) => tab.jobId === tabIndex);

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
          prevTabJobs.filter((tab) => tab.jobId !== tabIndex)
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
    const isActiveTab = tabIndex === activeJobId;

    // Supprimer l'onglet de la liste
    setTabJobs((prev) => prev.filter((tab) => tab.jobId !== tabIndex));

    // Si c'était l'onglet actif, sélectionner un autre onglet
    if (isActiveTab) {
      const remainingTabs = tabJobs.filter((tab) => tab.jobId !== tabIndex);
      if (remainingTabs.length > 0) {
        const newActiveTab = [...remainingTabs].sort(
          (a, b) => a.jobId?.localeCompare(b.jobId || '') || 0
        )[0];
        setActiveJobId(newActiveTab.jobId);
      } else {
        setActiveJobId('');
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
    const activeTab = tabJobs.find((tab) => tab.jobId === activeJobId);
    return activeTab?.jobId ? getTaskById(activeTab.jobId) : undefined;
  };

  // Rafraîchissement périodique des tâches
  useEffect(() => {
    // Chargement initial
    fetchTasks();

    // Rafraîchissement toutes les 3 secondes
    const interval = setInterval(fetchTasks, 10000);

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
    activeTabIndex: activeJobId,
    activeJobId,
    loading,
    error,
    fetchTasks,
    getTaskById,
    getActiveTask,
    getActivePaginationInfo,
    handleTabChange,
    resumeActiveJob,
    setTabJobs,
    addNewTab,
    deleteTab,
    deleteAllTasks,
  };
}
