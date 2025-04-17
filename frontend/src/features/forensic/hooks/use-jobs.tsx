/* eslint-disable no-console,react-hooks/exhaustive-deps,@typescript-eslint/no-explicit-any,no-plusplus */
import { useState, useEffect } from 'react';
import forensicResultsHeap from '../lib/data-structure/heap.tsx';

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

export default function useJobs() {
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

  const selectLeftmostTab = () => {
    // Trouver l'onglet avec le plus petit tabIndex
    if (tabJobs.length > 0) {
      const leftmostTab = [...tabJobs].sort(
        (a, b) => a.tabIndex - b.tabIndex
      )[0];
      setActiveTabIndex(leftmostTab.tabIndex);

      // Si cet onglet a un jobId, le mettre dans localStorage
      if (leftmostTab.jobId) {
        localStorage.setItem('currentJobId', leftmostTab.jobId);
        console.log(`JobId mis à jour dans localStorage: ${leftmostTab.jobId}`);
      }

      return leftmostTab.tabIndex;
    }
    return 1; // Par défaut, revenir à l'onglet 1
  };

  // Dans fetchTasks de useJobs.tsx
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

      // Tri par date de création (plus récent en premier)
      tasksArray.sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      );

      setTasks(tasksArray);

      // Ne créer des onglets que pour les tâches réelles, limité à 5
      const taskTabJobs = tasksArray.slice(0, 5).map((task, index) => ({
        tabIndex: index + 1,
        jobId: task.id,
        status: mapTaskStatusToTabStatus(task.status),
      }));

      // Conserver les onglets "isNew" existants
      const existingNewTabs = tabJobs.filter((tab) => tab.isNew);

      // Fusionner les deux types d'onglets, en évitant les doublons d'index
      // Fusionner les deux types d'onglets, en évitant les doublons d'index
      let combinedTabs: TabJob[] = [...taskTabJobs];

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
        setActiveTabIndex(combinedTabs[0]?.tabIndex || 1);
      }

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

  // Dans useJobs.tsx, modifier la fonction addNewTab:

  const addNewTab = (cleanup?: () => void) => {
    console.log("Tentative d'ajout d'un nouvel onglet");

    // Nettoyer les ressources WebSocket si une fonction de nettoyage est fournie
    if (typeof cleanup === 'function') {
      console.log(
        '🧹 Nettoyage des connexions WebSocket avant création du nouvel onglet'
      );
      cleanup();
    }

    // Vérifier le nombre d'onglets existants
    if (tabJobs.length >= 5) {
      console.log("Nombre maximum d'onglets atteint (5), ajout impossible");
      return;
    }

    // Trouver le prochain index disponible
    let nextIndex = 1;
    const usedIndices = tabJobs.map((tab) => tab.tabIndex);

    // Recherche du premier index disponible entre 1 et 5
    while (usedIndices.includes(nextIndex) && nextIndex <= 5) {
      nextIndex++;
    }

    console.log('Index du nouvel onglet:', nextIndex);

    // Créer un nouvel onglet avec jobId défini comme une chaîne vide
    const newTab: TabJob = {
      tabIndex: nextIndex,
      jobId: '', // Onglet vide
      status: 'idle',
      isNew: true,
    };

    console.log('Nouvel onglet créé:', newTab);

    // Ajouter le nouvel onglet
    setTabJobs((prev) => [...prev, newTab]);

    // Réinitialiser les résultats en vidant le heap
    forensicResultsHeap.clear();

    // Supprimer le jobId du localStorage
    localStorage.removeItem('currentJobId');

    // Activer automatiquement le nouvel onglet
    setActiveTabIndex(nextIndex);
  };

  // Changement d'onglet actif
  const handleTabChange = (tabIndex: number) => {
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
    selectLeftmostTab,
  };
}
