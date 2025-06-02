/* eslint-disable no-console */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ForensicResult, SourceProgress } from '../lib/types';
import { useJobsContext } from '../providers/job-context';
import { ForensicTaskStatus, isForensicTaskCompleted } from './use-jobs';

interface PaginatedResponse {
  results: ForensicResult[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    pageSize: number;
  };
}

export default function useSearch() {
  const { taskId } = useParams();
  const queryClient = useQueryClient();
  const { tasks, currentTaskStatus } = useJobsContext();

  const [order, setOrder] = useState<{
    by: 'score' | 'date';
    direction: 'asc' | 'desc';
  }>({
    by: 'score',
    direction: 'desc',
  });
  const [progress, setProgress] = useState<Record<string, SourceProgress>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const wsRef = useRef<{ ws?: WebSocket; taskId?: string } | null>(null);
  const [wsCounter, setWsCounter] = useState(0);

  // page data
  const { data, isLoading, error } = useQuery({
    queryKey: ['forensic-results', taskId, currentPage, order],
    enabled: !!taskId,
    refetchInterval: () => {
      if (isForensicTaskCompleted(currentTaskStatus)) return false;
      return 5000;
    },
    staleTime: 5000,
    queryFn: async (): Promise<PaginatedResponse | null> => {
      if (!taskId) throw new Error('No task ID provided');

      const response = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${taskId}/by-${order.by}?page=${currentPage}&desc=${order.direction === 'desc' ? 'true' : 'false'}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.status}`);
      }

      const valueData: PaginatedResponse = await response.json();

      return {
        ...valueData,
        results: valueData.results.map(
          (result) =>
            ({
              ...result,
              timestamp: new Date(result.timestamp),
              imageData: `${process.env.MAIN_API_URL}/forensics/${taskId}/frames/${result.frame_uuid}`,
            }) as ForensicResult
        ),
      };
    },
  });

  const { mutate: addResult } = useMutation({
    onMutate: (newResult: ForensicResult) => {
      const cached =
        queryClient.getQueryData<PaginatedResponse>([
          'forensic-results',
          taskId,
          currentPage,
          order,
        ]) ||
        ({
          results: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            total: 0,
            pageSize: 12,
          },
        } as PaginatedResponse);

      const currentResults = cached.results;
      let updatedResults: ForensicResult[] | undefined;

      // only the first page is updated when a new result is added
      if (currentPage === 1) {
        const lastResult = currentResults[currentResults.length - 1];

        if (order.by === 'score') {
          if (order.direction === 'desc') {
            if (
              currentResults.length < 12 ||
              (lastResult && newResult.score > lastResult.score)
            ) {
              updatedResults = [...currentResults, newResult];
              updatedResults.sort((a, b) => b.score - a.score);
              updatedResults = updatedResults.slice(0, 12);
            }
          }
          if (order.direction === 'asc') {
            if (
              currentResults.length < 12 ||
              (lastResult && newResult.score < lastResult.score)
            ) {
              updatedResults = [...currentResults, newResult];
              updatedResults.sort((a, b) => a.score - b.score);
              updatedResults = updatedResults.slice(0, 12);
            }
          }
        }
        if (order.by === 'date') {
          if (order.direction === 'desc') {
            if (
              currentResults.length < 12 ||
              (lastResult && newResult.timestamp > lastResult.timestamp)
            ) {
              updatedResults = [...currentResults, newResult];
              updatedResults.sort(
                (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
              );
              updatedResults = updatedResults.slice(0, 12);
            }
          }
          if (order.direction === 'asc') {
            if (
              currentResults.length < 12 ||
              (lastResult && newResult.timestamp < lastResult.timestamp)
            ) {
              updatedResults = [...currentResults, newResult];
              updatedResults.sort(
                (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
              );
              updatedResults = updatedResults.slice(0, 12);
            }
          }
        }
      }

      console.log('Updating the cache');
      queryClient.setQueryData<PaginatedResponse>(
        ['forensic-results', taskId, currentPage, order],
        {
          ...cached,
          results: updatedResults || cached.results,
          pagination: {
            ...cached.pagination,
            totalPages: Math.ceil(
              (cached.pagination.total + 1) / cached.pagination.pageSize
            ),
            total: cached.pagination.total + 1,
          },
        }
      );
    },
  });

  const updatedProgress = (sourceId: string, newProgress: SourceProgress) => {
    setProgress((prev) => ({ ...prev, [sourceId]: newProgress }));
  };

  // on task changed, close the websocket and open a new one
  useEffect(() => {
    // if the task is the same, do nothing
    if (wsRef.current?.taskId === taskId) {
      console.log('Task is the same, do nothing');
      return;
    }

    // the task changed, close the previous websocket
    if (wsRef.current) {
      wsRef.current.ws?.close();
      wsRef.current = null;
      setCurrentPage(1);
      setProgress({});
      setOrder({ by: 'score', direction: 'desc' });
      console.log('WebSocket closed and reset');
    }

    if (currentTaskStatus === ForensicTaskStatus.UNKNOWN) {
      console.log('Task is unknown, do nothing');
      return;
    }
    if (isForensicTaskCompleted(currentTaskStatus)) {
      console.log('Task is completed, do nothing');
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    setProgress(task?.progress || {});

    const ws = new WebSocket(`${process.env.MAIN_API_URL}/forensics/${taskId}`);
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const json = JSON.parse(event.data);
        if (json.type === 'progress') {
          const newProgress: SourceProgress = {
            sourceId: json.sourceId ?? json.guid,
            progress: json.progress,
            timestamp: json.timestamp,
            startTime: json.startTime,
          };

          updatedProgress(json.sourceId, newProgress);
        } else if (json.type === 'detection') {
          const imageUrl = `${process.env.MAIN_API_URL}/forensics/${taskId}/frames/${json.frame_uuid}`;

          const newResult: ForensicResult = {
            id: json.frame_uuid,
            imageData: imageUrl,
            timestamp: new Date(json.timestamp),
            score: json.score ?? 0,
            attributes: json.attributes ?? {},
            cameraId: json.cameraId ?? 'unknown',
          };

          console.log('Adding result to the page', newResult);
          addResult(newResult);
        }
      }
    };
    ws.onclose = (event) => {
      console.log('WebSocket closed', event, wsRef.current?.taskId, taskId);

      if (wsRef.current?.taskId === taskId) {
        console.log('Something went wrong, the taskId is the same');
        console.log('I guess I need to restart the websocket');
        wsRef.current = null;
        setWsCounter((prev) => prev + 1);
      } else {
        console.log("I guess it's a normal close, do nothing");
      }
    };

    wsRef.current = { ws, taskId };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, currentTaskStatus, wsCounter]);

  return {
    results: data?.results || [],
    totalPages: data?.pagination.totalPages || 1,
    currentPage,
    setCurrentPage,
    isLoading,
    error,
    progress,
    order,
    setOrder,
  };
}
