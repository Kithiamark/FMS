import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';

export const useAggregatorProfile = () => {
    return useQuery({
        queryKey: ['aggregatorProfile'],
        queryFn: async () => {
            const { data } = await axios.get('/aggregators/profiles/');
            return data[0]; // Assuming the user only has one profile
        },
    });
};

export const useAggregatorConnections = () => {
    return useQuery({
        queryKey: ['aggregatorConnections'],
        queryFn: async () => {
            const { data } = await axios.get('/aggregators/connections/');
            return data;
        },
    });
};

export const useMilkCollections = () => {
    return useQuery({
        queryKey: ['milkCollections'],
        queryFn: async () => {
            const { data } = await axios.get('/aggregators/collections/');
            return data;
        },
    });
};

export const useLogCollectionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (collectionData) => {
            const { data } = await axios.post('/aggregators/collections/', collectionData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['milkCollections'] });
        },
    });
};

export const useUpdateAggregatorProfileMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }) => {
            const res = await axios.patch(`/aggregators/profiles/${id}/`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aggregatorProfile'] });
        },
    });
};
