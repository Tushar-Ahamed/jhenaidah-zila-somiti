import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getMember, updateMember } from '@/services/memberService';
import { writeAuditLog } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import type { UpazilaName, BloodGroup } from '@/types';
import { DEPARTMENTS, SESSIONS, HALLS, BLOOD_GROUPS, UPAZILA_OPTIONS } from '@/types';
import { FadeIn } from '@/components/ui/FadeIn';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Save, ArrowLeft, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface FormValues {
  name: string;
  photo: string;
  department: string;
  session: string;
  hall: string;
  upazila: UpazilaName;
  phone: string;
  email: string;
  bloodGroup: BloodGroup;
  facebook: string;
  linkedin: string;
  bio: string;
}

export function DashboardMemberEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const m = id ? await getMember(id) : null;
      if (!active) return;
      if (!m) { setNotFound(true); setLoading(false); return; }
      reset({
        name: m.name, photo: m.photo, department: m.department, session: m.session,
        hall: m.hall, upazila: m.upazila, phone: m.phone, email: m.email,
        bloodGroup: m.bloodGroup, facebook: m.facebook ?? '', linkedin: m.linkedin ?? '', bio: m.bio,
      });
      setLoading(false);
    })();
    return () => { active = false; };
  }, [id, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    setSaving(true);
    try {
      await updateMember(id, {
        name: data.name, photo: data.photo, department: data.department, session: data.session,
        hall: data.hall, upazila: data.upazila, phone: data.phone, email: data.email,
        bloodGroup: data.bloodGroup,
        facebook: data.facebook || undefined, linkedin: data.linkedin || undefined,
        bio: data.bio,
      });
      await writeAuditLog({ actorId: user!.uid, actorEmail: user!.email ?? '', actorRole: user!.role, action: 'profile_update', targetId: id, targetEmail: data.email, details: `সদস্য প্রোফাইল সম্পাদনা: ${data.name}` });
      toast.success('সদস্য প্রোফাইল হালনাগাদ সম্পন্ন');
      navigate('/dashboard/members');
    } catch {
      toast.error('হালনাগাদ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl"><SkeletonCard /></div>;
  }
  if (notFound) {
    return <EmptyState icon={<User className="h-8 w-8" />} title="সদস্য পাওয়া যায়নি" action={<Link to="/dashboard/members" className="btn-primary">তালিকায় ফিরুন</Link>} />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <FadeIn>
        <Link to="/dashboard/members" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-bd-green-700 dark:hover:text-bd-green-300 mb-2">
          <ArrowLeft className="h-4 w-4" /> সদস্য তালিকায় ফিরুন
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">সদস্য সম্পাদনা</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">সদস্যের প্রোফাইল তথ্য হালনাগাদ করুন</p>
      </FadeIn>

      <FadeIn delay={0.05}>
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ছবি URL</label>
            <input className="input mt-1.5" placeholder="https://..." {...register('photo')} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">নাম</label>
              <input className="input mt-1.5" {...register('name', { required: 'নাম আবশ্যক' })} />
              {errors.name && <p className="mt-1 text-xs text-bd-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ইমেইল</label>
              <input type="email" className="input mt-1.5" {...register('email', { required: 'ইমেইল আবশ্যক' })} />
              {errors.email && <p className="mt-1 text-xs text-bd-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">বিভাগ</label>
              <select className="input mt-1.5" {...register('department')}>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}</select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">সেশন (Session)</label>
              <input className="input mt-1.5" placeholder="যেমন: 2022-23 বা 1990-91" {...register('session')} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">হল</label>
              <select className="input mt-1.5" {...register('hall')}>{HALLS.map((h) => <option key={h} value={h}>{h}</option>)}</select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">উপজেলা</label>
              <select className="input mt-1.5" {...register('upazila')}>{UPAZILA_OPTIONS.map((u) => <option key={u} value={u ?? ''}>{u}</option>)}</select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ফোন</label>
              <input className="input mt-1.5" {...register('phone')} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">রক্তের গ্রুপ</label>
              <select className="input mt-1.5" {...register('bloodGroup')}>
                <option value="">অজানা</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b ?? ''}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</label>
              <input className="input mt-1.5" placeholder="https://facebook.com/..." {...register('facebook')} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</label>
              <input className="input mt-1.5" placeholder="https://linkedin.com/..." {...register('linkedin')} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">পরিচিতি (Bio)</label>
            <textarea rows={4} className="input mt-1.5 resize-none" placeholder="সংক্ষিপ্ত পরিচিতি..." {...register('bio')} />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary"><Save className="h-4 w-4" /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}</button>
            <Link to="/dashboard/members" className="btn-ghost">বাতিল</Link>
          </div>
        </form>
      </FadeIn>
    </div>
  );
}
