'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  AlertCircle, 
  X, 
  Upload, 
  Loader2, 
  DollarSign, 
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  Activity,
  Layers,
  Sparkles,
  Star,
  Check
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

export default function BusinessDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals & Panels state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [postingTask, setPostingTask] = useState(false);

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
        fetchTasks();
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

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTasks(data.tasks || []);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('დავალებების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenDrawer = async (task: Task) => {
    setLoadingDetail(true);
    setIsDrawerOpen(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSelectedTask(data.task);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('დეტალების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setFormImages(prev => [...prev, data.url]);
        toast.success('სურათი წარმატებით აიტვირთა');
      } else {
        toast.error(data.error || 'ატვირთვა ვერ მოხერხდა');
      }
    } catch (err) {
      console.error(err);
      toast.error('ატვირთვის შეცდომა');
    } finally {
      setUploadingImage(false);
    }
  };

  // Post Task Form Submit
  const handlePostTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      toast.error('გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    setPostingTask(true);
    // Embed budget inside description
    const finalDescription = formBudget.trim() 
      ? `${formDescription}\n\n[ბიუჯეტი: ${formBudget} GEL]`
      : formDescription;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: finalDescription,
          priority: formPriority,
          imageUrls: formImages,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('დავალება წარმატებით დაემატა');
        setIsPostModalOpen(false);
        // Reset form
        setFormTitle('');
        setFormDescription('');
        setFormBudget('');
        setFormPriority('medium');
        setFormImages([]);
        fetchTasks();
      } else {
        toast.error(data.error || 'შექმნა ვერ მოხერხდა');
      }
    } catch (err) {
      console.error(err);
      toast.error('კავშირის შეცდომა');
    } finally {
      setPostingTask(false);
    }
  };

  // Status badges helpers
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'მოლოდინში', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'assigned':
        return { label: 'მენეჯერი დანიშნულია', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'accepted':
        return { label: 'მიღებულია', class: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
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

  // Filter & Search logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Analytics counts
  const totalCount = tasks.length;
  const activeCount = tasks.filter(t => ['assigned', 'accepted', 'in_progress'].includes(t.status)).length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-8 relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/40 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            ჩემი დავალებები
          </h1>
          <p className="text-sm text-slate-400 mt-1">განათავსეთ და მართეთ შეკვეთები Batumi ფილიალში</p>
        </div>

        <button
          onClick={() => setIsPostModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/15 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          ახალი დავალება
        </button>
      </div>

      {/* Analytics stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28 shadow-xl">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">სულ შეკვეთა</span>
            <Layers className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalCount}</p>
            <p className="text-[10px] text-slate-500 mt-1">ყველა განთავსებული პროექტი</p>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28 shadow-xl">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">აქტიური</span>
            <Activity className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{activeCount}</p>
            <p className="text-[10px] text-slate-500 mt-1">მიმდინარე სამუშაოები</p>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28 shadow-xl">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">დასრულებული</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{completedCount}</p>
            <p className="text-[10px] text-slate-500 mt-1">წარმატებით შესრულებული</p>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28 shadow-xl">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">განხილვაში</span>
            <Clock className="h-5 w-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{pendingCount}</p>
            <p className="text-[10px] text-slate-500 mt-1">მენეჯერის მოლოდინში</p>
          </div>
        </div>
      </div>

      {/* Filters and Searches Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800/40">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ძებნა სათაურით..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 hidden md:inline">ფილტრი:</span>
          {['all', 'pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border cursor-pointer ${
                statusFilter === filter
                  ? 'bg-indigo-650/10 border-indigo-500/30 text-indigo-400 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/50 text-slate-400 hover:text-slate-350 hover:border-slate-700'
              }`}
            >
              {filter === 'all' ? 'ყველა' : getStatusDetails(filter).label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks listing grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel rounded-2xl p-6 h-48 animate-pulse flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-slate-850 rounded w-2/3" />
                <div className="h-4 bg-slate-800 rounded w-full" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-800 rounded-full w-20" />
                <div className="h-4 bg-slate-800 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center max-w-lg mx-auto flex flex-col items-center">
          <div className="h-16 w-16 bg-slate-900/60 rounded-full flex items-center justify-center border border-slate-800/40 text-slate-500 mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">დავალებები ვერ მოიძებნა</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            თქვენ ჯერ არ გაქვთ დამატებული არცერთი დავალება, ან ფილტრის კრიტერიუმები არ ემთხვევა.
          </p>
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            ახალი დავალების შექმნა
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const statusInfo = getStatusDetails(task.status);
            const priorityClass = getPriorityBadge(task.priority);
            
            return (
              <div
                key={task.id}
                onClick={() => handleOpenDrawer(task)}
                className="glass-panel rounded-2xl p-6 shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[210px]"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    {/* Priority */}
                    <span className={`text-[10px] font-bold uppercase tracking-wider border rounded px-1.5 py-0.5 ${priorityClass}`}>
                      {task.priority === 'high' ? 'მაღალი' : task.priority === 'medium' ? 'საშუალო' : 'დაბალი'}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.created_at).toLocaleDateString('ka-GE')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-1 mb-2">
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-450 line-clamp-3 leading-relaxed mb-4">
                    {task.description}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800/40 pt-4" onClick={(e) => e.stopPropagation()}>
                  <span className={`text-[10px] font-bold border rounded px-2.5 py-1 ${statusInfo.class}`}>
                    {statusInfo.label}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    {task.status === 'completed' && task.worker_id && (
                      task.has_reviewed ? (
                        <button
                          onClick={(e) => handleOpenReviewModal(task.id, task.worker_id!, task.worker_name!, task.my_rating, task.my_review_text, e)}
                          className="text-[10px] text-amber-400 font-extrabold hover:text-amber-350 transition-colors cursor-pointer flex items-center gap-0.5"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> შეფასების რედაქტირება
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleOpenReviewModal(task.id, task.worker_id!, task.worker_name!, null, null, e)}
                          className="text-[10px] text-indigo-400 font-extrabold hover:text-indigo-350 transition-colors cursor-pointer flex items-center gap-0.5"
                        >
                          <Star className="h-3.5 w-3.5" /> შეფასება
                        </button>
                      )
                    )}
                    <span 
                      onClick={() => handleOpenDrawer(task)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-350 font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      დეტალები
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl relative overflow-hidden glass-panel max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            <div className="flex justify-between items-center p-6 border-b border-slate-800/40">
              <h2 className="text-lg font-bold text-white">ახალი დავალების განთავსება</h2>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePostTask} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  დავალების სათაური <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                  placeholder="მაგ: კაფეს კედლის მოპირკეთება ხით"
                />
              </div>

              {/* Budget and Priority Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Budget */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    ბიუჯეტი (GEL) (არასავალდებულო)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <input
                      type="number"
                      value={formBudget}
                      onChange={(e) => setFormBudget(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                      placeholder="150"
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    პრიორიტეტი <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all"
                  >
                    <option value="low">დაბალი / Low</option>
                    <option value="medium">საშუალო / Medium</option>
                    <option value="high">მაღალი / High</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  აღწერა <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none transition-all resize-none"
                  placeholder="დაწერეთ დავალების დეტალები: სამუშაოს მოცულობა, სასურველი გამოცდილება..."
                />
              </div>

              {/* Drag and Drop Image Upload Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  სურათების ატვირთვა
                </label>

                {/* Grid of uploaded images */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {formImages.map((img, idx) => (
                    <div key={idx} className="relative h-16 rounded-xl overflow-hidden border border-slate-800 group">
                      <img src={img} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-slate-950/65 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {uploadingImage && (
                    <div className="h-16 rounded-xl border border-slate-800 flex items-center justify-center bg-slate-950/30">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    </div>
                  )}
                </div>

                <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700/80 rounded-xl p-6 text-center transition-all bg-slate-950/20">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <Upload className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">დააწკაპუნეთ ან ჩააგდეთ სურათი ასატვირთად</p>
                  <p className="text-[10px] text-slate-500 mt-1">PNG, JPG 5MB-მდე</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-800/40 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 text-xs font-semibold rounded-xl border border-slate-800 transition-colors cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={postingTask}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {postingTask && <Loader2 className="h-3 w-3 animate-spin" />}
                  გამოქვეყნება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Right Side Drawer */}
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
                      <span className="text-xs font-bold text-slate-355 border border-slate-800 px-2.5 py-1 bg-slate-950/20 rounded">
                        {new Date(selectedTask.created_at).toLocaleDateString('ka-GE')}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{selectedTask.title}</h3>
                  </div>

                  {/* Description */}
                  <div className="bg-slate-950/40 border border-slate-800/40 p-4 rounded-xl">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedTask.description}
                    </p>
                  </div>

                  {/* Image Gallery */}
                  {selectedTask.images && selectedTask.images.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4 text-indigo-400" />
                        ატვირთული სურათები ({selectedTask.images.length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedTask.images.map((img, index) => (
                          <a
                            key={index}
                            href={img}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative h-20 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-all flex shadow"
                          >
                            <img src={img} alt="Task visual" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assignment Timeline / History */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      მუშაობის ისტორია
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
                              <p className="text-[10px] text-slate-500 mt-1">მენეჯერი: {asg.manager_name}</p>
                              <span className="text-[9px] text-slate-500 block mt-0.5">
                                გამოგზავნილია: {new Date(asg.assigned_at).toLocaleString('ka-GE')}
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
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-455 uppercase tracking-widest">
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
    </div>
  );
}
