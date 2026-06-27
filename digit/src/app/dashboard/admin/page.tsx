'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  Send, 
  ShieldAlert, 
  Loader2, 
  Search, 
  UserX, 
  UserCheck, 
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface AdminUser {
  id: string;
  fullname: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'business' | 'manager' | 'worker';
  is_active: boolean;
  created_at: string;
}

interface AdminTask {
  id: string;
  business_id: string;
  manager_id: string | null;
  title: string;
  description: string;
  status: string;
  priority: string | null;
  created_at: string;
  business_name: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab states
  const [adminTab, setAdminTab] = useState<'stats' | 'users' | 'tasks' | 'broadcast'>('stats');

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');

  // Broadcast state
  const [bcTitle, setBcTitle] = useState('');
  const [bcBody, setBcBody] = useState('');
  const [bcTarget, setBcTarget] = useState<'all' | 'business' | 'manager' | 'worker'>('all');
  const [sendingBc, setSendingBc] = useState(false);

  // Status updates states
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const userRes = await fetch('/api/admin/users');
      const userData = await userRes.json();
      
      const taskRes = await fetch('/api/tasks');
      const taskData = await taskRes.json();

      if (userData.success) setUsers(userData.users || []);
      if (taskData.success) setTasks(taskData.tasks || []);
    } catch (err) {
      console.error(err);
      toast.error('მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Toggle user active status
  const handleToggleUserStatus = async (id: string, currentActive: boolean) => {
    setUpdatingUserId(id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => 
          prev.map(u => u.id === id ? { ...u, is_active: !currentActive } : u)
        );
        toast.success(
          currentActive 
            ? 'მომხმარებელი დეაქტივირებულია' 
            : 'მომხმარებელი წარმატებით გააქტიურდა'
        );
      } else {
        toast.error(data.error || 'სტატუსის შეცვლა ვერ მოხერხდა');
      }
    } catch (err) {
      console.error(err);
      toast.error('კავშირის შეცდომა');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Change user role
  const handleChangeUserRole = async (id: string, newRole: 'admin' | 'business' | 'manager' | 'worker') => {
    setUpdatingUserId(id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => 
          prev.map(u => u.id === id ? { ...u, role: newRole } : u)
        );
        toast.success('მომხმარებლის როლი წარმატებით განახლდა');
      } else {
        toast.error(data.error || 'როლის შეცვლა ვერ მოხერხდა');
      }
    } catch (err) {
      console.error(err);
      toast.error('კავშირის შეცდომა');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Submit Broadcast Notification
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle.trim() || !bcBody.trim()) {
      toast.error('გთხოვთ შეავსოთ ყველა ველი');
      return;
    }

    setSendingBc(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bcTitle,
          body: bcBody,
          targetRole: bcTarget,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`შეტყობინება გაეგზავნა ${data.notifiedCount} მომხმარებელს!`);
        setBcTitle('');
        setBcBody('');
        setBcTarget('all');
      } else {
        toast.error(data.error || 'გაგზავნა ვერ მოხერხდა');
      }
    } catch (err) {
      console.error(err);
      toast.error('კავშირის შეცდომა');
    } finally {
      setSendingBc(false);
    }
  };

  // Status mapping
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'მოლოდინში';
      case 'assigned': return 'მენეჯერი დანიშნულია';
      case 'accepted': return 'მიღებულია';
      case 'in_progress': return 'მიმდინარეობს';
      case 'completed': return 'დასრულებული';
      case 'cancelled': return 'გაუქმებული';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'assigned': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'accepted': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'in_progress': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'cancelled': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  // Charts data preparation
  const getRoleChartData = () => {
    const roles = { admin: 0, business: 0, manager: 0, worker: 0 };
    users.forEach(u => {
      if (roles[u.role] !== undefined) roles[u.role]++;
    });
    return [
      { name: 'ბიზნესი', value: roles.business, color: '#6366f1' },
      { name: 'მენეჯერი', value: roles.manager, color: '#f59e0b' },
      { name: 'მუშა', value: roles.worker, color: '#10b981' },
      { name: 'ადმინი', value: roles.admin, color: '#f43f5e' },
    ];
  };

  const getStatusChartData = () => {
    const statuses = { pending: 0, assigned: 0, accepted: 0, in_progress: 0, completed: 0, cancelled: 0 };
    tasks.forEach(t => {
      const s = t.status as keyof typeof statuses;
      if (statuses[s] !== undefined) statuses[s]++;
    });
    return [
      { status: 'ახალი', count: statuses.pending, color: '#f59e0b' },
      { status: 'მენეჯერით', count: statuses.assigned, color: '#3b82f6' },
      { status: 'მიღებული', count: statuses.accepted, color: '#06b6d4' },
      { status: 'მუშაობაში', count: statuses.in_progress, color: '#8b5cf6' },
      { status: 'დასრულებული', count: statuses.completed, color: '#10b981' },
      { status: 'გაუქმებული', count: statuses.cancelled, color: '#64748b' },
    ];
  };

  const roleChartData = getRoleChartData();
  const statusChartData = getStatusChartData();

  // Filters logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullname.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                          t.description.toLowerCase().includes(taskSearch.toLowerCase()) ||
                          t.business_name.toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = taskStatusFilter === 'all' || t.status === taskStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 relative">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-800/40 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-indigo-400" />
            პლატფორმის ადმინისტრირება
          </h1>
          <p className="text-sm text-slate-400 mt-1">მართეთ მომხმარებლები, შეკვეთები და გაგზავნეთ შეტყობინებები</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setAdminTab('stats')}
          className={`pb-4 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            adminTab === 'stats' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          სტატისტიკა & ანალიტიკა
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`pb-4 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            adminTab === 'users' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          მომხმარებლები ({users.length})
        </button>

        <button
          onClick={() => setAdminTab('tasks')}
          className={`pb-4 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            adminTab === 'tasks' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          დავალებები ({tasks.length})
        </button>

        <button
          onClick={() => setAdminTab('broadcast')}
          className={`pb-4 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            adminTab === 'broadcast' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          გავრცელება (Broadcast)
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : adminTab === 'stats' ? (
        // STATS VIEW
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">სულ მომხმარებელი</span>
              <p className="text-2xl font-black text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                {users.length}
              </p>
            </div>
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">სულ დავალება</span>
              <p className="text-2xl font-black text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                {tasks.length}
              </p>
            </div>
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">აქტიური სამუშაოები</span>
              <p className="text-2xl font-black text-white">
                {tasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">შესრულებული</span>
              <p className="text-2xl font-black text-white text-emerald-400">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User roles chart */}
            <div className="glass-panel p-6 rounded-2xl h-[340px] flex flex-col justify-between shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4">მომხმარებელთა განაწილება</h3>
              <div className="h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legends */}
                <div className="space-y-2 ml-4 shrink-0">
                  {roleChartData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-450">{d.name}:</span>
                      <span className="font-bold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Task Status Chart */}
            <div className="glass-panel p-6 rounded-2xl h-[340px] flex flex-col justify-between shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4">დავალებების სტატუსი</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <XAxis dataKey="status" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : adminTab === 'users' ? (
        // USERS DIRECTORY TABLE
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800/40">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ძებნა სახელით / ელ-ფოსტით..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-bold">როლი:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">ყველა</option>
                <option value="admin">ადმინი</option>
                <option value="business">ბიზნესი</option>
                <option value="manager">მენეჯერი</option>
                <option value="worker">მუშა</option>
              </select>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold">
                    <th className="p-4">სახელი</th>
                    <th className="p-4">ელ-ფოსტა</th>
                    <th className="p-4">ტელეფონი</th>
                    <th className="p-4">როლი</th>
                    <th className="p-4">რეგისტრაცია</th>
                    <th className="p-4">სტატუსი</th>
                    <th className="p-4 text-right">მოქმედება</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        მომხმარებლები ვერ მოიძებნა
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-850/20 text-slate-205 transition-colors">
                        <td className="p-4 font-bold text-white">{u.fullname}</td>
                        <td className="p-4">{u.email}</td>
                        <td className="p-4">{u.phone || '-'}</td>
                        <td className="p-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeUserRole(u.id, e.target.value as any)}
                            disabled={updatingUserId === u.id}
                            className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                          >
                            <option value="worker">worker (Executor)</option>
                            <option value="business">business</option>
                            <option value="manager">manager</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="p-4">{new Date(u.created_at).toLocaleDateString('ka-GE')}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${u.is_active ? 'text-emerald-400' : 'text-slate-550'}`}>
                            {u.is_active ? (
                              <>
                                <UserCheck className="h-3 w-3" />
                                აქტიური
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3 text-slate-550" />
                                დაბლოკილი
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                            disabled={updatingUserId === u.id}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                              u.is_active
                                ? 'border-rose-500/20 hover:border-rose-500/40 text-rose-400 bg-rose-500/5'
                                : 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 bg-emerald-500/5'
                            }`}
                          >
                            {updatingUserId === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                            ) : u.is_active ? (
                              'დეაქტივაცია'
                            ) : (
                              'აქტივაცია'
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : adminTab === 'tasks' ? (
        // TASKS OVERSIGHT VIEW
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800/40">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="ძებნა სათაურით / დამკვეთით..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-bold">სტატუსი:</span>
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">ყველა</option>
                <option value="pending">pending</option>
                <option value="assigned">assigned</option>
                <option value="accepted">accepted</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold">
                    <th className="p-4">დავალება</th>
                    <th className="p-4">დამკვეთი კომპანია</th>
                    <th className="p-4">პრიორიტეტი</th>
                    <th className="p-4">თარიღი</th>
                    <th className="p-4">სტატუსი</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        დავალებები ვერ მოიძებნა
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-850/20 text-slate-200 transition-colors">
                        <td className="p-4 font-bold text-white">{t.title}</td>
                        <td className="p-4 text-indigo-400 font-semibold">{t.business_name}</td>
                        <td className="p-4 uppercase font-bold text-[10px]">{t.priority || 'medium'}</td>
                        <td className="p-4">{new Date(t.created_at).toLocaleDateString('ka-GE')}</td>
                        <td className="p-4">
                          <span className={`inline-block border px-2.5 py-1 rounded text-[10px] font-bold ${getStatusClass(t.status)}`}>
                            {getStatusLabel(t.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // GLOBAL NOTIFICATION BROADCAST TOOL
        <div className="glass-panel rounded-2xl p-8 max-w-xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-indigo-400" />
            შეტყობინებების გავრცელება
          </h2>

          <form onSubmit={handleSendBroadcast} className="space-y-5">
            {/* Target audience */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                სამიზნე აუდიტორია
              </label>
              <select
                value={bcTarget}
                onChange={(e) => setBcTarget(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">ყველა მომხმარებელი (All Users)</option>
                <option value="business">მხოლოდ ბიზნესები (Businesses Only)</option>
                <option value="manager">მხოლოდ მენეჯერები (Managers Only)</option>
                <option value="worker">მხოლოდ მუშები (Workers Only)</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                სათაური
              </label>
              <input
                type="text"
                required
                value={bcTitle}
                onChange={(e) => setBcTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none transition-all"
                placeholder="შეიყვანეთ შეტყობინების სათაური..."
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                შეტყობინების ტექსტი
              </label>
              <textarea
                required
                rows={4}
                value={bcBody}
                onChange={(e) => setBcBody(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none transition-all resize-none"
                placeholder="შეიყვანეთ შეტყობინების დეტალური ტექსტი..."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={sendingBc}
              className="w-full py-2.5 px-4 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-indigo-805/50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {sendingBc ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              შეტყობინების გაგზავნა
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
