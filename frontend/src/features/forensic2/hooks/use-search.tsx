/* eslint-disable no-console */
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ForensicResult, SourceProgress } from '@/features/forensic/lib/types';
import { useJobsContext } from '../providers/job-context';
import { isForensicTaskCompleted } from './use-jobs';

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
  const { getTaskById, loading: tasksLoading } = useJobsContext();

  const [order, setOrder] = useState<{
    by: 'score' | 'date';
    direction: 'asc' | 'desc';
  }>({
    by: 'score',
    direction: 'desc',
  });
  const [progress, setProgress] = useState<SourceProgress[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const wsRef = useRef<WebSocket | null>(null);

  // page data
  const { data, isLoading, error } = useQuery({
    queryKey: ['forensic-results', taskId, currentPage, order],
    enabled: !!taskId,
    refetchInterval: () => {
      const task = getTaskById(taskId);
      if (!task) return false;
      if (isForensicTaskCompleted(task.status)) return false;
      return 1000;
    },
    // staleTime: 1000,
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
              imageData: `${process.env.MAIN_API_URL}/forensics/${taskId}/frames/${result.frame_uuid}`,
            }) as ForensicResult
        ),
      };
    },
  });

  const updateResults = (newResult: ForensicResult) => {
    if (data) {
      data.results.push(newResult);
    }
  };

  // on task changed, close the websocket and open a new one
  useEffect(() => {
    setCurrentPage(1);
    setProgress([]);
    setOrder({ by: 'score', direction: 'desc' });
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const task = getTaskById(taskId);
    if (!task) return;
    if (isForensicTaskCompleted(task.status)) return;

    const ws = new WebSocket(`${process.env.MAIN_API_URL}/forensics/${taskId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const json = JSON.parse(event.data);
        if (json.type === 'progress') {
          const cur = progress.find((p) => p.sourceId === json.guid);
          const tmp = progress.filter((p) => p.sourceId !== json.guid);

          const newProgress: SourceProgress = {
            sourceId: json.guid,
            progress: json.progress,
            timestamp: json.timestamp,
            startTime: cur ? cur.startTime : json.timestamp,
          };

          setProgress([...tmp, newProgress]);
        } else if (json.type === 'detection') {
          const imageUrl = `${process.env.MAIN_API_URL}/forensics/${taskId}/frames/${json.frame_uuid}`;

          const newResult: ForensicResult = {
            id: json.frame_uuid,
            imageData: imageUrl,
            timestamp: json.timestamp
              ? new Date(json.timestamp).toISOString()
              : new Date().toISOString(),
            score: json.score ?? 0,
            attributes: json.attributes ?? {},
            cameraId: json.cameraId ?? 'unknown',
          };

          updateResults(newResult);
        }
      }
    };

    ws.onerror = (event) => {
      console.error('on error', event);
    };

    wsRef.current = ws;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksLoading, taskId]);

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
