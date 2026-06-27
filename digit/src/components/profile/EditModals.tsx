'use client';

import React, { useState } from 'react';
import { X, Loader2, Upload, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { 
  WorkerProfile, 
  WorkerExperience, 
  WorkerEducation, 
  PortfolioProject, 
  WorkerCertification, 
  WorkerSocialLink,
  Skill
} from '@/lib/queries/workerProfiles';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  onSuccess: () => void;
}

// Helper to upload files
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'ატვირთვა ვერ მოხერხდა');
  }
  
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'ატვირთვა ვერ მოხერხდა');
  }
  return data.url;
}

// -------------------------------------------------------------
// 1. EDIT HEADER MODAL
// -------------------------------------------------------------
interface EditHeaderModalProps extends ModalProps {
  profile: WorkerProfile;
}

export function EditHeaderModal({ isOpen, onClose, workerId, profile, onSuccess }: EditHeaderModalProps) {
  const [headline, setHeadline] = useState(profile.headline || '');
  const [hourlyRate, setHourlyRate] = useState(profile.hourly_rate?.toString() || '0');
  const [currency, setCurrency] = useState(profile.currency || 'GEL');
  const [experienceLevel, setExperienceLevel] = useState(profile.experience_level || 'Intermediate');
  const [availability, setAvailability] = useState(profile.availability || 'available');
  const [location, setLocation] = useState(profile.location || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(profile.years_of_experience?.toString() || '0');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(profile.profile_photo_url || '');
  const [coverImageUrl, setCoverImageUrl] = useState(profile.cover_image_url || '');
  const [visibility, setVisibility] = useState(profile.visibility || 'public');

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  if (!isOpen) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadFile(file);
      setProfilePhotoUrl(url);
      toast.success('სურათი წარმატებით აიტვირთა!');
    } catch (err: any) {
      toast.error(err.message || 'სურათის ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFile(file);
      setCoverImageUrl(url);
      toast.success('გარეკანი წარმატებით აიტვირთა!');
    } catch (err: any) {
      toast.error(err.message || 'გარეკანის ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/workers/profile/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          hourly_rate: parseFloat(hourlyRate) || 0,
          currency,
          experience_level: experienceLevel,
          availability,
          location,
          phone,
          years_of_experience: parseInt(yearsOfExperience) || 0,
          profile_photo_url: profilePhotoUrl,
          cover_image_url: coverImageUrl,
          visibility
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'განახლება ვერ მოხერხდა');
      }

      toast.success('პროფილი წარმატებით განახლდა!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative my-8 overflow-hidden">
        <div className="flex h-14 items-center justify-between px-6 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">პროფილის ძირითადი დეტალები</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4 border border-slate-800/60 p-3 rounded-xl bg-slate-950/20">
            <div className="relative h-16 w-16 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-700">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-slate-500">P</span>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1">პროფილის სურათი</label>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" id="avatar-file" />
              <label htmlFor="avatar-file" className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg border border-slate-700 cursor-pointer transition-colors inline-flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> ატვირთვა
              </label>
            </div>
          </div>

          {/* Cover Photo Upload */}
          <div className="flex items-center gap-4 border border-slate-800/60 p-3 rounded-xl bg-slate-950/20">
            <div className="relative h-16 w-32 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-700">
              {coverImageUrl ? (
                <img src={coverImageUrl} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-slate-500">გარეკანი</span>
              )}
              {uploadingCover && (
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1">გარეკანის სურათი</label>
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" id="cover-file" />
              <label htmlFor="cover-file" className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg border border-slate-700 cursor-pointer transition-colors inline-flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> ატვირთვა
              </label>
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">სათაური / Headline</label>
            <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="მაგ: Frontend-დეველოპერი, Next.js ექსპერტი" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          {/* Experience level & years */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">გამოცდილების დონე</label>
              <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all">
                <option value="Entry">Entry (დამწყები)</option>
                <option value="Intermediate">Intermediate (საშუალო)</option>
                <option value="Expert">Expert (ექსპერტი)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">გამოცდილების წლები</label>
              <input type="number" min="0" value={yearsOfExperience} onChange={e => setYearsOfExperience(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
          </div>

          {/* Hourly Rate & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">საათობრივი ტარიფი</label>
              <input type="number" min="0" step="0.5" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ვალუტა</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all">
                <option value="GEL">GEL (₾)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Availability & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ხელმისაწვდომობა</label>
              <select value={availability} onChange={e => setAvailability(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all">
                <option value="available">Available (ხელმისაწვდომია)</option>
                <option value="busy">Busy (დაკავებულია)</option>
                <option value="unavailable">Unavailable (არ არის ხელმისაწვდომი)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">მდებარეობა</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="მაგ: ბათუმი, საქართველო" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
          </div>

          {/* Phone & Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ტელეფონი</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+995 599 ..." className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ხილვადობა</label>
              <select value={visibility} onChange={e => setVisibility(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all">
                <option value="public">Public (საჯარო)</option>
                <option value="private">Private (პირადი)</option>
                <option value="connections_only">Connections Only (მხოლოდ კავშირები)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-800 hover:border-slate-700/60 hover:bg-slate-850/30 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer">
              გაუქმება
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} შენახვა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. EDIT ABOUT MODAL
// -------------------------------------------------------------
interface EditAboutModalProps extends ModalProps {
  aboutMe: string;
}

export function EditAboutModal({ isOpen, onClose, workerId, aboutMe, onSuccess }: EditAboutModalProps) {
  const [content, setContent] = useState(aboutMe);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/workers/profile/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about_me: content })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'განახლება ვერ მოხერხდა');
      }

      toast.success('შესავალი წარმატებით განახლდა!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative my-8 overflow-hidden">
        <div className="flex h-14 items-center justify-between px-6 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">შესავალი (ჩემ შესახებ)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} placeholder="დაწერეთ თქვენს პროფესიულ გამოცდილებაზე, მიზნებსა და უნარებზე..." className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:border-indigo-500 focus:outline-none transition-all resize-y" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-800 hover:border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer">
              გაუქმება
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} შენახვა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. ADD / EDIT EXPERIENCE MODAL
// -------------------------------------------------------------
interface AddEditExperienceModalProps extends ModalProps {
  experience?: WorkerExperience;
}

export function AddEditExperienceModal({ isOpen, onClose, workerId, experience, onSuccess }: AddEditExperienceModalProps) {
  const [title, setTitle] = useState(experience?.title || '');
  const [companyName, setCompanyName] = useState(experience?.company_name || '');
  const [location, setLocation] = useState(experience?.location || '');
  const [startDate, setStartDate] = useState(experience?.start_date ? new Date(experience.start_date).toISOString().split('T')[0] : '');
  const [endDate, setEndDate] = useState(experience?.end_date ? new Date(experience.end_date).toISOString().split('T')[0] : '');
  const [isCurrent, setIsCurrent] = useState(experience?.is_current || false);
  const [description, setDescription] = useState(experience?.description || '');

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim() || !startDate) {
      toast.error('გთხოვთ შეავსოთ სავალდებულო ველები');
      return;
    }

    setLoading(true);
    try {
      const url = `/api/workers/profile/${workerId}/experiences`;
      const method = experience ? 'PUT' : 'POST';
      const body = {
        id: experience?.id,
        title,
        company_name: companyName,
        location,
        start_date: startDate,
        end_date: isCurrent ? null : endDate,
        is_current: isCurrent,
        description
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'შენახვა ვერ მოხერხდა');
      }

      toast.success(experience ? 'გამოცდილება განახლდა!' : 'გამოცდილება დაემატა!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!experience) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/workers/profile/${workerId}/experiences?id=${experience.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'წაშლა ვერ მოხერხდა');
      }

      toast.success('გამოცდილება წაიშალა');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative my-8 overflow-hidden">
        <div className="flex h-14 items-center justify-between px-6 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">{experience ? 'გამოცდილების რედაქტირება' : 'გამოცდილების დამატება'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">თანამდებობა / როლი *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="მაგ: Lead Developer" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">კომპანია / ორგანიზაცია *</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="მაგ: Digit" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">მდებარეობა</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="მაგ: თბილისი, Remote" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          {/* Current position */}
          <div className="flex items-center gap-2 py-1">
            <input type="checkbox" id="is_current" checked={isCurrent} onChange={e => setIsCurrent(e.target.checked)} className="rounded border-slate-800 text-indigo-650 focus:ring-indigo-500 h-4 w-4 bg-slate-950" />
            <label htmlFor="is_current" className="text-xs font-semibold text-slate-350 cursor-pointer">ამჟამად ვმუშაობ ამ პოზიციაზე</label>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">დაწყების თარიღი *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            {!isCurrent && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">დასრულების თარიღი</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">აღწერა</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="აღწერეთ თქვენი ძირითადი მოვალეობები და მიღწევები..." className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all resize-y" />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            {experience ? (
              <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} წაშლა
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-800 hover:border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer">
                გაუქმება
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} შენახვა
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. ADD / EDIT EDUCATION MODAL
// -------------------------------------------------------------
interface AddEditEducationModalProps extends ModalProps {
  education?: WorkerEducation;
}

export function AddEditEducationModal({ isOpen, onClose, workerId, education, onSuccess }: AddEditEducationModalProps) {
  const [institution, setInstitution] = useState(education?.institution || '');
  const [degree, setDegree] = useState(education?.degree || '');
  const [fieldOfStudy, setFieldOfStudy] = useState(education?.field_of_study || '');
  const [startDate, setStartDate] = useState(education?.start_date ? new Date(education.start_date).toISOString().split('T')[0] : '');
  const [endDate, setEndDate] = useState(education?.end_date ? new Date(education.end_date).toISOString().split('T')[0] : '');
  const [description, setDescription] = useState(education?.description || '');

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution.trim() || !degree.trim() || !startDate) {
      toast.error('გთხოვთ შეავსოთ სავალდებულო ველები');
      return;
    }

    setLoading(true);
    try {
      const url = `/api/workers/profile/${workerId}/educations`;
      const method = education ? 'PUT' : 'POST';
      const body = {
        id: education?.id,
        institution,
        degree,
        field_of_study: fieldOfStudy,
        start_date: startDate,
        end_date: endDate || null,
        description
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'შენახვა ვერ მოხერხდა');
      }

      toast.success(education ? 'განათლება განახლდა!' : 'განათლება დაემატა!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!education) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/workers/profile/${workerId}/educations?id=${education.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'წაშლა ვერ მოხერხდა');
      }

      toast.success('განათლება წაიშალა');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative my-8 overflow-hidden">
        <div className="flex h-14 items-center justify-between px-6 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">{education ? 'განათლების რედაქტირება' : 'განათლების დამატება'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Institution */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">სასწავლებელი / უნივერსიტეტი *</label>
            <input type="text" value={institution} onChange={e => setInstitution(e.target.value)} required placeholder="მაგ: თსუ" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          {/* Degree */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ხარისხი / აკადემიური წოდება *</label>
            <input type="text" value={degree} onChange={e => setDegree(e.target.value)} required placeholder="მაგ: ბაკალავრი" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          {/* Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">სპეციალობა / ფაკულტეტი</label>
            <input type="text" value={fieldOfStudy} onChange={e => setFieldOfStudy(e.target.value)} placeholder="მაგ: კომპიუტერული მეცნიერებები" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">დაწყების თარიღი *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">დასრულების თარიღი</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">დამატებითი ინფორმაცია / აღწერა</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="საკურსო ნაშრომები, აქტივობები..." className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all resize-y" />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            {education ? (
              <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} წაშლა
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-800 hover:border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer">
                გაუქმება
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} შენახვა
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. ADD / EDIT PORTFOLIO MODAL
// -------------------------------------------------------------
interface AddEditPortfolioModalProps extends ModalProps {
  project?: PortfolioProject;
}

export function AddEditPortfolioModal({ isOpen, onClose, workerId, project, onSuccess }: AddEditPortfolioModalProps) {
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [githubUrl, setGithubUrl] = useState(project?.github_url || '');
  const [liveUrl, setLiveUrl] = useState(project?.live_url || '');
  const [completionDate, setCompletionDate] = useState(project?.completion_date ? new Date(project.completion_date).toISOString().split('T')[0] : '');
  const [images, setImages] = useState<string[]>(project?.images || []);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadFile(file);
      setImages([...images, url]);
      toast.success('სურათი დაემატა!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('სათაური სავალდებულოა');
      return;
    }

    setLoading(true);
    try {
      const url = `/api/workers/profile/${workerId}/portfolio`;
      const method = project ? 'PUT' : 'POST';
      const body = {
        id: project?.id,
        title,
        description,
        github_url: githubUrl,
        live_url: liveUrl,
        completion_date: completionDate || null,
        images
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'შენახვა ვერ მოხერხდა');
      }

      toast.success(project ? 'პროექტი განახლდა!' : 'პროექტი დაემატა!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/workers/profile/${workerId}/portfolio?id=${project.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'წაშლა ვერ მოხერხდა');
      }

      toast.success('პროექტი წაიშალა');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative my-8 overflow-hidden">
        <div className="flex h-14 items-center justify-between px-6 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">{project ? 'პროექტის რედაქტირება' : 'ნამუშევრის დამატება'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">პროექტის სახელი *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="მაგ: ონლაინ მაღაზია" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">აღწერა</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="მოკლედ აღწერეთ პროექტი და თქვენი წვლილი მასში..." className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all resize-y" />
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GitHub URL</label>
              <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Live Demo URL</label>
              <input type="url" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
          </div>

          {/* Completion Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">დასრულების თარიღი</label>
            <input type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          {/* Project Images */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">სურათების გალერეა</label>
            
            {/* Gallery Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative h-16 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden group">
                    <img src={img} alt="project image" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute inset-0 bg-rose-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Trash2 className="h-4 w-4 text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="portfolio-file" />
            <label htmlFor="portfolio-file" className="w-full border border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 py-4 rounded-xl flex flex-col items-center justify-center text-xs text-slate-400 cursor-pointer transition-all">
              {uploadingImage ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-slate-500 mb-1.5" />
                  სურათის დამატება
                </>
              )}
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            {project ? (
              <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} წაშლა
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-800 hover:border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer">
                გაუქმება
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} შენახვა
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 6. ADD / EDIT CERTIFICATION MODAL
// -------------------------------------------------------------
interface AddEditCertificationModalProps extends ModalProps {
  certification?: WorkerCertification;
}

export function AddEditCertificationModal({ isOpen, onClose, workerId, certification, onSuccess }: AddEditCertificationModalProps) {
  const [name, setName] = useState(certification?.name || '');
  const [issuingOrganization, setIssuingOrganization] = useState(certification?.issuing_organization || '');
  const [issueDate, setIssueDate] = useState(certification?.issue_date ? new Date(certification.issue_date).toISOString().split('T')[0] : '');
  const [expirationDate, setExpirationDate] = useState(certification?.expiration_date ? new Date(certification.expiration_date).toISOString().split('T')[0] : '');
  const [credentialId, setCredentialId] = useState(certification?.credential_id || '');
  const [credentialUrl, setCredentialUrl] = useState(certification?.credential_url || '');

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !issuingOrganization.trim() || !issueDate) {
      toast.error('გთხოვთ შეავსოთ სავალდებულო ველები');
      return;
    }

    setLoading(true);
    try {
      const url = `/api/workers/profile/${workerId}/certifications`;
      const method = certification ? 'PUT' : 'POST';
      const body = {
        id: certification?.id,
        name,
        issuing_organization: issuingOrganization,
        issue_date: issueDate,
        expiration_date: expirationDate || null,
        credential_id: credentialId,
        credential_url: credentialUrl
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'შენახვა ვერ მოხერხდა');
      }

      toast.success(certification ? 'სერტიფიკატი განახლდა!' : 'სერტიფიკატი დაემატა!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!certification) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/workers/profile/${workerId}/certifications?id=${certification.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'წაშლა ვერ მოხერხდა');
      }

      toast.success('სერტიფიკატი წაიშალა');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative my-8 overflow-hidden">
        <div className="flex h-14 items-center justify-between px-6 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">{certification ? 'სერტიფიკატის რედაქტირება' : 'სერტიფიკატის დამატება'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">სერტიფიკატის დასახელება *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="მაგ: AWS Certified Solutions Architect" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          {/* Org */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">გამცემი ორგანიზაცია *</label>
            <input type="text" value={issuingOrganization} onChange={e => setIssuingOrganization(e.target.value)} required placeholder="მაგ: Amazon Web Services" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">გაცემის თარიღი *</label>
              <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">მოქმედების ვადა</label>
              <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
          </div>

          {/* Credential info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">სერტიფიკატის ID</label>
              <input type="text" value={credentialId} onChange={e => setCredentialId(e.target.value)} placeholder="მაგ: AWS-12345" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">სერტიფიკატის ბმული</label>
              <input type="url" value={credentialUrl} onChange={e => setCredentialUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            {certification ? (
              <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} წაშლა
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-800 hover:border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer">
                გაუქმება
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} შენახვა
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 7. ADD LANGUAGE MODAL
// -------------------------------------------------------------
export function AddEditLanguageModal({ isOpen, onClose, workerId, onSuccess }: ModalProps) {
  const [languageName, setLanguageName] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('conversational');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!languageName.trim()) {
      toast.error('შეიყვანეთ ენის დასახელება');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/workers/profile/${workerId}/languages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language_name: languageName,
          proficiency_level: proficiencyLevel
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'შენახვა ვერ მოხერხდა');
      }

      toast.success('ენა წარმატებით დაემატა!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative my-8 overflow-hidden">
        <div className="flex h-14 items-center justify-between px-6 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">ენის დამატება</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ენა *</label>
            <input type="text" value={languageName} onChange={e => setLanguageName(e.target.value)} required placeholder="მაგ: ქართული, ინგლისური" className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ფლობის დონე</label>
            <select value={proficiencyLevel} onChange={e => setProficiencyLevel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all">
              <option value="elementary">Elementary (დაწყებითი)</option>
              <option value="conversational">Conversational (სასაუბრო)</option>
              <option value="professional">Professional (პროფესიული)</option>
              <option value="fluent">Fluent (თავისუფლად)</option>
              <option value="native">Native (მშობლიური)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-800 hover:border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer">
              გაუქმება
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} შენახვა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 8. EDIT SOCIALS MODAL
// -------------------------------------------------------------
interface EditSocialsModalProps extends ModalProps {
  socialLinks: WorkerSocialLink[];
}

export function EditSocialsModal({ isOpen, onClose, workerId, socialLinks, onSuccess }: EditSocialsModalProps) {
  const getUrl = (plat: string) => socialLinks.find(s => s.platform.toLowerCase() === plat.toLowerCase())?.url || '';

  const [github, setGithub] = useState(() => getUrl('github'));
  const [linkedin, setLinkedin] = useState(() => getUrl('linkedin'));
  const [website, setWebsite] = useState(() => getUrl('website'));
  const [facebook, setFacebook] = useState(() => getUrl('facebook'));
  const [instagram, setInstagram] = useState(() => getUrl('instagram'));
  const [behance, setBehance] = useState(() => getUrl('behance'));
  const [dribbble, setDribbble] = useState(() => getUrl('dribbble'));

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const saveSocial = async (platform: string, url: string) => {
    await fetch(`/api/workers/profile/${workerId}/socials`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, url })
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Promise.all([
        saveSocial('GitHub', github),
        saveSocial('LinkedIn', linkedin),
        saveSocial('Website', website),
        saveSocial('Facebook', facebook),
        saveSocial('Instagram', instagram),
        saveSocial('Behance', behance),
        saveSocial('Dribbble', dribbble)
      ]);

      toast.success('სოციალური ბმულები განახლდა!');
      onSuccess();
      onClose();
    } catch {
      toast.error('ბმულების განახლება ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative my-8 overflow-hidden">
        <div className="flex h-14 items-center justify-between px-6 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">სოციალური ბმულები</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GitHub</label>
              <input type="url" value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/..." className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">LinkedIn</label>
              <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">პერსონალური საიტი</label>
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Facebook</label>
              <input type="url" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Instagram</label>
              <input type="url" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Behance</label>
              <input type="url" value={behance} onChange={e => setBehance(e.target.value)} placeholder="https://behance.net/..." className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dribbble</label>
              <input type="url" value={dribbble} onChange={e => setDribbble(e.target.value)} placeholder="https://dribbble.com/..." className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-all animate-all" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-800 hover:border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer">
              გაუქმება
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} შენახვა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 9. EDIT SKILLS MODAL
// -------------------------------------------------------------
interface EditSkillsModalProps extends ModalProps {
  skills: Skill[];
}

export function EditSkillsModal({ isOpen, onClose, workerId, skills, onSuccess }: EditSkillsModalProps) {
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/workers/profile/${workerId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSkill })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'უნარის დამატება ვერ მოხერხდა');
      }

      setNewSkill('');
      toast.success('უნარი დაემატა!');
      onSuccess();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'უნარის დამატება ვერ მოხერხდა';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (skillId: string) => {
    setRemovingId(skillId);
    try {
      const res = await fetch(`/api/workers/profile/${workerId}/skills?id=${skillId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'წაშლა ვერ მოხერხდა');
      }

      toast.success('უნარი წაიშალა');
      onSuccess();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'წაშლა ვერ მოხერხდა';
      toast.error(errMsg);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative my-8 overflow-hidden">
        <div className="flex h-14 items-center justify-between px-6 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">პროფესიული უნარები</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add skill form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="მაგ: React, TailwindCSS, Figma" className="flex-1 px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:border-indigo-500 focus:outline-none transition-all" />
            <button type="submit" disabled={loading || !newSkill.trim()} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} დამატება
            </button>
          </form>

          {/* Existing skills list */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">თქვენი უნარები</label>
            {skills.length === 0 ? (
              <p className="text-xs text-slate-550 italic text-center py-4">უნარები ჯერ არ დაგიმატებიათ</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-850 rounded-xl bg-slate-950/10">
                {skills.map(skill => (
                  <span key={skill.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700">
                    {skill.name}
                    <button type="button" onClick={() => handleRemove(skill.id)} disabled={removingId === skill.id} className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50">
                      {removingId === skill.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700/80 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors">
              დასრულება
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
