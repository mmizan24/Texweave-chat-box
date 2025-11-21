import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority, User, UserRole } from '../types';

interface TaskBoardProps {
  currentUser: User;
  users: User[];
}

const TaskBoard: React.FC<TaskBoardProps> = ({ currentUser, users }) => {
  // Mock Data with dates relative to "today" for demonstration
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: '1', 
      title: 'Review Q3 Financials', 
      description: 'Check the excel sheet shared in chat.', 
      status: TaskStatus.IN_PROGRESS, 
      priority: TaskPriority.HIGH, 
      dueDate: formatDate(today),
      assignee: 'Alex Morgan' 
    },
    { 
      id: '2', 
      title: 'Update Marketing Deck', 
      description: 'Add new product slides.', 
      status: TaskStatus.TODO, 
      priority: TaskPriority.MEDIUM,
      dueDate: formatDate(nextWeek), 
      assignee: 'Sarah Connor' 
    },
    { 
      id: '3', 
      title: 'Fix Login Bug', 
      description: 'Users reporting timeout on auth.', 
      status: TaskStatus.DONE, 
      priority: TaskPriority.HIGH,
      dueDate: formatDate(yesterday),
      assignee: 'Dev Team' 
    },
    { 
      id: '4', 
      title: 'Draft Blog Post', 
      description: 'Topic: AI in workspace.', 
      status: TaskStatus.TODO, 
      priority: TaskPriority.LOW,
      dueDate: formatDate(tomorrow),
      assignee: 'John Doe' 
    },
  ]);

  const [isAdding, setIsAdding] = useState<TaskStatus | null>(null);
  const [newTaskData, setNewTaskData] = useState({ 
    title: '', 
    priority: TaskPriority.MEDIUM, 
    dueDate: '',
    assignee: '' 
  });

  const canEdit = currentUser.role !== UserRole.GUEST;
  const canDelete = currentUser.role === UserRole.ADMIN;

  const handleAddTask = (status: TaskStatus) => {
    if (!newTaskData.title.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskData.title,
      status,
      priority: newTaskData.priority,
      dueDate: newTaskData.dueDate || formatDate(new Date()),
      assignee: newTaskData.assignee || currentUser.name,
      description: ''
    };
    setTasks([...tasks, newTask]);
    setNewTaskData({ title: '', priority: TaskPriority.MEDIUM, dueDate: '', assignee: '' });
    setIsAdding(null);
  };

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    if (!canEdit) return;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const deleteTask = (taskId: string) => {
    if (!canDelete) return;
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const columns = [
    { id: TaskStatus.TODO, label: 'To Do', color: 'border-orange-400' },
    { id: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'border-blue-400' },
    { id: TaskStatus.DONE, label: 'Done', color: 'border-emerald-400' },
  ];

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.HIGH: return 'bg-red-100 text-red-700 border-red-200';
      case TaskPriority.MEDIUM: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case TaskPriority.LOW: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === TaskStatus.DONE) return false;
    return new Date(task.dueDate) < new Date(formatDate(new Date())); 
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 p-6 overflow-hidden">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Project Tasks</h2>
          <p className="text-slate-500 text-sm">
             Viewing as <span className="font-semibold text-blue-600">{currentUser.role}</span>
          </p>
        </div>
        <div className="flex -space-x-2">
           {users.slice(0, 5).map(u => (
             <img 
               key={u.id} 
               className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 object-cover" 
               src={u.avatar} 
               alt={u.name} 
               title={u.name}
             />
           ))}
           {users.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border-2 border-white">+{users.length - 5}</div>
           )}
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.id} className="flex-1 min-w-[300px] bg-slate-50 rounded-xl shadow-sm border border-slate-200 flex flex-col max-h-full">
            <div className={`p-4 border-t-4 ${col.color} rounded-t-xl bg-white flex justify-between items-center sticky top-0 z-10`}>
              <h3 className="font-semibold text-slate-700">{col.label}</h3>
              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {tasks.filter(t => t.status === col.id).map(task => {
                const overdue = isOverdue(task);
                return (
                  <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 group hover:shadow-md transition-shadow relative">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-800">{task.title}</h4>
                      {canDelete && (
                        <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <i className="fa-solid fa-times"></i>
                        </button>
                      )}
                    </div>
                    
                    {task.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>}
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {/* Priority Badge */}
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${getPriorityColor(task.priority)} font-medium uppercase`}>
                        {task.priority}
                      </span>

                      {/* Due Date Badge */}
                      {task.dueDate && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-medium
                          ${overdue ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          <i className="fa-regular fa-calendar"></i>
                          {overdue ? 'Overdue: ' : ''}{task.dueDate}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded flex items-center gap-1 max-w-[120px]">
                        <i className="fa-regular fa-user text-[10px]"></i>
                        <span className="truncate">{task.assignee}</span>
                      </span>
                      {canEdit && (
                        <div className="flex gap-1">
                          {col.id !== TaskStatus.TODO && (
                             <button onClick={() => moveTask(task.id, col.id === TaskStatus.DONE ? TaskStatus.IN_PROGRESS : TaskStatus.TODO)} className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs">
                               <i className="fa-solid fa-arrow-left"></i>
                             </button>
                          )}
                          {col.id !== TaskStatus.DONE && (
                            <button onClick={() => moveTask(task.id, col.id === TaskStatus.TODO ? TaskStatus.IN_PROGRESS : TaskStatus.DONE)} className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs">
                              <i className="fa-solid fa-arrow-right"></i>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200">
              {isAdding === col.id ? (
                <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Task title..." 
                    className="p-2 border border-slate-200 rounded text-sm focus:outline-blue-500 w-full"
                    value={newTaskData.title}
                    onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                  />
                  
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 p-2 border border-slate-200 rounded text-sm text-slate-600 focus:outline-blue-500 bg-white"
                      value={newTaskData.priority}
                      onChange={(e) => setNewTaskData({...newTaskData, priority: e.target.value as TaskPriority})}
                    >
                      <option value={TaskPriority.HIGH}>High Priority</option>
                      <option value={TaskPriority.MEDIUM}>Medium Priority</option>
                      <option value={TaskPriority.LOW}>Low Priority</option>
                    </select>
                    
                    <input 
                      type="date"
                      className="flex-1 p-2 border border-slate-200 rounded text-sm text-slate-600 focus:outline-blue-500"
                      value={newTaskData.dueDate}
                      onChange={(e) => setNewTaskData({...newTaskData, dueDate: e.target.value})}
                    />
                  </div>
                  
                  <select
                    className="w-full p-2 border border-slate-200 rounded text-sm text-slate-600 focus:outline-blue-500 bg-white"
                    value={newTaskData.assignee}
                    onChange={(e) => setNewTaskData({...newTaskData, assignee: e.target.value})}
                  >
                    <option value="">Assign to...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>

                  <div className="flex gap-2 mt-1">
                    <button onClick={() => handleAddTask(col.id)} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 font-medium">Add Task</button>
                    <button onClick={() => setIsAdding(null)} className="text-slate-500 text-xs px-3 py-1.5 hover:text-slate-700">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                {canEdit ? (
                  <button 
                    onClick={() => setIsAdding(col.id)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-dashed border-slate-300 transition-colors"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span className="text-sm font-medium">Add Task</span>
                  </button>
                ) : (
                  <div className="text-center text-xs text-slate-400 py-2 italic">
                    Read-only mode
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;