'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  FileText, 
  Globe, 
  Plus, 
  Edit3, 
  Loader2, 
  Award, 
  CheckCircle2,
  Trash2,
  Upload,
  ArrowLeft,
  Phone,
  Star,
  Activity,
  Clock
} from 'lucide-react';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
import { toast } from 'sonner';
import DashboardShell from '@/app/dashboard/dashboard-shell';
import { FullWorkerProfile, WorkerExperience, WorkerEducation, PortfolioProject, WorkerCertification, WorkerReview } from '@/lib/queries/workerProfiles';

// Import edit modals
import {
  EditHeaderModal,
  EditAboutModal,
  EditSkillsModal,
  AddEditExperienceModal,
  AddEditEducationModal,
  AddEditPortfolioModal,
  AddEditCertificationModal,
  AddEditLanguageModal,
  EditSocialsModal
} from '@/components/profile/EditModals';

interface ProfileClientProps {
  initialData: FullWorkerProfile;
  currentUser: {
    id: string;
    fullname: string;
    email: string;
    role: string;
  };
  isOwner: boolean;
  workerId: string;
}

export default function ProfileClient({ initialData, currentUser, isOwner, workerId }: ProfileClientProps) {
  const [data, setData] = useState<FullWorkerProfile>(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);

  // Modal open states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingExperience, setEditingExperience] = useState<WorkerExperience | undefined>(undefined);
  const [editingEducation, setEditingEducation] = useState<WorkerEducation | undefined>(undefined);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioProject | undefined>(undefined);
  const [editingCertification, setEditingCertification] = useState<WorkerCertification | undefined>(undefined);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/workers/profile/${workerId}`);
      if (res.ok) {
        const fresh = await res.json();
        if (fresh.success) {
          setData(fresh);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }, [workerId]);

  const handleUploadCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCV(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'ატვირთვა ვერ მოხერხდა');
      }
      
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'ატვირთვა ვერ მოხერხდა');
      }

      // Update resume url in profile
      const patchRes = await fetch(`/api/workers/profile/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_url: uploadData.url })
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok || !patchData.success) {
        throw new Error(patchData.error || 'პროფილის განახლება ვერ მოხერხდა');
      }

      toast.success('რეზიუმე წარმატებით აიტვირთა!');
      refreshData();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'რეზიუმეს ატვირთვა ვერ მოხერხდა';
      toast.error(errMsg);
    } finally {
      setUploadingCV(false);
    }
  };

  const handleRemoveCV = async () => {
    try {
      const res = await fetch(`/api/workers/profile/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_url: null })
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'წაშლა ვერ მოხერხდა');
      }

      toast.success('რეზიუმე წაიშალა');
      refreshData();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'წაშლა ვერ მოხერხდა';
      toast.error(errMsg);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'github': return <GithubIcon className="h-4 w-4" />;
      case 'linkedin': return <LinkedinIcon className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      case 'facebook': return <FacebookIcon className="h-4 w-4" />;
      case 'instagram': return <InstagramIcon className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const { 
    profile, 
    experiences, 
    educations, 
    skills, 
    portfolio, 
    certifications, 
    languages, 
    socialLinks,
    assignments = [],
    ratingStats
  } = data;

  const [reviewsList, setReviewsList] = useState<WorkerReview[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/workers/profile/${workerId}/reviews?page=${reviewsPage}&limit=5`);
      const resData = await res.json();
      if (resData.success) {
        setReviewsList(resData.reviews || []);
        setReviewsTotal(resData.total || 0);
        setReviewsTotalPages(resData.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  }, [workerId, reviewsPage]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const getStarPercentage = (count: number) => {
    if (!ratingStats || !ratingStats.totalReviews) return 0;
    return Math.round((count / ratingStats.totalReviews) * 100);
  };

  const completedProjects = assignments.filter(a => a.status === 'accepted' && a.task_status === 'completed');

  const calculateProfileCompletion = () => {
    let score = 0;
    let total = 0;
    
    const fields = ['profile_photo_url', 'cover_image_url', 'headline', 'about_me', 'location', 'resume_url', 'website_url', 'github_url', 'linkedin_url'];
    fields.forEach(f => {
      total++;
      if (profile[f as keyof typeof profile]) score++;
    });
    
    total++;
    if (skills && skills.length > 0) score++;
    
    total++;
    if (experiences && experiences.length > 0) score++;
    
    total++;
    if (educations && educations.length > 0) score++;
    
    total++;
    if (certifications && certifications.length > 0) score++;
    
    total++;
    if (languages && languages.length > 0) score++;

    return Math.round((score / total) * 105 / 105) || 0; // Prevent NaN
  };

  const profileCompletion = Math.min(100, calculateProfileCompletion());

  return (
    <DashboardShell user={currentUser}>
      <div className="space-y-6 pb-12">
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            უკან დაბრუნება / Dashboard
          </Link>
          {refreshing && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
        </div>

        {/* 1. COVER & HEADER CARD */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-white/5 relative">
          {/* Cover Photo */}
          <div className="h-40 md:h-52 bg-slate-900 relative overflow-hidden">
            {profile.cover_image_url ? (
              <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 via-indigo-950/20 to-slate-900" />
            )}
            {/* Soft decorative glow */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent" />
          </div>

          {/* Profile Details Container */}
          <div className="p-6 md:p-8 pt-0 relative flex flex-col md:flex-row justify-between items-start gap-6">
            {/* Avatar & Main Info */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 -mt-10 md:-mt-12 text-center md:text-left w-full md:w-auto">
              <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-indigo-950 border-4 border-slate-950 shadow-2xl overflow-hidden select-none flex items-center justify-center shrink-0">
                {profile.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt={profile.fullname} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-indigo-400">
                    {profile.fullname.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="pt-2 md:pt-14 space-y-1">
                <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
                  {profile.fullname}
                  {profile.verification_status === 'verified' && (
                    <CheckCircle2 className="h-5 w-5 text-indigo-400 fill-indigo-400/10 shrink-0" />
                  )}
                </h1>
                
                {profile.headline ? (
                  <p className="text-sm font-semibold text-indigo-400 leading-normal">{profile.headline}</p>
                ) : (
                  <p className="text-xs text-slate-550 italic">სათაური არ არის მითითებული</p>
                )}

                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold justify-center md:justify-start pt-1">
                  <span>⭐</span>
                  <span>{parseFloat((ratingStats?.averageRating ?? 0.0).toString()).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({ratingStats?.totalReviews ?? 0} Reviews)</span>
                </div>

                {/* Badges/Meta */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2 text-xs font-semibold text-slate-350">
                  <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    {profile.location || 'მდებარეობა მითითებული არ არის'}
                  </span>
                  <span className="inline-flex items-center bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-emerald-400">
                    <DollarSign className="h-3.5 w-3.5 shrink-0" />
                    {profile.hourly_rate} {profile.currency}/სთ
                  </span>
                  <span className="inline-flex items-center bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                    {profile.experience_level} Level
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border uppercase tracking-wider text-[9px] font-bold ${
                    profile.availability === 'available'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : profile.availability === 'busy'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {profile.availability === 'available' ? 'აქტიური' : profile.availability === 'busy' ? 'დაკავებული' : 'არაცარიელი'}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {isOwner && (
              <button 
                onClick={() => setActiveModal('header')}
                className="mt-4 md:mt-14 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-transparent text-indigo-400 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Edit3 className="h-4 w-4" />
                რედაქტირება
              </button>
            )}
          </div>

          {/* Social Links Bar */}
          {socialLinks.length > 0 && (
            <div className="border-t border-slate-900/50 bg-slate-950/20 px-6 py-4 flex flex-wrap gap-4 items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">სოციალური ქსელები:</span>
              <div className="flex gap-2.5">
                {socialLinks.map((link) => (
                  <a 
                    key={link.id} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2 bg-slate-900 hover:bg-indigo-650 border border-slate-800 hover:border-transparent text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                    title={link.platform}
                  >
                    {getSocialIcon(link.platform)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE (2 Columns on Desktop) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 2. ABOUT ME SECTION */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                <h3 className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-400" />
                  ჩემ შესახებ
                </h3>
                {isOwner && (
                  <button onClick={() => setActiveModal('about')} className="p-1.5 bg-slate-900 hover:bg-indigo-650 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {profile.about_me ? (
                <div className="text-slate-350 text-sm leading-relaxed whitespace-pre-line font-medium space-y-2">
                  {profile.about_me}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4">ინფორმაცია ჩემ შესახებ არ არის შევსებული</p>
              )}
            </div>

            {/* 3. EXPERIENCE SECTION */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                <h3 className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-400" />
                  სამუშაო გამოცდილება
                </h3>
                {isOwner && (
                  <button 
                    onClick={() => {
                      setEditingExperience(undefined);
                      setActiveModal('experience');
                    }}
                    className="p-1.5 bg-slate-900 hover:bg-indigo-650 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {experiences.length === 0 ? (
                <p className="text-xs text-slate-550 italic text-center py-4">სამუშაო გამოცდილება არ არის დამატებული</p>
              ) : (
                <div className="space-y-6 relative border-l border-slate-800 pl-5 ml-2.5">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="relative group space-y-1.5">
                      {/* Timeline dot */}
                      <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full bg-slate-900 border-2 border-indigo-500" />
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white leading-normal">{exp.title}</h4>
                          <p className="text-xs text-indigo-400 font-semibold">{exp.company_name} {exp.location ? `• ${exp.location}` : ''}</p>
                        </div>
                        {isOwner && (
                          <button 
                            onClick={() => {
                              setEditingExperience(exp);
                              setActiveModal('experience');
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-slate-805 border border-slate-850 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(exp.start_date).toLocaleDateString('ka-GE')} - {exp.is_current ? 'Present' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('ka-GE') : ''}
                      </p>

                      {exp.description && (
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. EDUCATION SECTION */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                <h3 className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
                  <Award className="h-4 w-4 text-indigo-400" />
                  განათლება
                </h3>
                {isOwner && (
                  <button 
                    onClick={() => {
                      setEditingEducation(undefined);
                      setActiveModal('education');
                    }}
                    className="p-1.5 bg-slate-900 hover:bg-indigo-650 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {educations.length === 0 ? (
                <p className="text-xs text-slate-550 italic text-center py-4">განათლება არ არის დამატებული</p>
              ) : (
                <div className="space-y-6 relative border-l border-slate-800 pl-5 ml-2.5">
                  {educations.map((edu) => (
                    <div key={edu.id} className="relative group space-y-1.5">
                      <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full bg-slate-900 border-2 border-indigo-500" />
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white leading-normal">{edu.institution}</h4>
                          <p className="text-xs text-indigo-400 font-semibold">{edu.degree} {edu.field_of_study ? `• ${edu.field_of_study}` : ''}</p>
                        </div>
                        {isOwner && (
                          <button 
                            onClick={() => {
                              setEditingEducation(edu);
                              setActiveModal('education');
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-slate-805 border border-slate-850 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(edu.start_date).toLocaleDateString('ka-GE')} - {edu.end_date ? new Date(edu.end_date).toLocaleDateString('ka-GE') : 'მიმდინარე'}
                      </p>

                      {edu.description && (
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. PORTFOLIO SECTION */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                <h3 className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
                  <Award className="h-4 w-4 text-indigo-400" />
                  პორტფოლიო / ნამუშევრები
                </h3>
                {isOwner && (
                  <button 
                    onClick={() => {
                      setEditingPortfolio(undefined);
                      setActiveModal('portfolio');
                    }}
                    className="p-1.5 bg-slate-900 hover:bg-indigo-650 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {portfolio.length === 0 ? (
                <p className="text-xs text-slate-550 italic text-center py-4">პორტფოლიო ცარიელია</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolio.map((project) => (
                    <div key={project.id} className="bg-slate-950/40 rounded-xl border border-slate-850/80 p-4 flex flex-col justify-between hover:border-slate-800/80 transition-colors">
                      <div className="space-y-2">
                        {project.images && project.images.length > 0 && (
                          <div className="h-28 rounded-lg bg-slate-900 overflow-hidden mb-3 border border-slate-800">
                            <img src={project.images[0]} alt={project.title} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <h4 className="text-sm font-bold text-white line-clamp-1">{project.title}</h4>
                        {project.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{project.description}</p>
                        )}
                      </div>

                      <div className="border-t border-slate-900/60 pt-3 mt-3 flex justify-between items-center">
                        <div className="flex gap-2">
                          {project.github_url && (
                            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 cursor-pointer">
                              <GithubIcon className="h-3.5 w-3.5" /> Source
                            </a>
                          )}
                          {project.live_url && (
                            <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer">
                              <Globe className="h-3.5 w-3.5" /> Live
                            </a>
                          )}
                        </div>
                        {isOwner && (
                          <button 
                            onClick={() => {
                              setEditingPortfolio(project);
                              setActiveModal('portfolio');
                            }}
                            className="p-1 bg-slate-900 hover:bg-slate-805 border border-slate-850 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COMPLETED PROJECTS SECTION */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 space-y-6">
              <h3 className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2 pb-3 border-b border-slate-900">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                შესრულებული პროექტები
              </h3>

              {completedProjects.length === 0 ? (
                <p className="text-xs text-slate-550 italic text-center py-4">შესრულებული პროექტები ჯერ არ ფიქსირდება</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedProjects.map((proj) => (
                    <div key={proj.id} className="p-4 bg-slate-950/40 border border-slate-850/80 rounded-2xl space-y-2 hover:border-indigo-500/20 transition-all duration-300">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white leading-normal truncate">{proj.task_title}</h4>
                          <p className="text-[10px] text-indigo-400 font-semibold truncate">{proj.business_name}</p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider shrink-0">
                          დასრულდა
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-350 leading-relaxed font-medium line-clamp-2">{proj.task_description}</p>
                      {proj.responded_at && (
                        <p className="text-[9px] text-slate-550 font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(proj.responded_at).toLocaleDateString('ka-GE')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* REVIEWS SECTION */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                <h3 className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
                  <Star className="h-4 w-4 text-indigo-400" />
                  შეფასებები და გამოხმაურებები
                </h3>
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                  სულ {reviewsTotal}
                </span>
              </div>

              {loadingReviews ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                  <p className="text-[10px] text-slate-500 italic">შეფასებები იტვირთება...</p>
                </div>
              ) : reviewsList.length === 0 ? (
                <p className="text-xs text-slate-550 italic text-center py-4">შეფასებები ჯერ არ ფიქსირდება</p>
              ) : (
                <div className="space-y-4">
                  {reviewsList.map((review) => (
                    <div key={review.id} className="p-4 bg-slate-950/40 border border-slate-850/80 rounded-2xl space-y-2 hover:border-indigo-500/10 transition-all duration-300">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{review.reviewer_name}</h4>
                            <span className={`text-[8px] font-black border rounded px-1.5 py-0.2 uppercase tracking-wider ${
                              review.reviewer_role === 'business' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {review.reviewer_role === 'business' ? 'დამკვეთი' : 'მენეჯერი'}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-semibold mt-0.5">პროექტი: {review.task_title}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-0.5 shrink-0">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star 
                                key={s} 
                                className={`h-3 w-3 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-[8px] text-slate-550 font-bold">
                            {new Date(review.created_at).toLocaleDateString('ka-GE')}
                          </span>
                        </div>
                      </div>
                      
                      {review.review_text && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium pt-1 whitespace-pre-wrap">{review.review_text}</p>
                      )}
                    </div>
                  ))}

                  {/* Reviews Pagination */}
                  {reviewsTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-900/50">
                      <button
                        disabled={reviewsPage === 1}
                        onClick={() => setReviewsPage(reviewsPage - 1)}
                        className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 rounded-lg cursor-pointer disabled:cursor-not-allowed hover:bg-slate-850 transition-colors"
                      >
                        უკან
                      </button>
                      
                      <span className="text-[10px] font-bold text-slate-400">
                        {reviewsPage} / {reviewsTotalPages}
                      </span>

                      <button
                        disabled={reviewsPage === reviewsTotalPages}
                        onClick={() => setReviewsPage(reviewsPage + 1)}
                        className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 rounded-lg cursor-pointer disabled:cursor-not-allowed hover:bg-slate-850 transition-colors"
                      >
                        წინ
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDEBAR (1 Column on Desktop) */}
          <div className="space-y-6">

            {/* STATISTICS CARD */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4 bg-slate-900/50">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-400" />
                სტატისტიკა / Stats
              </h3>
              
              <div className="space-y-4 text-xs">
                {/* Profile Completion */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-350">
                    <span>პროფილის შევსება</span>
                    <span className="text-indigo-400">{profileCompletion}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-950/40 border border-slate-850/80 rounded-xl space-y-1">
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">რეიტინგი</p>
                    <p className="text-white text-base font-black flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
                      {parseFloat((ratingStats?.averageRating ?? 0.0).toString()).toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-850/80 rounded-xl space-y-1">
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">შეფასებები</p>
                    <p className="text-white text-base font-black">
                      {ratingStats?.totalReviews ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-850/80 rounded-xl space-y-1">
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">მიმდინარე</p>
                    <p className="text-indigo-400 text-base font-black">
                      {profile.jobs_in_progress || 0} აქტიური
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-850/80 rounded-xl space-y-1">
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">წარმატება</p>
                    <p className="text-teal-400 text-base font-black">
                      100%
                    </p>
                  </div>
                </div>

                {/* Star distribution breakdown */}
                {ratingStats && (
                  <div className="space-y-1.5 pt-3 border-t border-slate-805/40">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = ratingStats.starCounts[stars as keyof typeof ratingStats.starCounts] || 0;
                      const pct = getStarPercentage(count);
                      return (
                        <div key={stars} className="flex items-center gap-2 text-[10px] text-slate-400 font-bold animate-in fade-in duration-300">
                          <span className="w-8 shrink-0 flex items-center gap-0.5 select-none">
                            {stars} <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-450 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-right shrink-0 select-none text-slate-500">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Additional stats */}
                <div className="pt-2 border-t border-slate-800/50 space-y-2 text-[10px] text-slate-400 font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-550" /> პასუხის დრო</span>
                    <span className="text-slate-200">~1 საათი</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTACT INFORMATION CARD */}
            {(isOwner || currentUser.role === 'admin' || currentUser.role === 'manager') && (
              <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4 bg-slate-900/50">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider pb-2 border-b border-slate-900 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-indigo-400" />
                  საკონტაქტო ინფორმაცია
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-indigo-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">ელ-ფოსტა</p>
                      <p className="text-slate-200 font-semibold truncate select-all">{profile.email}</p>
                    </div>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-indigo-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">ტელეფონი</p>
                        <p className="text-slate-200 font-semibold select-all">{profile.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-indigo-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">მდებარეობა</p>
                      <p className="text-slate-200 font-semibold">{profile.location || 'ბათუმი'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 6. RESUME CARD */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider pb-2 border-b border-slate-900">რეზიუმე / CV</h3>
              
              {profile.resume_url ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-850/80 rounded-xl">
                    <FileText className="h-8 w-8 text-indigo-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">CV_Resume.pdf</p>
                      <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors">ჩამოტვირთვა</a>
                    </div>
                    {isOwner && (
                      <button onClick={handleRemoveCV} className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-550 italic mb-3">რეზიუმე არ არის ატვირთული</p>
                  {isOwner && (
                    <div>
                      <input type="file" accept="application/pdf,image/*" onChange={handleUploadCV} className="hidden" id="resume-file" />
                      <label htmlFor="resume-file" className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-650 hover:text-white border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                        {uploadingCV ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        რეზიუმეს ატვირთვა
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 7. SKILLS CARD */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">უნარები / Skills</h3>
                {isOwner && (
                  <button onClick={() => setActiveModal('skills')} className="text-indigo-400 hover:text-indigo-300 text-xs font-bold cursor-pointer transition-colors">
                    მართვა
                  </button>
                )}
              </div>

              {skills.length === 0 ? (
                <p className="text-xs text-slate-550 italic text-center py-2">უნარები არ არის დამატებული</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span key={skill.id} className="text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-800/80 px-2.5 py-1.5 rounded-lg">
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 8. LANGUAGES CARD */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">უცხო ენები</h3>
                {isOwner && (
                  <button onClick={() => setActiveModal('language')} className="p-1 bg-slate-900 hover:bg-indigo-650 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {languages.length === 0 ? (
                <p className="text-xs text-slate-550 italic text-center py-2">უცხო ენები არ არის მითითებული</p>
              ) : (
                <div className="space-y-2">
                  {languages.map((lang) => (
                    <div key={lang.id} className="flex justify-between items-center p-2.5 bg-slate-950/40 border border-slate-850/80 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-white">{lang.language_name}</p>
                        <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{lang.proficiency_level}</span>
                      </div>
                      {isOwner && (
                        <button 
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/workers/profile/${workerId}/languages?id=${lang.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                toast.success('ენა წაიშალა');
                                refreshData();
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="text-slate-550 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 9. CERTIFICATIONS CARD */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">სერტიფიკატები</h3>
                {isOwner && (
                  <button 
                    onClick={() => {
                      setEditingCertification(undefined);
                      setActiveModal('certification');
                    }}
                    className="p-1 bg-slate-900 hover:bg-indigo-650 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {certifications.length === 0 ? (
                <p className="text-xs text-slate-550 italic text-center py-2">სერტიფიკატები არ არის დამატებული</p>
              ) : (
                <div className="space-y-3">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-3 bg-slate-950/40 border border-slate-850/80 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{cert.name}</p>
                          <span className="text-[10px] text-slate-500 font-semibold">{cert.issuing_organization}</span>
                        </div>
                        {isOwner && (
                          <button 
                            onClick={() => {
                              setEditingCertification(cert);
                              setActiveModal('certification');
                            }}
                            className="p-1 bg-slate-900 hover:bg-slate-805 border border-slate-850 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-900/60 pt-2 text-[9px] font-semibold text-slate-500">
                        <span>გაცემულია: {new Date(cert.issue_date).toLocaleDateString('ka-GE')}</span>
                        {cert.credential_url && (
                          <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">ნახვა</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 10. STATISTICS CARD (Future-proof structure) */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider pb-2 border-b border-slate-900">სტატისტიკა / Statistics</h3>
              
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-950/30 border border-slate-900 rounded-xl">
                  <p className="text-lg font-black text-indigo-400">0</p>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">დასრულებული</span>
                </div>
                <div className="p-3 bg-slate-950/30 border border-slate-900 rounded-xl">
                  <p className="text-lg font-black text-indigo-400">0</p>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">მიმდინარე</span>
                </div>
                <div className="p-3 bg-slate-950/30 border border-slate-900 rounded-xl">
                  <p className="text-lg font-black text-emerald-400">0.0</p>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">რეიტინგი</span>
                </div>
                <div className="p-3 bg-slate-950/30 border border-slate-900 rounded-xl">
                  <p className="text-lg font-black text-indigo-400">0</p>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">ნამუშევარი საათები</span>
                </div>
              </div>
            </div>

            {/* SOCIAL LINKS QUICK CONTROL */}
            {isOwner && (
              <button 
                onClick={() => setActiveModal('socials')}
                className="w-full py-2.5 border border-slate-800 hover:border-slate-700/60 bg-slate-900 hover:bg-slate-850/40 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Globe className="h-4 w-4" />
                სოციალური ბმულების მართვა
              </button>
            )}

          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODALS PORTAL
          ------------------------------------------------------------- */}
      <EditHeaderModal 
        isOpen={activeModal === 'header'} 
        onClose={() => setActiveModal(null)} 
        workerId={workerId}
        profile={profile}
        onSuccess={refreshData}
      />
      <EditAboutModal 
        isOpen={activeModal === 'about'} 
        onClose={() => setActiveModal(null)} 
        workerId={workerId}
        aboutMe={profile.about_me || ''}
        onSuccess={refreshData}
      />
      <EditSkillsModal 
        isOpen={activeModal === 'skills'} 
        onClose={() => setActiveModal(null)} 
        workerId={workerId}
        skills={skills}
        onSuccess={refreshData}
      />
      <AddEditExperienceModal 
        isOpen={activeModal === 'experience'} 
        onClose={() => {
          setActiveModal(null);
          setEditingExperience(undefined);
        }} 
        workerId={workerId}
        experience={editingExperience}
        onSuccess={refreshData}
      />
      <AddEditEducationModal 
        isOpen={activeModal === 'education'} 
        onClose={() => {
          setActiveModal(null);
          setEditingEducation(undefined);
        }} 
        workerId={workerId}
        education={editingEducation}
        onSuccess={refreshData}
      />
      <AddEditPortfolioModal 
        isOpen={activeModal === 'portfolio'} 
        onClose={() => {
          setActiveModal(null);
          setEditingPortfolio(undefined);
        }} 
        workerId={workerId}
        project={editingPortfolio}
        onSuccess={refreshData}
      />
      <AddEditCertificationModal 
        isOpen={activeModal === 'certification'} 
        onClose={() => {
          setActiveModal(null);
          setEditingCertification(undefined);
        }} 
        workerId={workerId}
        certification={editingCertification}
        onSuccess={refreshData}
      />
      <AddEditLanguageModal 
        isOpen={activeModal === 'language'} 
        onClose={() => setActiveModal(null)} 
        workerId={workerId}
        onSuccess={refreshData}
      />
      <EditSocialsModal 
        isOpen={activeModal === 'socials'} 
        onClose={() => setActiveModal(null)} 
        workerId={workerId}
        socialLinks={socialLinks}
        onSuccess={refreshData}
      />
    </DashboardShell>
  );
}
