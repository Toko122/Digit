'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Star, 
  MapPin, 
  Briefcase, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  DollarSign, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

interface Worker {
  id: string;
  user_id: string;
  fullname: string;
  email: string;
  phone: string | null;
  profile_photo_url: string | null;
  cover_image_url: string | null;
  headline: string | null;
  about_me: string | null;
  hourly_rate: number | null;
  currency: string;
  experience_level: string;
  availability: 'available' | 'busy' | 'unavailable';
  location: string | null;
  years_of_experience: number;
  rating: number;
  skills: string[];
  languages: string[];
  completed_jobs: number;
  jobs_in_progress: number;
}

export default function BrowseWorkersPage() {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [availability, setAvailability] = useState<string>('');
  const [profession, setProfession] = useState<string>('');
  const [minExperience, setMinExperience] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [minCompletedJobs, setMinCompletedJobs] = useState<string>('');
  const [minHourlyRate, setMinHourlyRate] = useState<string>('');
  const [maxHourlyRate, setMaxHourlyRate] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<string>('');
  const [selectedLanguages, setSelectedLanguages] = useState<string>('');

  const [sortBy, setSortBy] = useState<string>('highest_rated');
  const [page, setPage] = useState(1);
  
  // Data state
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (availability) params.append('availability', availability);
      if (profession) params.append('profession', profession);
      if (minExperience) params.append('minExperience', minExperience);
      if (minRating) params.append('minRating', minRating);
      if (city) params.append('city', city);
      if (minCompletedJobs) params.append('minCompletedJobs', minCompletedJobs);
      if (minHourlyRate) params.append('minHourlyRate', minHourlyRate);
      if (maxHourlyRate) params.append('maxHourlyRate', maxHourlyRate);
      if (selectedSkills) params.append('skills', selectedSkills);
      if (selectedLanguages) params.append('languages', selectedLanguages);
      
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', '8');

      const res = await fetch(`/api/workers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setWorkers(data.workers || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        toast.error(data.error || 'მონაცემების ჩატვირთვა ვერ მოხერხდა');
      }
    } catch (err) {
      console.error(err);
      toast.error('კავშირის შეცდომა');
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    availability,
    profession,
    minExperience,
    minRating,
    city,
    minCompletedJobs,
    minHourlyRate,
    maxHourlyRate,
    selectedSkills,
    selectedLanguages,
    sortBy,
    page
  ]);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  const handleResetFilters = () => {
    setAvailability('');
    setProfession('');
    setMinExperience('');
    setMinRating('');
    setCity('');
    setMinCompletedJobs('');
    setMinHourlyRate('');
    setMaxHourlyRate('');
    setSelectedSkills('');
    setSelectedLanguages('');
    setSearchTerm('');
    setSortBy('highest_rated');
    setPage(1);
    toast.success('ფილტრები გასუფთავდა');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">მუშების ბრაუზერი</h1>
          <p className="text-slate-400 text-xs mt-1">აღმოაჩინეთ და დაიქირავეთ საუკეთესო პროფესიონალები თქვენი პროექტებისთვის</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-350 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
            ფილტრები
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">სორტირება:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-800 text-slate-350 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="highest_rated">უმაღლესი რეიტინგი</option>
              <option value="most_experienced">გამოცდილი</option>
              <option value="newest">ახალი დარეგისტრირებული</option>
              <option value="recently_active">ცოტა ხნის წინ აქტიური</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filters Sidebar - Desktop */}
        <div className={`lg:block ${showMobileFilters ? 'block' : 'hidden'} lg:col-span-1 glass-panel rounded-2xl border border-white/5 p-6 space-y-6 bg-slate-900/40`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
              ფილტრები
            </h3>
            <button 
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-indigo-455 hover:text-indigo-300 cursor-pointer"
            >
              გასუფთავება
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Availability */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400">სტატუსი</label>
              <select
                value={availability}
                onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:border-indigo-500 outline-none"
              >
                <option value="">ყველა</option>
                <option value="available">აქტიური (Available)</option>
                <option value="busy">დაკავებული (Busy)</option>
                <option value="unavailable">მიუწვდომელი</option>
              </select>
            </div>

            {/* Profession / Headline */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400">პროფესია / სათაური</label>
              <input
                type="text"
                placeholder="მაგ. ხელოსანი, მღებავი"
                value={profession}
                onChange={(e) => { setProfession(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:border-indigo-500 outline-none placeholder-slate-600"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400">ქალაქი</label>
              <input
                type="text"
                placeholder="მაგ. ბათუმი, თბილისი"
                value={city}
                onChange={(e) => { setCity(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:border-indigo-500 outline-none placeholder-slate-600"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400">მინიმალური გამოცდილება (წელი)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={minExperience}
                onChange={(e) => { setMinExperience(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Minimum Rating */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400">მინიმალური რეიტინგი</label>
              <select
                value={minRating}
                onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:border-indigo-500 outline-none"
              >
                <option value="">ნებისმიერი</option>
                <option value="4.5">★ 4.5 და მეტი</option>
                <option value="4.0">★ 4.0 და მეტი</option>
                <option value="3.5">★ 3.5 და მეტი</option>
              </select>
            </div>

            {/* Completed Jobs */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400">მინიმალური შესრულებული სამუშაო</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={minCompletedJobs}
                onChange={(e) => { setMinCompletedJobs(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Hourly Rate */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400">ფასი (სთ / GEL)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minHourlyRate}
                  onChange={(e) => { setMinHourlyRate(e.target.value); setPage(1); }}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:border-indigo-500 outline-none placeholder-slate-700"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxHourlyRate}
                  onChange={(e) => { setMaxHourlyRate(e.target.value); setPage(1); }}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:border-indigo-500 outline-none placeholder-slate-700"
                />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400">უნარები (მძიმით გამოყოფილი)</label>
              <input
                type="text"
                placeholder="React, CSS, JavaScript"
                value={selectedSkills}
                onChange={(e) => { setSelectedSkills(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:border-indigo-500 outline-none placeholder-slate-650"
              />
            </div>

            {/* Languages */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400">ენები (მძიმით გამოყოფილი)</label>
              <input
                type="text"
                placeholder="ინგლისური, რუსული"
                value={selectedLanguages}
                onChange={(e) => { setSelectedLanguages(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:border-indigo-500 outline-none placeholder-slate-650"
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="მოძებნეთ სახელით, უნარით, პროფესიით, ქალაქით ან ენით..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-205 placeholder-slate-500 focus:border-indigo-500 outline-none transition-all shadow-xl"
            />
          </div>

          {/* Loading / Empty States / Worker Cards */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-xs text-slate-550 italic font-semibold">მუშების სია იტვირთება...</p>
            </div>
          ) : workers.length === 0 ? (
            <div className="glass-panel rounded-2xl border border-white/5 p-12 text-center space-y-3 bg-slate-900/10">
              <p className="text-sm font-semibold text-slate-450">მუშები მითითებული პარამეტრებით ვერ მოიძებნა</p>
              <button 
                onClick={handleResetFilters}
                className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-650 hover:text-white border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ფილტრების გასუფთავება
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Workers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workers.map((worker) => (
                  <div 
                    key={worker.id}
                    className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between hover:border-indigo-500/20 hover:shadow-2xl transition-all duration-300 relative group"
                  >
                    {/* Header: Photo and Availability badge */}
                    <div className="p-6 pb-0 flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative h-16 w-16 rounded-xl bg-indigo-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                        {worker.profile_photo_url ? (
                          <img src={worker.profile_photo_url} alt={worker.fullname} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xl font-extrabold text-indigo-400">
                            {worker.fullname.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white truncate">{worker.fullname}</h4>
                          <span className={`h-2 w-2 rounded-full ${
                            worker.availability === 'available' ? 'bg-emerald-400' : worker.availability === 'busy' ? 'bg-amber-400' : 'bg-slate-500'
                          }`} />
                        </div>
                        
                        <p className="text-xs text-indigo-400 font-bold leading-normal truncate">{worker.headline || 'სპეციალისტი'}</p>
                        
                        <div className="flex items-center gap-3 pt-0.5 text-[10px] text-slate-400 font-bold">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            {worker.rating ? parseFloat(worker.rating.toString()).toFixed(1) : '0.0'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3 text-indigo-400" />
                            {worker.location || 'ბათუმი'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio / About */}
                    <div className="px-6 py-3">
                      <p className="text-xs text-slate-350 leading-relaxed font-medium line-clamp-2 min-h-[2.5rem]">
                        {worker.about_me || 'ინფორმაცია არ არის მითითებული.'}
                      </p>
                    </div>

                    {/* Body: Badges (Skills & Experience) */}
                    <div className="px-6 space-y-3">
                      {/* Skills */}
                      {worker.skills && worker.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {worker.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="text-[9px] font-bold text-slate-350 bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                          {worker.skills.length > 3 && (
                            <span className="text-[9px] font-extrabold text-indigo-400 bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded">
                              +{worker.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Languages */}
                      {worker.languages && worker.languages.length > 0 && (
                        <div className="flex flex-wrap gap-1 text-[9px] font-bold text-slate-400">
                          {worker.languages.map((lang, index) => (
                            <span key={index} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                              {lang}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats & Actions Footer */}
                    <div className="p-6 pt-4 border-t border-slate-900/50 mt-4 bg-slate-950/20 flex items-center justify-between gap-4">
                      {/* Stats */}
                      <div className="flex gap-4 text-[10px] font-bold text-slate-450">
                        <div>
                          <p className="text-white text-xs">{worker.years_of_experience || 0} წ</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">გამოცდილება</p>
                        </div>
                        <div>
                          <p className="text-emerald-400 text-xs">{worker.completed_jobs || 0}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">სამუშაო</p>
                        </div>
                        <div>
                          {worker.hourly_rate ? (
                            <p className="text-white text-xs">{worker.hourly_rate} GEL/სთ</p>
                          ) : (
                            <p className="text-slate-500 text-xs">შეთანხმებით</p>
                          )}
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">ტარიფი</p>
                        </div>
                      </div>

                      {/* View Profile */}
                      <Link 
                        href={`/profile/${worker.user_id}`}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-lg shadow-indigo-600/10"
                      >
                        პროფილი
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 bg-slate-900 border border-slate-800 text-slate-350 disabled:opacity-40 rounded-xl cursor-pointer disabled:cursor-not-allowed hover:bg-slate-850 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <span className="text-xs font-bold text-slate-400">
                    გვერდი {page} / {totalPages} (სულ {total} მუშა)
                  </span>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 bg-slate-900 border border-slate-800 text-slate-355 disabled:opacity-40 rounded-xl cursor-pointer disabled:cursor-not-allowed hover:bg-slate-850 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
