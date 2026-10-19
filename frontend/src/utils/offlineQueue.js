/**
 * Offline Sync Queue Utility
 * Handles storing mutations locally when network connectivity is absent
 * and replaying them when the connection is restored.
 */
import api from '../api/axios';

const QUEUE_STORAGE_KEY = 'fms_offline_queue';

export const getOfflineQueue = () => {
    try {
        const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveOfflineQueue = (queue) => {
    try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.error('Failed to save offline queue to localStorage', e);
    }
};

export const enqueueOfflineMutation = ({ endpoint, method = 'POST', data, description = 'Offline action' }) => {
    const queue = getOfflineQueue();
    const item = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        endpoint,
        method,
        data,
        description,
        timestamp: new Date().toISOString(),
        attempts: 0,
    };
    queue.push(item);
    saveOfflineQueue(queue);
    window.dispatchEvent(new CustomEvent('fms:offline-queue-changed', { detail: { count: queue.length } }));
    return item;
};

export const syncOfflineQueue = async (onItemSynced) => {
    const queue = getOfflineQueue();
    if (!queue.length) return { synced: 0, failed: 0, remaining: 0 };

    const remaining = [];
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
        try {
            if (item.method.toUpperCase() === 'POST') {
                await api.post(item.endpoint, item.data);
            } else if (item.method.toUpperCase() === 'PUT') {
                await api.put(item.endpoint, item.data);
            } else if (item.method.toUpperCase() === 'PATCH') {
                await api.patch(item.endpoint, item.data);
            } else if (item.method.toUpperCase() === 'DELETE') {
                await api.delete(item.endpoint);
            }
            synced += 1;
            if (onItemSynced) onItemSynced(item);
        } catch (error) {
            console.error(`Failed to sync queued item ${item.id}`, error);
            if (error.response?.status && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 408 && error.response.status !== 429) {
                failed += 1;
            } else {
                item.attempts += 1;
                remaining.push(item);
            }
        }
    }

    saveOfflineQueue(remaining);
    window.dispatchEvent(new CustomEvent('fms:offline-queue-changed', { detail: { count: remaining.length } }));
    return { synced, failed, remaining: remaining.length };
};
