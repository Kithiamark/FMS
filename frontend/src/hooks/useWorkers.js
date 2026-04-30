import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useWorkers = () => {
  return useQuery({
    queryKey: ['farm-workers'],
    queryFn: async () => {
      const response = await api.get('/farm-workers/');
      return response.data;
    },
  });
};

export const useCreateWorker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/farm-workers/', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-workers'] }),
  });
};
