import React, { useEffect, useState } from 'react';
import { fetchDailyTasks, updateTaskProgress, addTaskNote, deleteTask, deleteAllTasks } from '../../services/apiService';
import { Task } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Clock, PlayCircle, CheckCircle, MessageSquare, AlertCircle, X, Calendar, User, Send, Trash2 } from 'lucide-react';

export const DailyTasks = ({ filterUserId }: { filterUserId?: string }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // 🔴 التعديل هنا: قراءة الصلاحية بشكل فوري وقوي من الذاكرة
  const currentRole = user?.role || localStorage.getItem('userRole');
  const isOwner = currentRole?.toLowerCase() === 'owner';
  const isManager = currentRole?.toLowerCase() === 'manager';

  useEffect(() => {
    loadTasks();
  }, [filterUserId, user]);

  const loadTasks = async () => {
    setLoading(true);
    // الأونر والمدير يرى كل المهام (إذا لم يكن هناك فلتر لموظف محدد)
    const phoneToFetch = (isOwner || isManager) && !filterUserId 
      ? undefined 
      : (filterUserId || user?.phone);
      
    const data = await fetchDailyTasks(phoneToFetch);
    setTasks(data);
    setLoading(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }
    await updateTaskProgress(taskId, newStatus);
    loadTasks();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !noteContent.trim()) return;
    setNoteLoading(true);
    const success = await addTaskNote(selectedTask.id, noteContent, user?.name || 'مستخدم');
    if (success) {
      setNoteContent('');
      loadTasks();
      const updatedNotes = [...(selectedTask.notes || []), { id: Date.now().toString(), content: noteContent, author: user?.name || 'مستخدم', created_at: new Date().toISOString() }];
      setSelectedTask({ ...selectedTask, notes: updatedNotes });
    }
    setNoteLoading(false);
  };

  // مسح مهمة واحدة
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('هل أنت متأكد من مسح هذه المهمة نهائياً؟')) {
      const success = await deleteTask(taskId);
      if (success) {
        setSelectedTask(null);
        loadTasks();
      }
    }
  };

  // مسح كل المهام
  const handleDeleteAllTasks = async () => {
    if (window.confirm('تحذير خطير: هل أنت متأكد من مسح جميع المهام من النظام بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setLoading(true);
      const success = await deleteAllTasks();
      if (success) {
        alert('تم مسح جميع المهام بنجاح.');
        loadTasks();
      } else {
        alert('حدث خطأ أثناء المسح.');
        setLoading(false);
      }
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'Pending');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const isOverdue = (dateString: string) => new Date(dateString) < new Date();

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const overdue = task.status !== 'Completed' && isOverdue(task.due_date);
    return (
      <div 
        onClick={() => setSelectedTask(task)}
        className={`bg-white p-4 rounded-xl border-l-4 shadow-sm cursor-pointer hover:shadow-md transition-all
          ${task.status === 'Pending' ? 'border-gray-300' : task.status === 'In Progress' ? 'border-blue-500' : 'border-green-500'}
          ${overdue ? 'border-r-4 border-r-red-500 bg-red-50' : ''}
        `}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-[#1a2a3a] text-sm line-clamp-2">{task.title}</h4>
          {overdue && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse shrink-0" />}
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-1"><User size={12}/> {task.assigned_to_name || task.assigned_to}</div>
          <div className={`flex items-center gap-1 font-num ${overdue ? 'text-red-600 font-bold' : ''}`}>
            <Calendar size={12}/> {new Date(task.due_date).toLocaleDateString('ar-SA')}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center"><div className="animate-spin w-8 h-8 border-4 border-[#c5a059] border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="font-tajawal h-full flex flex-col" dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#1a2a3a] flex items-center gap-2">
          <CheckCircle className="text-[#c5a059]" /> لوحة المهام (Kanban)
        </h2>
        
        {/* 🔴 زر مسح الكل للأونر (يظهر فقط إذا كان هناك مهام) 🔴 */}
        {isOwner && tasks.length > 0 && (
          <button 
            onClick={handleDeleteAllTasks}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-4 py-2 rounded-lg transition-all text-sm font-bold border border-red-200 hover:border-red-500"
          >
            <Trash2 size={16} /> مسح كل المهام
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="bg-gray-100 rounded-2xl p-4 min-h-[500px]">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2"><Clock size={18} /> قيد الانتظار ({pendingTasks.length})</h3>
          <div className="space-y-3">{pendingTasks.map(task => <TaskCard key={task.id} task={task} />)}</div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 min-h-[500px]">
          <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-200 pb-2"><PlayCircle size={18} /> قيد التنفيذ ({inProgressTasks.length})</h3>
          <div className="space-y-3">{inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)}</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 min-h-[500px]">
          <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2 border-b border-green-200 pb-2"><CheckCircle size={18} /> مكتملة ({completedTasks.length})</h3>
          <div className="space-y-3">{completedTasks.map(task => <TaskCard key={task.id} task={task} />)}</div>
        </div>
      </div>

      {/* نافذة تفاصيل المهمة */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-[#1a2a3a] p-4 flex justify-between items-center text-white">
              <h3 className="font-bold truncate pr-4">{selectedTask.title}</h3>
              <div className="flex items-center gap-3 shrink-0">
                
                {/* 🔴 زر مسح مهمة واحدة للأونر 🔴 */}
                {isOwner && (
                  <button onClick={() => handleDeleteTask(selectedTask.id)} title="حذف المهمة نهائياً" className="bg-red-500/20 hover:bg-red-500 text-white p-2 rounded-lg transition-colors flex items-center">
                    <Trash2 size={16} />
                  </button>
                )}
                
                <button onClick={() => setSelectedTask(null)} className="hover:text-red-400 transition-colors"><X size={24} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block text-xs">مُسندة إلى:</span><strong className="text-[#1a2a3a]">{selectedTask.assigned_to_name || selectedTask.assigned_to}</strong></div>
                <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block text-xs">موعد التسليم:</span><strong className="text-red-600 font-num">{new Date(selectedTask.due_date).toLocaleString('ar-SA')}</strong></div>
                <div className="bg-gray-50 p-3 rounded-lg col-span-2"><span className="text-gray-500 block text-xs mb-1">التفاصيل:</span><p className="text-gray-800 whitespace-pre-wrap">{selectedTask.description || 'لا توجد تفاصيل'}</p></div>
              </div>

              <div className="flex gap-2 mb-8 border-b pb-6">
                {selectedTask.status === 'Pending' && <button onClick={() => handleStatusChange(selectedTask.id, 'In Progress')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold">البدء في التنفيذ</button>}
                {selectedTask.status === 'In Progress' && <button onClick={() => handleStatusChange(selectedTask.id, 'Completed')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold">إنهاء المهمة</button>}
                {selectedTask.status === 'Completed' && <div className="flex-1 bg-green-100 text-green-800 py-2 rounded-lg font-bold text-center">تم إنجاز المهمة ✅</div>}
              </div>

              <div>
                <h4 className="font-bold text-[#1a2a3a] mb-4 flex items-center gap-2"><MessageSquare size={18} /> الملاحظات</h4>
                <div className="space-y-3 mb-4">
                  {selectedTask.notes?.map(note => (
                    <div key={note.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <strong className="text-xs text-[#c5a059]">{note.author}</strong>
                        <span className="text-[10px] text-gray-400 font-num">{new Date(note.created_at).toLocaleString('ar-SA')}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input type="text" placeholder="اكتب تحديثاً..." className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#c5a059] text-sm" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
                  <button disabled={noteLoading || !noteContent.trim()} type="submit" className="bg-[#1a2a3a] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50">
                    {noteLoading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <Send size={18} />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};