import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useCommunityPosts = (filters = {}) => {
  return useQuery({
    queryKey: ['community-posts', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/community/posts/?${params}`);
      return response.data;
    },
  });
};

export const useCommunities = () => {
  return useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      const response = await api.get('/community/groups/');
      return response.data;
    },
  });
};

export const useCreateCommunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/community/groups/', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communities'] }),
  });
};

export const useInviteCommunityMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ communityId, payload }) => {
      const response = await api.post(`/community/groups/${communityId}/invite/`, payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communities'] }),
  });
};

export const useCreateCommunityPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/community/posts/', payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-posts'] }),
  });
};
