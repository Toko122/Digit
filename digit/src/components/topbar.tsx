'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Menu, Check, CheckCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface TopbarProps {
  user: {
    id: string;
    fullname: string;
    email: string;
    role: string;
  };
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface DBNotification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Topbar({ user, sidebarOpen, setSidebarOpen }: TopbarProps) {
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications helper
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  // Poll notifications every 20 seconds
  useEffect(() => {
    const init = async () => {
      await fetchNotifications();
    };
    init();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Handle clicking outside notifications dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success('ყველა შეტყობინება წაკითხულია');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format time elapsed
  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'ახლახან';
    if (diffMins < 60) return `${diffMins} წთ წინ`;
    if (diffHours < 24) return `${diffHours} სთ წინ`;
    return `${diffDays} დღის წინ`;
  };

  const getBreadcrumbTitle = () => {
    switch (user.role) {
      case 'business': return 'დამკვეთის პანელი / Business';
      case 'manager': return 'მენეჯერის პანელი / Manager';
      case 'worker': return 'მუშის პანელი / Worker';
      case 'admin': return 'ადმინისტრატორი / Admin';
      default: return 'დაფა';
    }
  };

  return (
    <header className="flex h-16 items-center justify-between bg-slate-900 border-b border-slate-800/60 px-6 z-30 relative">
      {/* Left side: Hamburger (mobile) + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-400">Digit</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm font-semibold text-white tracking-wide">
            {getBreadcrumbTitle()}
          </span>
        </div>
      </div>

      {/* Right side: Notifications & Avatar */}
      <div className="flex items-center gap-4" ref={dropdownRef}>
        {/* Notification Bell wrapper */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 relative cursor-pointer transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-850 shadow-2xl z-50 overflow-hidden glass-panel">
              <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
                <span className="text-sm font-semibold text-white">შეტყობინებები</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    წაკითხულად მონიშვნა
                  </button>
                )}
              </div>

              {/* Notification rows */}
              <div className="max-h-72 overflow-y-auto division-y divide-slate-800/30">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    შეტყობინებები არ არის
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-slate-850/40 transition-colors flex items-start gap-3 cursor-pointer ${
                        !n.is_read ? 'bg-indigo-650/5' : ''
                      }`}
                    >
                      {/* Read status dot */}
                      <div className="mt-1.5">
                        <span
                          className={`block h-2 w-2 rounded-full ${
                            !n.is_read ? 'bg-indigo-500' : 'bg-slate-650'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-xs truncate ${!n.is_read ? 'font-semibold text-white' : 'text-slate-350'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5 shrink-0">
                            <Clock className="h-2.5 w-2.5" />
                            {formatTimeAgo(n.created_at)}
                          </span>
                        </div>
                        {n.body && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {n.body}
                          </p>
                        )}
                        {!n.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="mt-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            წაკითხვა
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User initials circle */}
        <div className="h-8 w-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs flex items-center justify-center select-none">
          {user.fullname.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
