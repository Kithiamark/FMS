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

export const useUpdateWorker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const response = await api.patch(`/farm-workers/${id}/`, payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-workers'] }),
  });
};

export const useDeleteWorker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/farm-workers/${id}/`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm-workers'] }),
  });
};
