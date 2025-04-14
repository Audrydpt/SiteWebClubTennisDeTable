/* eslint-disable no-console,react-hooks/exhaustive-deps */
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
        return 'running';
      case 'REVOKED':
      case 'FAILURE':
        return 'error';
      default:
        return 'idle';
    }
  };

  // Récupération des tâches depuis l'API
  const fetchTasks = async () => {
    try {
      setLoading(true);

      // Utilisation de fetch au lieu d'axios
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

      // Association des 5 tâches les plus récentes aux onglets
      const newTabJobs: TabJob[] = Array(5)
        .fill(0)
        .map((_, index) => ({
          tabIndex: index + 1,
          jobId: tasksArray[index]?.id,
          status: tasksArray[index]
            ? mapTaskStatusToTabStatus(tasksArray[index].status)
            : 'idle',
        }));

      setTabJobs(newTabJobs);

      // Logs pour vérifier l'association des jobs aux tabs
      console.log('Tâches forensics chargées:', tasksArray.length);
      newTabJobs.forEach((tab) => {
        console.log(
          `Tab ${tab.tabIndex}: Job ID = ${tab.jobId || 'aucun'}, Status = ${tab.status}`
        );
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

  // Changement d'onglet actif
  const handleTabChange = (tabIndex: number) => {
    setActiveTabIndex(tabIndex);
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

    // Rafraîchissement toutes les 30 secondes
    const interval = setInterval(fetchTasks, 30000);

    return () => clearInterval(interval);
  }, []);

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
  };
}
