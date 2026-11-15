import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { useWorkers } from '../hooks/useWorkers';
import MainLayout from '../components/Layout/MainLayout';
import { Modal } from '../components/ui/Modal';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { CheckCircle2, Clock, Calendar, Plus, Trash2, Lock, Sparkles, ArrowRight, CheckSquare, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PersonalTodoList } from '../components/tasks/PersonalTodoList';

const WorkerTasks = () => {
    const { user } = useAuth();
    const { data: tasks = [], isLoading } = useTasks();
    const { data: workers = [] } = useWorkers();
    
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();
    const { addToast } = useToast();

    const [activeModal, setActiveModal] = useState(false);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', due_date: '' });

    const isFarmer = user?.role === 'FARMER';
    const plan = user?.farm?.subscription?.plan;
    const isEnterprise = plan === 'Enterprise' || user?.role === 'ADMIN' || user?.is_superuser;
    const [viewMode, setViewMode] = useState(isEnterprise ? 'worker_tasks' : 'todo'); // 'todo' | 'worker_tasks'

    const handleCreateTask = (e) => {
        e.preventDefault();
        if (!isEnterprise) {
            addToast('Worker task management is an Enterprise feature. Please upgrade your plan.', 'error');
            return;
        }
        createTask.mutate(taskForm, {
            onSuccess: () => {
                setActiveModal(false);
                setTaskForm({ title: '', description: '', assigned_to: '', due_date: '' });
                addToast('Task assigned successfully', 'success');
            },
            onError: (err) => {
                const errorMsg = err.response?.data?.detail 
                    || err.response?.data?.assigned_to?.[0]
                    || err.response?.data?.title?.[0]
                    || 'Failed to assign task';
                addToast(errorMsg, 'error');
            }
        });
    };

    const handleStatusUpdate = (task, newStatus) => {
        updateTask.mutate({ id: task.id, status: newStatus }, {
            onSuccess: () => addToast('Task updated', 'success'),
            onError: (err) => addToast(err.response?.data?.detail || 'Failed to update task', 'error')
        });
    };

    if (isLoading) return <MainLayout><div className="p-8">Loading tasks...</div></MainLayout>;

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with Title and Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
                            {viewMode === 'todo' ? 'Farm To-Do Checklist' : 'Daily Tasks & Worker Chores'}
                        </h1>
                        <p className="text-slate-500 text-sm">
                            {viewMode === 'todo' 
                                ? 'Your personal daily farm chore list and reminders' 
                                : isFarmer ? 'Manage and assign tasks to your workers' : 'Your assigned chores'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Tab Switcher between Personal To-Do and Worker Chores */}
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                            <button
                                type="button"
                                onClick={() => setViewMode('todo')}
                                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                                    viewMode === 'todo'
                                        ? 'bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                <CheckSquare size={14} />
                                <span>My To-Do</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('worker_tasks')}
                                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                                    viewMode === 'worker_tasks'
                                        ? 'bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                <Users size={14} />
                                <span>Worker Chores</span>
                                {!isEnterprise && (
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded">
                                        Ent
                                    </span>
                                )}
                            </button>
                        </div>

                        {viewMode === 'worker_tasks' && isFarmer && (
                            <Button 
                                onClick={() => {
                                    if (!isEnterprise) {
                                        addToast('Task assignment requires an active Enterprise subscription.', 'error');
                                        return;
                                    }
                                    setActiveModal(true);
                                }} 
                                className={`flex items-center gap-2 ${isEnterprise ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 hover:bg-slate-500 opacity-80'}`}
                            >
                                {isEnterprise ? <Plus size={18} /> : <Lock size={16} />} Assign Task
                            </Button>
                        )}
                    </div>
                </div>

                {/* VIEW 1: PERSONAL TO-DO LIST */}
                {viewMode === 'todo' && (
                    <PersonalTodoList />
                )}

                {/* VIEW 2: ENTERPRISE WORKER TASKS */}
                {viewMode === 'worker_tasks' && (
                    <div className="space-y-6">
                        {/* Enterprise Banner for non-enterprise farmers */}
                        {isFarmer && !isEnterprise && (
                            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm dark:border-amber-900/60 dark:from-amber-950/40 dark:to-orange-950/30">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <Lock size={22} />
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                Enterprise Plan Required for Multi-Worker Chore Assignment
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                                                    Enterprise
                                                </span>
                                            </h3>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                                                Assigning chores, setting due dates, tracking completion statuses, and audit logging for multiple farm workers is exclusively available to Enterprise tier members. For personal task tracking, use the <strong>My To-Do</strong> tab.
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        to="/finance"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition whitespace-nowrap"
                                    >
                                        <Sparkles size={14} />
                                        <span>Upgrade to Enterprise</span>
                                        <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        )}

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Status Columns */}
                    {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                        <div key={status} className="bg-slate-50 rounded-xl p-4 dark:bg-slate-900">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 capitalize">
                                {status.replace('_', ' ')}
                            </h3>
                            <div className="space-y-3">
                                {tasks.filter(t => t.status === status).map(task => (
                                    <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 dark:bg-slate-950 dark:border-slate-800 relative">
                                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{task.title}</h4>
                                        <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                                        
                                        <div className="flex items-center justify-between mt-4 text-xs">
                                            <div className="flex items-center gap-1 text-emerald-600">
                                                <Calendar size={14} />
                                                <span>{task.due_date || 'No Date'}</span>
                                            </div>
                                            {isFarmer && (
                                                <span className="font-medium text-slate-600 dark:text-slate-400">
                                                    Assigned to: {task.assigned_to_name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t flex gap-2">
                                            {status !== 'COMPLETED' && (
                                                <Button 
                                                    onClick={() => handleStatusUpdate(task, 'COMPLETED')} 
                                                    className="flex-1 py-1 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                >
                                                    <CheckCircle2 size={14} className="mr-1 inline" /> Complete
                                                </Button>
                                            )}
                                            {status === 'PENDING' && (
                                                <Button 
                                                    onClick={() => handleStatusUpdate(task, 'IN_PROGRESS')} 
                                                    className="flex-1 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                >
                                                    <Clock size={14} className="mr-1 inline" /> Start
                                                </Button>
                                            )}
                                            {isFarmer && (
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm(`Delete task "${task.title}"?`)) {
                                                            deleteTask.mutate(task.id, {
                                                                onSuccess: () => addToast('Task deleted successfully', 'success'),
                                                                onError: (err) => addToast(err.response?.data?.detail || 'Could not delete task', 'error')
                                                            });
                                                        }
                                                    }} 
                                                    className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                                    title="Delete task"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                    </div>
                )}
            </div>

            <Modal isOpen={activeModal} onClose={() => setActiveModal(false)} title="Assign New Task">
                <form onSubmit={handleCreateTask} className="space-y-4">
                    <input 
                        required 
                        placeholder="Task Title (e.g. Morning Milking)" 
                        value={taskForm.title} 
                        onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                        className="w-full rounded-xl border px-3 py-2"
                    />
                    <textarea 
                        placeholder="Instructions or details..." 
                        value={taskForm.description} 
                        onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                        className="w-full rounded-xl border px-3 py-2 h-24"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <select 
                            required 
                            value={taskForm.assigned_to} 
                            onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})}
                            className="rounded-xl border px-3 py-2"
                        >
                            <option value="">Select Worker</option>
                            {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.full_name}</option>
                            ))}
                        </select>
                        <CustomDatePicker
                            value={taskForm.due_date}
                            onChange={(date) => setTaskForm({...taskForm, due_date: date})}
                            placeholder="Select Due Date"
                        />
                    </div>
                    <Button type="submit" disabled={createTask.isPending} className="w-full">Assign Task</Button>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default WorkerTasks;
