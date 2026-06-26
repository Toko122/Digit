'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, Building2, Briefcase, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

type UserRole = 'business' | 'worker';

export default function RegisterPage() {
  const router = useRouter();
  
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('business');
  const [businessName, setBusinessName] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!fullname.trim()) {
      tempErrors.fullname = 'სახელის შეყვანა სავალდებულოა';
    } else if (fullname.trim().length < 2) {
      tempErrors.fullname = 'სახელი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან';
    }

    if (!email) {
      tempErrors.email = 'ელ-ფოსტის შეყვანა სავალდებულოა';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'ელ-ფოსტის ფორმატი არასწორია';
    }

    if (!password) {
      tempErrors.password = 'პაროლის შეყვანა სავალდებულოა';
    } else if (password.length < 6) {
      tempErrors.password = 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო';
    }

    if (role === 'business' && !businessName.trim()) {
      tempErrors.businessName = 'კომპანიის სახელის შეყვანა სავალდებულოა';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname,
          email,
          password,
          phone: phone ? phone : null,
          role,
          businessName: role === 'business' ? businessName : null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || 'რეგისტრაცია ვერ მოხერხდა');
      } else {
        toast.success('ანგარიში წარმატებით შეიქმნა!');
        router.refresh();
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('კავშირის შეცდომა, გთხოვთ სცადოთ მოგვიანებით');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#090d16] py-12 px-4 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-950/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <span className="font-bold text-xl tracking-tighter">D</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Digit</h1>
          <p className="text-slate-400 text-sm mt-1">რეგისტრაცია Batumi ფილიალში</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          <h2 className="text-xl font-bold text-white mb-6 text-center">რეგისტრაცია</h2>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setRole('business');
                setErrors({});
              }}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer ${
                role === 'business'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Building2 className="h-4.5 w-4.5" />
              ბიზნესი / Business
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('worker');
                setErrors({});
              }}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer ${
                role === 'worker'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Briefcase className="h-4.5 w-4.5" />
              შემსრულებელი / Executor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fullname */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                სრული სახელი
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => {
                    setFullname(e.target.value);
                    if (errors.fullname) setErrors({ ...errors, fullname: '' });
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="გიორგი მამულაშვილი"
                />
              </div>
              {errors.fullname && (
                <p className="text-xs text-rose-500 mt-1">{errors.fullname}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                ელ-ფოსტა
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="giorgi@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                ტელეფონი (არასავალდებულო)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="+995 599 12 34 56"
                />
              </div>
            </div>

            {/* Business Name (Dynamic) */}
            {role === 'business' && (
              <div className="transition-all duration-300 ease-in-out">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  კომპანიის სახელი
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (errors.businessName) setErrors({ ...errors, businessName: '' });
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                    placeholder="შპს ბათუმი დეველოპმენტი"
                  />
                </div>
                {errors.businessName && (
                  <p className="text-xs text-rose-500 mt-1">{errors.businessName}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                პაროლი
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 active:shadow-none flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  რეგისტრაცია
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            უკვე გაქვთ ანგარიში?{' '}
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              შესვლა
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
