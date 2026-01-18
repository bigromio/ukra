
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

export const DailyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    // In a real scenario, filter by user.id if not admin
    const { data } = await supabase.from('tasks').select('*').order('is_critical', { ascending: false });
    if (data) setTasks(data as Task[]);
    setLoading(false);
  };

  const toggleTask = async (task: Task) => {
    // Optimistic Update
    const newStatus = !task.is_completed;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t));

    const { error } = await supabase.from('tasks').update({ is_completed: newStatus }).eq('id', task.id);
    
    if (newStatus && !error && user) {
        // Increment Points logic would happen here or via DB Trigger
        // For UI feedback:
        console.log(`Earned ${task.points_value} points!`);
    }
  };

  if (loading) return <div className="p-4">Loading tasks...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-num font-bold text-ukra-navy text-lg">
           <span className="text-ukra-gold border-b-2 border-ukra-gold pb-1">المهام اليومية</span>
        </h3>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
           {tasks.filter(t => t.is_completed).length} / {tasks.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <div 
            key={task.id}
            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md flex items-start gap-3
              ${task.is_completed ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-gray-100'}
              ${task.is_critical && !task.is_completed ? 'border-r-4 border-r-red-500' : 'border-r-4 border-r-ukra-navy'}
            `}
            onClick={() => toggleTask(task)}
          >
            <div className={`mt-1 ${task.is_completed ? 'text-green-500' : 'text-gray-300'}`}>
               {task.is_completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
            </div>
            
            <div className="flex-1">
               <div className="flex justify-between items-start">
                  <h4 className={`font-bold text-sm ${task.is_completed ? 'line-through text-gray-400' : 'text-ukra-navy'}`}>
                    {task.title}
                  </h4>
                  {task.is_critical && !task.is_completed && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
               </div>
               <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-num">
                    +{task.points_value} نقطة
                  </span>
               </div>
            </div>
          </div>
        ))}
      </div>
      
      {tasks.length === 0 && (
        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
           No tasks assigned for today.
        </div>
      )}
    </div>
  );
};
