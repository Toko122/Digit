'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  LogOut, 
  ShieldCheck, 
  ClipboardList, 
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface SidebarProps {
  user: {
    id: string;
    fullname: string;
    email: string;
    role: string;
  };
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ user, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast.success('წარმატებით გამოხვედით სისტემიდან');
        router.refresh();
        router.push('/login');
      } else {
        toast.error('გამოსვლისას დაფიქსირდა შეცდომა');
      }
    } catch (err) {
      console.error(err);
      toast.error('კავშირის შეცდომა');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'ადმინი', class: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'business':
        return { label: 'ბიზნესი', class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      case 'manager':
        return { label: 'მენეჯერი', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'worker':
        return { label: 'მუშა', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      default:
        return { label: role, class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  // Define links based on user role
  const getNavLinks = () => {
    const base = `/dashboard/${user.role}`;
    switch (user.role) {
      case 'business':
        return [
          { href: base, label: 'დაფა / Dashboard', icon: LayoutDashboard },
        ];
      case 'manager':
        return [
          { href: base, label: 'ახალი პროექტები', icon: ClipboardList },
        ];
      case 'worker':
        return [
          { href: base, label: 'სამუშაო დაფა', icon: Briefcase },
        ];
      case 'admin':
        return [
          { href: base, label: 'პლატფორმის მართვა', icon: ShieldCheck },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-all duration-300"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:z-auto lg:h-screen`}
      >
        {/* Header */}
        <div className="flex h-16 items-center px-6 justify-between border-b border-slate-800/50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white text-lg tracking-tighter">
              D
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">Digit</span>
              <div className="flex items-center gap-0.5 text-[10px] text-indigo-400 font-semibold">
                <MapPin className="h-2.5 w-2.5" />
                ბათუმი
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  isActive 
                    ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.05)]' 
                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center gap-3 p-2 bg-slate-950/40 rounded-xl border border-slate-800/40 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-650 text-white font-bold text-sm">
              {user.fullname.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-none mb-1">
                {user.fullname}
              </p>
              <span className={`inline-block text-[10px] font-bold border rounded px-1.5 py-0.5 ${roleInfo.class}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-rose-400 hover:text-rose-350 hover:bg-rose-500/5 rounded-xl border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            გამოსვლა
          </button>
        </div>
      </aside>
    </>
  );
}
