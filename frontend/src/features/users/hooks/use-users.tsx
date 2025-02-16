import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { useAuth } from '@/providers/auth-context';

import { User } from '../lib/props';

type UserRecord = User[];

export default function useUsersAPI() {
  const queryKey = ['users'];
  const client = useQueryClient();
  const baseUrl = `${process.env.BACK_API_URL}/users`;
  const { sessionId } = useAuth();

  const headers = { Authorization: `X-Session-Id ${sessionId}` };

  const query = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    queryFn: () =>
      axios.get<UserRecord>(baseUrl, { headers }).then(({ data }) => data),
  });

  const handleMutationError = (
    context: { previous: UserRecord } | undefined
  ) => {
    if (context?.previous) {
      client.setQueryData(queryKey, context.previous);
    }
  };

  const { mutateAsync: insert } = useMutation({
    mutationFn: async (formData: User) => {
      const { data: created } = await axios.post<User>(baseUrl, formData, {
        headers,
      });
      return created;
    },
    onMutate: async (formData: User) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<UserRecord>(queryKey);

      client.setQueryData<UserRecord>(queryKey, (old) => [
        ...(old || []),
        formData,
      ]);

      return { previous };
    },
    onSuccess: async (savedUser: User) => {
      client.setQueryData<UserRecord>(
        queryKey,
        (old) =>
          old?.map((user) =>
            user.user === savedUser.user ? savedUser : user
          ) || [savedUser]
      );
      client.invalidateQueries({ queryKey });
    },
    onError: handleMutationError,
  });

  const { mutate: edit } = useMutation({
    mutationFn: async (data: User) => {
      const { data: updated } = await axios.put<User>(
        `${baseUrl}/${data.user}`,
        data,
        { headers }
      );
      return updated;
    },
    onMutate: async (data: User) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<UserRecord>(queryKey);

      if (!previous) return { previous };

      client.setQueryData<UserRecord>(
        queryKey,
        (old) =>
          old?.map((user) =>
            user.user === data.user ? { ...user, ...data } : user
          ) || []
      );

      return { previous };
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey });
    },
    onError: handleMutationError,
  });

  const { mutate: remove } = useMutation({
    mutationFn: (data: User) =>
      axios.delete<UserRecord>(`${baseUrl}/${data.user}`, { headers }),
    onMutate: async (data: User) => {
      await client.cancelQueries({ queryKey });

      const previous = client.getQueryData<UserRecord>(queryKey);

      client.setQueryData<UserRecord>(
        queryKey,
        (old) => old?.filter((user) => user.user !== data.user) || []
      );

      return { previous };
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey });
    },
    onError: handleMutationError,
  });

  const getAll = () => query.data || [];

  return { query, getAll, insert, edit, remove };
}
