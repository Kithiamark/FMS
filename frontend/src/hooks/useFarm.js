import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useFarms = () => {
  return useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const response = await api.get('/farms/');
      return response.data;
    },
  });
};

export const useUpdateFarm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/farms/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
    },
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: (data) => api.patch('/auth/me/', data),
  });
};
