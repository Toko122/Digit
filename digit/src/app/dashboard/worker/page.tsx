'use client';

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Calendar, 
  Clock, 
  Loader2, 
  ChevronRight, 
  Image as ImageIcon,
  Sparkles,
  Briefcase,
  Layers,
  CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { useCallback } from 'react';

interface Assignment {
  id: string;
  task_id: string;
  manager_id: string;
  worker_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  assigned_at: string;
  responded_at: string | null;
  task_title: string;
  task_description: string;
  task_status: string;
  task_priority: string | null;
  business_name: string;
  logo_url: string | null;
  manager_name: string;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string | null;
  created_at: string;
  business_name: string;
  images: string[];
}

export default function WorkerDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');

  // Detail Drawer state
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch('/api/assignments');
      const data = await res.json();
      if (data.success) {
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('შემოთავაზებების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchAssignments();
    };
    init();
  }, [fetchAssignments]);

  const handleOpenDrawer = async (taskId: string) => {
    setLoadingDetail(true);
    setIsDrawerOpen(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTask(data.task);
      }
    } catch (err) {
      console.error(err);
      toast.error('დეტალების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Respond to assignment (Accept/Reject)
  const handleResponse = async (id: string, status: 'accepted' | 'rejected', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        if (status === 'accepted') {
          toast.success('შემოთავაზება მიღებულია! სამუშაო დაწყებულია.');
        } else {
          toast.info('შემოთავაზება უარყოფილია');
        }
        fetchAssignments();
      } else {
        toast.error(data.error || 'მოქმედება ვერ შესრულდა');
      }
    } catch (err) {
      console.error(err);
      toast.error('კავშირის შეცდომა');
    }
  };

  // Mark task as completed
  const handleCompleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('დავალება წარმატებით დასრულდა! მენეჯერი და დამკვეთი მიიღებენ შეტყობინებას.');
        fetchAssignments();
      } else {
        toast.error(data.error || 'დასრულება ვერ მოხერხდა');
      }
    } catch (err) {
      console.error(err);
      toast.error('კავშირის შეცდომა');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  // Filter assignments based on tabs
  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const activeAssignments = assignments.filter(a => a.status === 'accepted' && a.task_status === 'in_progress');
  const historyAssignments = assignments.filter(a => 
    a.status === 'rejected' || (a.status === 'accepted' && a.task_status === 'completed')
  );

  return (
    <div className="space-y-8 relative">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-800/40 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            სამუშაო დაფა
          </h1>
          <p className="text-sm text-slate-400 mt-1">მართეთ შემოთავაზებები და ატვირთეთ შესრულებული სამუშაოები</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'pending'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ახალი შემოთავაზებები
          {pendingAssignments.length > 0 && (
            <span className="ml-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingAssignments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`pb-4 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'active'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          მიმდინარე სამუშაო
          {activeAssignments.length > 0 && (
            <span className="ml-2 bg-indigo-550/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeAssignments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'history'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ისტორია
          {historyAssignments.length > 0 && (
            <span className="ml-2 bg-slate-805 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {historyAssignments.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel rounded-2xl p-6 h-48 animate-pulse flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-slate-850 rounded w-2/3" />
              </div>
              <div className="h-8 bg-slate-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : activeTab === 'pending' ? (
        // PENDING INCOMING WORK
        pendingAssignments.length === 0 ? (
          <div className="glass-panel p-16 rounded-2xl text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-900/60 rounded-full flex items-center justify-center border border-slate-800/40 text-slate-500 mb-4">
              <Briefcase className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ახალი შემოთავაზებები არ არის</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              მენეჯერებისგან ახალი სამუშაოები ჯერ არ გამოგზავნილა.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingAssignments.map((asg) => (
              <div
                key={asg.id}
                onClick={() => handleOpenDrawer(asg.task_id)}
                className="glass-panel rounded-2xl p-5 shadow-lg border border-white/5 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[230px]"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${getPriorityBadge(asg.task_priority)}`}>
                      {asg.task_priority === 'high' ? 'მაღალი' : asg.task_priority === 'medium' ? 'საშუალო' : 'დაბალი'}
                    </span>
                    <span className="text-[10px] text-slate-550 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(asg.assigned_at).toLocaleDateString('ka-GE')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{asg.task_title}</h3>
                  <p className="text-[10px] font-semibold text-indigo-400 mb-2">{asg.business_name}</p>
                  <p className="text-xs text-slate-450 line-clamp-3 leading-relaxed mb-4">
                    {asg.task_description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-800/40 pt-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleResponse(asg.id, 'rejected', e)}
                    className="py-2 px-3 border border-slate-800 hover:border-slate-700/60 hover:bg-slate-850/30 text-slate-450 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    უარყოფა
                  </button>
                  <button
                    onClick={(e) => handleResponse(asg.id, 'accepted', e)}
                    className="py-2 px-3 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    მიღება
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'active' ? (
        // ACTIVE RUNNING WORK
        activeAssignments.length === 0 ? (
          <div className="glass-panel p-16 rounded-2xl text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-900/60 rounded-full flex items-center justify-center border border-slate-800/40 text-slate-500 mb-4">
              <Layers className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">აქტიური სამუშაოები არ გაქვთ</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              თქვენ არ გაქვთ მიმდინარე აქტიური სამუშაოები.
            </p>
            <button
              onClick={() => setActiveTab('pending')}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              შემოთავაზებები
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAssignments.map((asg) => (
              <div
                key={asg.id}
                onClick={() => handleOpenDrawer(asg.task_id)}
                className="glass-panel rounded-2xl p-5 shadow-lg border border-white/5 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[230px]"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${getPriorityBadge(asg.task_priority)}`}>
                      {asg.task_priority === 'high' ? 'მაღალი' : asg.task_priority === 'medium' ? 'საშუალო' : 'დაბალი'}
                    </span>
                    <span className="text-[10px] text-violet-400 border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 rounded-full">
                      მიმდინარეობს
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{asg.task_title}</h3>
                  <p className="text-[10px] font-semibold text-indigo-400 mb-2">{asg.business_name}</p>
                  <p className="text-xs text-slate-450 line-clamp-3 leading-relaxed mb-4">
                    {asg.task_description}
                  </p>
                </div>

                <div className="border-t border-slate-800/40 pt-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleCompleteTask(asg.task_id, e)}
                    disabled={completingTaskId === asg.task_id}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {completingTaskId === asg.task_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckSquare className="h-4 w-4" />
                    )}
                    დასრულებულად მონიშვნა
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // HISTORY COMPLETED/REJECTED
        historyAssignments.length === 0 ? (
          <div className="glass-panel p-16 rounded-2xl text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-900/60 rounded-full flex items-center justify-center border border-slate-800/40 text-slate-500 mb-4">
              <Clock className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ისტორია ცარიელია</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              თქვენ ჯერ არ გაქვთ არცერთი შესრულებული ან უარყოფილი დავალება.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyAssignments.map((asg) => (
              <div
                key={asg.id}
                onClick={() => handleOpenDrawer(asg.task_id)}
                className="glass-panel rounded-2xl p-5 shadow-lg border border-white/5 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[230px]"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${getPriorityBadge(asg.task_priority)}`}>
                      {asg.task_priority === 'high' ? 'მაღალი' : asg.task_priority === 'medium' ? 'საშუალო' : 'დაბალი'}
                    </span>
                    <span className={`text-[10px] font-bold border rounded px-2 py-0.5 ${
                      asg.status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {asg.status === 'rejected' ? 'უარყოფილია' : 'დასრულებულია'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{asg.task_title}</h3>
                  <p className="text-[10px] font-semibold text-indigo-400 mb-2">{asg.business_name}</p>
                  <p className="text-xs text-slate-450 line-clamp-3 leading-relaxed mb-4">
                    {asg.task_description}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800/40 pt-4 text-[10px] text-slate-500">
                  <span>განახლდა: {new Date(asg.responded_at || asg.assigned_at).toLocaleDateString('ka-GE')}</span>
                  <span className="text-indigo-455 hover:text-indigo-350 font-bold flex items-center gap-0.5 transition-colors cursor-pointer" onClick={() => handleOpenDrawer(asg.task_id)}>
                    დეტალები
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Task Details Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-850 h-full flex flex-col shadow-2xl relative glass-panel">
            <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent" />
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-800/50">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">დავალების დეტალები</span>
                <h2 className="text-lg font-bold text-white mt-1">დეტალური ინფორმაცია</h2>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                  <p className="text-xs">იტვირთება...</p>
                </div>
              ) : selectedTask ? (
                <>
                  {/* Status & Priority Row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">სტატუსი</span>
                      <span className="text-xs font-bold text-indigo-400 border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 rounded">
                        {selectedTask.status === 'in_progress' ? 'მიმდინარეობს' : selectedTask.status === 'completed' ? 'დასრულებული' : 'მოლოდინში'}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">პრიორიტეტი</span>
                      <span className={`text-xs font-bold border rounded px-2.5 py-1 ${getPriorityBadge(selectedTask.priority)}`}>
                        {selectedTask.priority === 'high' ? 'მაღალი' : selectedTask.priority === 'medium' ? 'საშუალო' : 'დაბალი'}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">თარიღი</span>
                      <span className="text-xs font-bold text-slate-300 border border-slate-800 px-2.5 py-1 bg-slate-950/20 rounded">
                        {new Date(selectedTask.created_at).toLocaleDateString('ka-GE')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{selectedTask.title}</h3>
                    <p className="text-xs font-semibold text-indigo-400 mt-1">ბიზნესი: {selectedTask.business_name}</p>
                  </div>

                  {/* Description */}
                  <div className="bg-slate-950/40 border border-slate-800/40 p-4 rounded-xl">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedTask.description}
                    </p>
                  </div>

                  {/* Images */}
                  {selectedTask.images && selectedTask.images.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4 text-indigo-400" />
                        დავალების ფოტოები ({selectedTask.images.length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedTask.images.map((img, idx) => (
                          <a
                            key={idx}
                            href={img}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative h-20 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-all flex shadow"
                          >
                            <img src={img} alt="Visual details" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
