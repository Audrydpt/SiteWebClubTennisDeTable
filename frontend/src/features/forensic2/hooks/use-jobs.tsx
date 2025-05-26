/* eslint-disable no-console,react-hooks/exhaustive-deps,@typescript-eslint/no-explicit-any,no-plusplus */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createSearchFormData, formatQuery } from '../lib/format-query';
import { ForensicFormValues } from '../lib/types';

export enum ForensicTaskStatus {
  PENDING = 'PENDING', // Tâche créée, pas encore préparée pour l'exécution
  RECEIVED = 'RECEIVED', // Tâche reçue, prête à être exécutée
  STARTED = 'STARTED', // Tâche en cours d'exécution
  SUCCESS = 'SUCCESS', // Tâche terminée avec succès
  FAILURE = 'FAILURE', // Tâche échouée
  REVOKED = 'REVOKED', // Tâche annulée
  RETRY = 'RETRY', // Tâche en cours de nouvelle tentative après échec
  UNKNOWN = 'UNKNOWN', // Tâche inconnue
}
export function isForensicTaskCompleted(status: ForensicTaskStatus): boolean {
  return (
    status === ForensicTaskStatus.SUCCESS ||
    status === ForensicTaskStatus.REVOKED ||
    status === ForensicTaskStatus.FAILURE
  );
}

export interface ForensicTask {
  id: string;
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

export default function useJobs() {
  const [tasks, setTasks] = useState<ForensicTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { taskId: activeTabIndex } = useParams();
  const setActiveJobId = (jobId?: string) => {
    if (jobId === activeTabIndex) return;
    if (jobId) {
      navigate(`/forensic/${jobId}`);
    } else {
      navigate('/forensic');
    }
  };

  const { data: tasksArray, isLoading: loading } = useQuery({
    queryKey: ['forensicTasks'],
    queryFn: async () => {
      try {
        const response = await fetch(`${process.env.MAIN_API_URL}/forensics`);

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const data: ForensicTaskResponse = await response.json();

        if (!data.tasks) {
          return [];
        }
        // Transform tasks into array
        const transformedTasks: ForensicTask[] = Object.entries(data.tasks).map(
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
        return transformedTasks.sort(
          (a, b) =>
            new Date(b.created).getTime() - new Date(a.created).getTime()
        );
      } catch (err) {
        console.error('Erreur lors de la récupération des tâches:', err);
        setError('Impossible de charger les tâches forensiques');
        return [];
      }
    },
    refetchInterval: 10_000, // Refetch every 10 seconds
  });

  // Update tasks state when query data changes
  useEffect(() => {
    if (tasksArray) {
      setTasks(tasksArray);
    }
  }, [tasksArray]);

  // Update tabJobs when tasks change
  useEffect(() => {
    if (!tasksArray || tasksArray.length === 0) return;

    setTasks((prevTabJobs) => {
      // 1. Update existing tabs
      const updatedExistingTabs = prevTabJobs.map((tab) => {
        if (!tab.id) return tab;
        const updatedTask = tasksArray.find((t) => t.id === tab.id);
        return updatedTask ? { ...tab, status: updatedTask.status } : tab;
      });

      // 2. Get IDs of jobs already represented
      const existingJobIds = updatedExistingTabs
        .filter((tab) => tab.id)
        .map((tab) => tab.id as string);

      // 3. Create new tabs for backend jobs not yet represented
      const freeSlots = Math.max(0, 5 - updatedExistingTabs.length);
      const newTasks = tasksArray.filter(
        (task) => !existingJobIds.includes(task.id as string)
      );
      const newTaskTabs = newTasks.slice(0, freeSlots).map((task) => ({
        ...task,
        isNew: false,
      }));

      // 5. Merge and limit to 5 tabs
      return [
        ...updatedExistingTabs.filter((tab) => tab.id),
        ...newTaskTabs,
      ].slice(0, 5);
    });

    setError(null);
  }, [tasksArray]);

  const { mutateAsync: addNewTab } = useMutation({
    mutationFn: async (formData: ForensicFormValues) => formData,
    onMutate: async (formData: ForensicFormValues) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['forensicTasks'] });
      const previousTasks = [...tasks];
      const cachedTasks =
        queryClient.getQueryData<ForensicTask[]>(['forensicTasks']) || [];

      const searchFormData = createSearchFormData(formData);
      const queryData = formatQuery(searchFormData);
      const response = await fetch(`${process.env.MAIN_API_URL}/forensics`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryData),
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const { guid } = data;

      if (!guid) {
        throw new Error('No job ID returned from API');
      }

      // Create the new tab
      const newTab: ForensicTask = {
        id: guid,
        status: ForensicTaskStatus.PENDING,
        type: 'vehicle',
        created: new Date().toISOString(),
        count: 0,
        size: 0,
        total_pages: 0,
      };

      // Update the cache
      queryClient.setQueryData<ForensicTask[]>(
        ['forensicTasks'],
        [...cachedTasks, newTab]
      );

      // Optimistically update the UI
      setTasks([newTab, ...tasks]);
      setActiveJobId(guid);

      return { previousTasks, cachedTasks };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousTasks) {
        setTasks(context.previousTasks);
      }

      // Restore the cache
      if (context?.cachedTasks) {
        queryClient.setQueryData(['forensicTasks'], context.cachedTasks);
      }

      setError("Impossible d'ajouter un nouvel onglet");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['forensicTasks'] });
    },
  });

  const { mutateAsync: deleteAllTabs } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${process.env.MAIN_API_URL}/forensics`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de toutes les tâches');
      }
    },
    onMutate: async () => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['forensicTasks'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<ForensicTask[]>([
        'forensicTasks',
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<ForensicTask[]>(['forensicTasks'], []);

      // Set tasks and tabJobs to empty
      setTasks([]);
      setActiveJobId();

      // Return a context with the previous value
      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context we returned above
      if (context?.previousTasks) {
        queryClient.setQueryData(['forensicTasks'], context.previousTasks);
        setTasks(context.previousTasks);
      }
      setError('Impossible de supprimer les tâches forensiques');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the correct server state
      queryClient.invalidateQueries({ queryKey: ['forensicTasks'] });
    },
  });

  const { mutateAsync: deleteTab } = useMutation({
    mutationFn: async (tabIndex: string) => {
      const response = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${tabIndex}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur lors de la suppression de la tâche ${tabIndex}`
        );
      }

      return tabIndex;
    },
    onMutate: async (tabIndex: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['forensicTasks'] });

      // Get current state
      const previousTasks = queryClient.getQueryData<ForensicTask[]>([
        'forensicTasks',
      ]);
      const previousTabJobs = [...tasks];
      const tabToDelete = tasks.find((tab) => tab.id === tabIndex);

      // Optimistically update UI
      // 1. Remove tab from tabJobs
      const updatedTabJobs = tasks.filter((tab) => tab.id !== tabIndex);
      setTasks(updatedTabJobs);

      // 2. If this was the active tab, select another tab
      const isActiveTab = tabIndex === activeTabIndex;
      if (isActiveTab && updatedTabJobs.length > 0) {
        const newActiveTab = [...updatedTabJobs].sort(
          (a, b) => a.id?.localeCompare(b.id || '') || 0
        )[0];
        setActiveJobId(newActiveTab.id);
      } else if (isActiveTab) {
        setActiveJobId('');
      }

      // 3. Also update tasks list if we have a jobId
      if (tabToDelete?.id && previousTasks) {
        console.log(previousTasks);
        const updatedTasks = previousTasks.filter(
          (task) => task.id !== tabToDelete.id
        );
        queryClient.setQueryData(['forensicTasks'], updatedTasks);
        setTasks(updatedTasks);
      }

      return { previousTasks, previousTabJobs, tabIndex, isActiveTab };
    },
    onError: (_err, _variables, context) => {
      // Restore previous state
      if (context?.previousTasks) {
        queryClient.setQueryData(['forensicTasks'], context.previousTasks);
        setTasks(context.previousTasks);
      }
      if (context?.previousTabJobs) {
        setTasks(context.previousTabJobs);
      }
      if (context?.isActiveTab && context.tabIndex) {
        setActiveJobId(context.tabIndex);
      }
      setError(`Impossible de supprimer la tâche ${context?.tabIndex}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['forensicTasks'] });
    },
  });

  // Récupération d'une tâche par ID
  const getTaskById = (id?: string): ForensicTask | undefined => {
    if (!id) return undefined;
    return tasks.find((task) => task.id === id);
  };

  return {
    tasks,
    loading,
    error,
    currentTaskStatus:
      getTaskById(activeTabIndex)?.status || ForensicTaskStatus.UNKNOWN,
    addNewTab,
    deleteTab,
    deleteAllTabs,
  };
}
