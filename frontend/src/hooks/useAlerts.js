import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await api.get('/alerts/');
      return response.data;
    },
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/alerts/', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });
};

export const useMarkAlertRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/alerts/${id}/read/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });
};
