import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, Calendar, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const PersonalTodoList = () => {
    const STORAGE_KEY = 'fms_personal_todos';
    const [todos, setTodos] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [
                { id: '1', text: 'Morning herd milking check & milk storage cooler temp check', completed: true, date: new Date().toISOString().split('T')[0] },
                { id: '2', text: 'Replenish mineral salt licks in paddock 2', completed: false, date: new Date().toISOString().split('T')[0] },
                { id: '3', text: 'Check calf water troughs & clean bucket feeding teats', completed: false, date: new Date().toISOString().split('T')[0] }
            ];
        } catch {
            return [];
        }
    });

    const [newTodo, setNewTodo] = useState('');
    const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        } catch (e) {
            console.error('Failed to save to-dos to localStorage', e);
        }
    }, [todos]);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        const item = {
            id: Date.now().toString(),
            text: newTodo.trim(),
            completed: false,
            date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
        };
        setTodos(prev => [item, ...prev]);
        setNewTodo('');
    };

    const toggleTodo = (id) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTodo = (id) => {
        setTodos(prev => prev.filter(t => t.id !== id));
    };

    const filteredTodos = todos.filter(t => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    });

    const completedCount = todos.filter(t => t.completed).length;
    const progressPercent = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header / Progress Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Chores</span>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{todos.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Completed</span>
                    <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <span>Completion Rate</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{progressPercent}%</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div 
                            className="h-full bg-emerald-600 transition-all duration-300 dark:bg-emerald-500" 
                            style={{ width: `${progressPercent}%` }} 
                        />
                    </div>
                </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAdd} className="flex gap-2">
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Add a new farm chore or personal task (e.g. Call vet for deworming)..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                />
                <Button type="submit" disabled={!newTodo.trim()} className="shrink-0 flex items-center gap-1.5 px-5">
                    <Plus size={18} />
                    <span>Add Task</span>
                </Button>
            </form>

            {/* Filter Pills */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Filter size={15} className="text-slate-400" />
                    <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                        {['all', 'active', 'completed'].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setFilter(tab)}
                                className={`rounded-md px-3 py-1 text-xs font-bold capitalize transition ${
                                    filter === tab
                                        ? 'bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    {filteredTodos.length} {filteredTodos.length === 1 ? 'task' : 'tasks'}
                </span>
            </div>

            {/* Tasks List */}
            <div className="space-y-2">
                {filteredTodos.length ? (
                    filteredTodos.map((todo) => (
                        <div
                            key={todo.id}
                            className={`group flex items-center justify-between rounded-xl border p-4 shadow-sm transition ${
                                todo.completed
                                    ? 'border-slate-200 bg-slate-50/70 text-slate-400 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-500'
                                    : 'border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                                <button
                                    type="button"
                                    onClick={() => toggleTodo(todo.id)}
                                    className="shrink-0 text-slate-400 transition hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400"
                                    title={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                                >
                                    {todo.completed ? (
                                        <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <Square size={20} />
                                    )}
                                </button>
                                <span className={`text-sm select-none break-words ${todo.completed ? 'line-through' : 'font-medium'}`}>
                                    {todo.text}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                                    <Calendar size={13} />
                                    <span>{todo.date}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => deleteTodo(todo.id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 transition p-1 rounded-lg"
                                    title="Delete task"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500">
                        <CheckSquare size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-semibold">No tasks found</p>
                        <p className="text-xs mt-1">Add your daily farming chores above to stay on track.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
