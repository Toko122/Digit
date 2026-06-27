'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Check, 
  X, 
  UserPlus, 
  Search, 
  Calendar, 
  Loader2, 
  ChevronRight, 
  Phone,
  Sparkles,
  Inbox,
  Briefcase,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  business_id: string;
  manager_id: string | null;
  title: string;
  description: string;
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  business_name: string;
  logo_url: string | null;
  worker_id?: string | null;
  worker_name?: string | null;
  has_reviewed?: boolean;
  my_rating?: number | null;
  my_review_text?: string | null;
}

interface Worker {
  id: string;
  user_id: string;
  fullname: string;
  email: string;
  phone: string | null;
  headline?: string | null;
  availability?: string;
  rating?: number;
  location?: string | null;
  skills?: string[];
}

interface TaskDetail extends Task {
  images: string[];
  assignments: Array<{
    id: string;
    worker_id: string;
    worker_name: string;
    manager_name: string;
    status: 'pending' | 'accepted' | 'rejected';
    assigned_at: string;
    responded_at: string | null;
  }>;
}

export default function ManagerDashboard() {
  const [feedTasks, setFeedTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'my'>('feed');

  // Drawer / Assign Modal state
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [assigningTaskDetail, setAssigningTaskDetail] = useState<TaskDetail | null>(null);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [modalAvailabilityFilter, setModalAvailabilityFilter] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  // Hidden task IDs (for rejected tasks)
  const [hiddenTaskIds, setHiddenTaskIds] = useState<string[]>([]);

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTaskId, setReviewTaskId] = useState<string | null>(null);
  const [reviewWorkerId, setReviewWorkerId] = useState<string | null>(null);
  const [reviewWorkerName, setReviewWorkerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const handleOpenReviewModal = (
    taskId: string, 
    workerId: string, 
    workerName: string, 
    existingRating?: number | null, 
    existingText?: string | null, 
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setReviewTaskId(taskId);
    setReviewWorkerId(workerId);
    setReviewWorkerName(workerName);
    setReviewRating(existingRating || 5);
    setReviewText(existingText || '');
    setReviewSuccess(false);
    setIsReviewModalOpen(true);
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTaskId || !reviewWorkerId) return;
    
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: reviewTaskId,
          workerId: reviewWorkerId,
          rating: reviewRating,
          reviewText: reviewText.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewSuccess(true);
        toast.success('შეფასება წარმატებით გაიგზავნა');
        loadData();
        setTimeout(() => {
          setIsReviewModalOpen(false);
          setReviewSuccess(false);
        }, 1500);
      } else {
        toast.error(data.error || 'შეფასების გაგზავნა ვერ მოხერხდა');
      }
    } catch (err) {
      console.error(err);
      toast.error('კავშირის შეცდომა');
    } finally {
      setSubmittingReview(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch feed tasks
      const feedRes = await fetch('/api/tasks?scope=feed');
      const feedData = await feedRes.json();

      // Fetch my tasks
      const myRes = await fetch('/api/tasks?scope=my');
      const myData = await myRes.json();

      if (feedData.success) setFeedTasks(feedData.tasks || []);
      if (myData.success) setMyTasks(myData.tasks || []);
    } catch (err) {
      console.error(err);
      toast.error('მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWorkers = useCallback(async () => {
    try {
      const res = await fetch('/api/workers');
      const data = await res.json();
      if (data.success) {
        setWorkers(data.workers || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadData();
      await loadWorkers();
    };
    init();
  }, [loadData, loadWorkers]);

  const handleOpenDrawer = async (task: Task) => {
    setLoadingDetail(true);
    setIsDrawerOpen(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTask(data.task);
      }
    } catch (err) {
      console.error(err);
      toast.error('დავალების დეტალების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Manager accepts task
  const handleAcceptTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/tasks/${id}/accept`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('დავალება წარმატებით მიიღეთ');
        loadData();
      } else {
        toast.error(data.error || 'მოქმედება ვერ შესრულდა');
      }
    } catch (err) {
      console.error(err);
      toast.error('კავშირის შეცდომა');
    }
  };

  // Manager rejects task (soft-hide in feed)
  const handleRejectTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/tasks/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        setHiddenTaskIds(prev => [...prev, id]);
        toast.info('დავალება დამალულია');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open worker assignment modal
  const handleOpenAssignModal = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssigningTaskId(taskId);
    setSelectedWorkerId(null);
    setWorkerSearch('');
    setModalAvailabilityFilter('');
    setAssigningTaskDetail(null);
    setAssignmentSuccess(false);
    setIsAssignModalOpen(true);
    setLoadingTaskDetail(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      if (data.success) {
        setAssigningTaskDetail(data.task);
      }
    } catch (err) {
      console.error('Failed to load task details in modal:', err);
    } finally {
      setLoadingTaskDetail(false);
    }
  };

  // Assign worker submit
  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTaskId || !selectedWorkerId) {
      toast.error('გთხოვთ აირჩიოთ მუშა');
      return;
    }

    setSubmittingAssignment(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: assigningTaskId,
          workerId: selectedWorkerId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignmentSuccess(true);
        toast.success('დავალება წარმატებით გადაეცა მუშას');
        loadData();
        setTimeout(() => {
          setIsAssignModalOpen(false);
          setAssignmentSuccess(false);
        }, 1500);
      } else {
        toast.error(data.error || 'გადაცემა ვერ მოხერხდა');
      }
    } catch (err) {
      console.error(err);
      toast.error('კავშირის შეცდომა');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // Status style maps
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'ახალი შეკვეთა', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'assigned':
        return { label: 'მუშის მოლოდინში', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'accepted':
        return { label: 'მუშამ მიიღო', class: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
      case 'in_progress':
        return { label: 'მიმდინარეობს', class: 'bg-violet-500/10 text-violet-400 border-violet-500/20' };
      case 'completed':
        return { label: 'დასრულებული', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'cancelled':
        return { label: 'გაუქმებული', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
      default:
        return { label: status, class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  // Filter out hidden tasks from feed
  const activeFeed = feedTasks.filter(t => !hiddenTaskIds.includes(t.id));

  // Search filtered workers
  const filteredWorkers = workers.filter(w => {
    const matchesSearch = 
      w.fullname.toLowerCase().includes(workerSearch.toLowerCase()) || 
      (w.phone && w.phone.includes(workerSearch)) ||
      (w.headline && w.headline.toLowerCase().includes(workerSearch.toLowerCase())) ||
      (w.skills && w.skills.some(s => s.toLowerCase().includes(workerSearch.toLowerCase())));

    const matchesAvailability = !modalAvailabilityFilter || w.availability === modalAvailabilityFilter;

    return matchesSearch && matchesAvailability;
  });

  return (
    <div className="space-y-8 relative">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-800/40 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            პროექტების მართვა
          </h1>
          <p className="text-sm text-slate-400 mt-1">დავალებების მიღება და მუშების განაწილება ბათუმში</p>
        </div>
      </div>

      {/* Tabs selector */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('feed')}
          className={`pb-4 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'feed'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ახალი შეკვეთები (Feed)
          {activeFeed.length > 0 && (
            <span className="ml-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeFeed.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my')}
          className={`pb-4 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'my'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ჩემი პროექტები (Active)
          {myTasks.length > 0 && (
            <span className="ml-2 bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {myTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab contents */}
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
      ) : activeTab === 'feed' ? (
        // FEED LISTING
        activeFeed.length === 0 ? (
          <div className="glass-panel p-16 rounded-2xl text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-900/60 rounded-full flex items-center justify-center border border-slate-800/40 text-slate-500 mb-4">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ახალი შეკვეთები არ არის</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              ამ დროისთვის ბათუმში ახალი დავალებები არ მოიძებნება. შემოწმეთ მოგვიანებით.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeFeed.map((task) => {
              const priorityClass = getPriorityBadge(task.priority);
              return (
                <div
                  key={task.id}
                  onClick={() => handleOpenDrawer(task)}
                  className="glass-panel rounded-2xl p-5 shadow-lg border border-white/5 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[230px]"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${priorityClass}`}>
                        {task.priority === 'high' ? 'მაღალი' : task.priority === 'medium' ? 'საშუალო' : 'დაბალი'}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.created_at).toLocaleDateString('ka-GE')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{task.title}</h3>
                    <p className="text-[10px] font-semibold text-indigo-400 mb-2">{task.business_name}</p>
                    <p className="text-xs text-slate-450 line-clamp-3 leading-relaxed mb-4">
                      {task.description}
                    </p>
                  </div>

                  {/* Accept / Reject actions directly on card */}
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-800/40 pt-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleRejectTask(task.id, e)}
                      className="py-2 px-3 border border-slate-800 hover:border-slate-700/60 hover:bg-slate-850/30 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      უარყოფა
                    </button>
                    <button
                      onClick={(e) => handleAcceptTask(task.id, e)}
                      className="py-2 px-3 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      მიღება
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // MY ASSIGNED PROJECTS LISTING
        myTasks.length === 0 ? (
          <div className="glass-panel p-16 rounded-2xl text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-900/60 rounded-full flex items-center justify-center border border-slate-800/40 text-slate-500 mb-4">
              <Briefcase className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">მიღებული პროექტები არ არის</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              თქვენ ჯერ არ გაქვთ მიღებული არცერთი დავალება.
            </p>
            <button
              onClick={() => setActiveTab('feed')}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-650/90 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              შეკვეთების არხი
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTasks.map((task) => {
              const statusInfo = getStatusDetails(task.status);
              const priorityClass = getPriorityBadge(task.priority);
              
              return (
                <div
                  key={task.id}
                  onClick={() => handleOpenDrawer(task)}
                  className="glass-panel rounded-2xl p-5 shadow-lg border border-white/5 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[230px]"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${priorityClass}`}>
                        {task.priority === 'high' ? 'მაღალი' : task.priority === 'medium' ? 'საშუალო' : 'დაბალი'}
                      </span>
                      <span className={`text-[10px] font-bold border rounded px-2 py-0.5 ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{task.title}</h3>
                    <p className="text-[10px] font-semibold text-indigo-400 mb-2">{task.business_name}</p>
                    <p className="text-xs text-slate-450 line-clamp-3 leading-relaxed mb-4">
                      {task.description}
                    </p>
                  </div>

                  <div className="border-t border-slate-800/40 pt-4" onClick={(e) => e.stopPropagation()}>
                    {task.status === 'assigned' ? (
                      <button
                        onClick={(e) => handleOpenAssignModal(task.id, e)}
                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="h-4 w-4" />
                        მუშის დანიშვნა
                      </button>
                    ) : (
                      <div className="flex justify-between items-center text-[10px] text-slate-500 w-full">
                        <span>განახლდა: {new Date(task.updated_at).toLocaleDateString('ka-GE')}</span>
                        <div className="flex items-center gap-3">
                          {task.status === 'completed' && task.worker_id && (
                            task.has_reviewed ? (
                              <button
                                onClick={(e) => handleOpenReviewModal(task.id, task.worker_id!, task.worker_name!, task.my_rating, task.my_review_text, e)}
                                className="text-indigo-400 font-extrabold hover:text-indigo-350 transition-colors cursor-pointer flex items-center gap-0.5"
                              >
                                <Star className="h-3 w-3 fill-indigo-400 text-indigo-400" /> შეფასების რედაქტირება
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleOpenReviewModal(task.id, task.worker_id!, task.worker_name!, null, null, e)}
                                className="text-indigo-400 font-extrabold hover:text-indigo-350 transition-colors cursor-pointer flex items-center gap-0.5"
                              >
                                <Star className="h-3 w-3" /> შეფასება
                              </button>
                            )
                          )}
                          <span className="text-indigo-400 font-bold hover:text-indigo-350 flex items-center gap-0.5 transition-colors cursor-pointer" onClick={() => handleOpenDrawer(task)}>
                            სრული ისტორია
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            <div className="flex justify-between items-center p-5 border-b border-slate-800/40">
              <h2 className="text-base font-bold text-white">მუშის შეფასება</h2>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
                disabled={submittingReview}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reviewSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px] animate-in fade-in zoom-in-95 duration-300">
                <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
                  <Check className="h-8 w-8 stroke-[3]" />
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-bold text-white">შეფასება გაიგზავნა!</h4>
                  <p className="text-[10px] text-slate-500 mt-1">გმადლობთ გამოხმაურებისთვის</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmReview} className="p-5 flex-1 flex flex-col overflow-hidden space-y-5">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">დავალებაზე დასაქმებული მუშა</p>
                  <p className="text-sm font-bold text-white">{reviewWorkerName}</p>
                </div>

                {/* Star Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">შეფასება (Stars)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="text-slate-600 hover:text-amber-400 transition-colors duration-150 cursor-pointer"
                      >
                        <Star className={`h-8 w-8 ${s <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="space-y-1.5 flex-1 flex flex-col min-h-[140px]">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                    <label>კომენტარი (არჩევითი)</label>
                    <span className={reviewText.length > 1000 ? 'text-rose-400' : 'text-slate-500'}>
                      {reviewText.length}/1000
                    </span>
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value.slice(0, 1000))}
                    placeholder="დაწერეთ თქვენი შეფასება მუშის შესახებ..."
                    className="w-full flex-1 p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-all resize-none min-h-[100px]"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 border-t border-slate-800/40 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 text-xs font-semibold rounded-xl border border-slate-800 transition-colors cursor-pointer"
                    disabled={submittingReview}
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview || reviewText.length > 1000}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850/50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    {submittingReview && <Loader2 className="h-3 w-3 animate-spin" />}
                    გაგზავნა
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Worker Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            <div className="flex justify-between items-center p-5 border-b border-slate-800/40">
              <h2 className="text-base font-bold text-white">დავალების გადაცემა მუშისთვის</h2>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
                disabled={submittingAssignment}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {assignmentSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px] animate-in fade-in zoom-in-95 duration-300">
                <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
                  <Check className="h-8 w-8 stroke-[3]" />
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-bold text-white">წარმატებით დაინიშნა!</h4>
                  <p className="text-[10px] text-slate-500 mt-1">დავალება წარმატებით გადაეცა მუშას</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmAssignment} className="p-5 flex-1 flex flex-col overflow-hidden space-y-4">
                {/* Search & Filter Row */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      placeholder="ძებნა სახელით, უნარით ან ტელეფონით..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                  
                  <select
                    value={modalAvailabilityFilter}
                    onChange={(e) => setModalAvailabilityFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-350 text-xs outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">სტატუსი</option>
                    <option value="available">აქტიური</option>
                    <option value="busy">დაკავებული</option>
                    <option value="unavailable">მიუწვდომელი</option>
                  </select>
                </div>

                {/* Loading Detail / Workers list */}
                {loadingTaskDetail ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                    <p className="text-[10px] text-slate-500 font-semibold">იტვირთება ინფორმაცია...</p>
                  </div>
                ) : (
                  <>
                    {/* Replace confirmation warning */}
                    {(() => {
                      const activeAsg = assigningTaskDetail?.assignments?.find(asg => asg.status === 'pending' || asg.status === 'accepted');
                      if (activeAsg && selectedWorkerId && selectedWorkerId !== activeAsg.worker_id) {
                        return (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-450 rounded-xl text-[10px] font-semibold leading-normal space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            <p className="font-bold flex items-center gap-1 text-amber-450">⚠️ მუშის ჩანაცვლება</p>
                            <p>
                              ეს დავალება უკვე გადაცემულია: <span className="underline font-bold text-white">{activeAsg.worker_name}</span>.
                              დანიშვნა ჩაანაცვლებს მას და გააუქმებს მის ძველ შემოთავაზებას.
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Workers list */}
                    <div className="flex-1 overflow-y-auto max-h-56 space-y-2 border border-slate-800/50 rounded-xl p-2 bg-slate-950/20">
                      {filteredWorkers.length === 0 ? (
                        <div className="p-6 text-center text-slate-550 text-xs">
                          აქტიური მუშები ვერ მოიძებნა
                        </div>
                      ) : (
                        filteredWorkers.map((w) => (
                          <div
                            key={w.id}
                            onClick={() => setSelectedWorkerId(w.user_id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                              selectedWorkerId === w.user_id
                                ? 'bg-indigo-650/10 border-indigo-500/35 text-indigo-400 shadow-sm'
                                : 'bg-slate-900/50 border-slate-850 text-slate-350 hover:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 bg-indigo-600/10 rounded-lg flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
                                {w.fullname[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{w.fullname}</p>
                                <p className="text-[9px] text-slate-400 truncate font-semibold">
                                  {w.headline || 'სპეციალისტი'} • {w.location || 'ბათუმი'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-bold text-amber-450 flex items-center gap-0.5">
                                ★ {w.rating ? parseFloat(w.rating.toString()).toFixed(1) : '0.0'}
                              </span>
                              {selectedWorkerId === w.user_id && (
                                <Check className="h-4 w-4 text-indigo-400" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-800/40 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 text-xs font-semibold rounded-xl border border-slate-800 transition-colors cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={submittingAssignment || !selectedWorkerId}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850/50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingAssignment && <Loader2 className="h-3 w-3 animate-spin" />}
                  დანიშვნა
                </button>
              </div>
            </form>
          )}
          </div>
        </div>
      )}

      {/* Task Details Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-850 h-full flex flex-col shadow-2xl relative glass-panel">
            <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent" />
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-800/50">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">პროექტის დეტალები</span>
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
                      <span className={`text-xs font-bold border rounded px-2.5 py-1 ${getStatusDetails(selectedTask.status).class}`}>
                        {getStatusDetails(selectedTask.status).label}
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
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        მიმაგრებული ფოტოები ({selectedTask.images.length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedTask.images.map((img, idx) => (
                          <a
                            key={idx}
                            href={img}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative h-20 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-all flex"
                          >
                            <img src={img} alt="Visual content" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assign History */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      მუშების რეესტრი
                    </h4>
                    
                    {selectedTask.assignments && selectedTask.assignments.length > 0 ? (
                      <div className="space-y-3">
                        {selectedTask.assignments.map((asg) => (
                          <div 
                            key={asg.id} 
                            className="p-3 bg-slate-950/40 border border-slate-850/80 rounded-xl flex justify-between items-start gap-4"
                          >
                            <div>
                              <p className="text-xs font-semibold text-slate-200">
                                მუშა:{' '}
                                <Link 
                                  href={`/profile/${asg.worker_id}`} 
                                  className="text-indigo-400 hover:text-indigo-300 underline font-bold transition-colors cursor-pointer"
                                >
                                  {asg.worker_name}
                                </Link>
                              </p>
                              <span className="text-[9px] text-slate-550 block mt-0.5">
                                გაიგზავნა: {new Date(asg.assigned_at).toLocaleString('ka-GE')}
                              </span>
                            </div>

                            <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${
                              asg.status === 'accepted'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : asg.status === 'rejected'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {asg.status === 'accepted' ? 'მიიღო' : asg.status === 'rejected' ? 'უარყო' : 'მოლოდინში'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/10 border border-slate-850/60 rounded-xl text-center text-slate-500 text-xs">
                        დავალება ჯერ არ არის გადაცემული მუშისთვის.
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
