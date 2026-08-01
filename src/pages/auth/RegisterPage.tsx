import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, UserPlus, GraduationCap, BookOpen, Award, Phone, Building, Droplet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useAuth, AuthError } from '@/context/AuthContext';
import type { UserRole, UpazilaName, MemberProfile } from '@/types';
import { UPAZILA_OPTIONS, ROLE_LABELS, DEPARTMENTS, SESSIONS, HALLS, BLOOD_GROUPS } from '@/types';

interface FormValues {
  name: string;
  email: string;
  password: string;
  confirm: string;
  role: Extract<UserRole, 'student' | 'teacher' | 'alumni'>;
  upazila: UpazilaName;
  department: string;
  session: string;
  phone: string;
  hall: string;
  bloodGroup: MemberProfile['bloodGroup'];
}

const roleOptions: { value: FormValues['role']; label: string; icon: typeof GraduationCap }[] = [
  { value: 'student', label: ROLE_LABELS.student, icon: GraduationCap },
  { value: 'teacher', label: ROLE_LABELS.teacher, icon: BookOpen },
  { value: 'alumni', label: ROLE_LABELS.alumni, icon: Award },
];

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      role: 'student',
      upazila: 'ঝিনাইদহ সদর',
      department: DEPARTMENTS[0],
      session: '২০২২-২৩',
      hall: HALLS[0],
      bloodGroup: 'B+',
    },
  });
  const [loading, setLoading] = useState(false);
  const [customSession, setCustomSession] = useState('');
  const password = watch('password');
  const watchedSession = watch('session');

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const finalSession = data.session === 'custom' ? (customSession.trim() || 'অনুল্লেখিত') : data.session;
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        upazila: data.upazila,
        department: data.department,
        session: finalSession,
        phone: data.phone,
        hall: data.hall,
        bloodGroup: data.bloodGroup,
      });
      toast.success('নিবন্ধন সফল! আপনার প্রোফাইল সদস্য তালিকায় যোগ হয়েছে।');
      navigate('/members');
    } catch (e) {
      if (e instanceof AuthError) toast.error(e.message);
      else toast.error('নিবন্ধন ব্যর্থ। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">নিবন্ধন করুন</h1>
      <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">শিক্ষার্থী, শিক্ষক ও প্রাক্তন ছাত্ররা নিবন্ধন করে সদস্য তালিকায় যুক্ত হতে পারেন</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {/* Role selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">আপনি কোন পরিচয়ে?</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {roleOptions.map((r) => (
              <label key={r.value} className="cursor-pointer">
                <input type="radio" value={r.value} className="peer sr-only" {...register('role')} />
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center transition peer-checked:border-bd-green-600 peer-checked:bg-bd-green-50 dark:peer-checked:bg-bd-green-900/30 hover:border-bd-green-400">
                  <r.icon className="mx-auto h-5 w-5 text-bd-green-600" />
                  <p className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300">{r.label}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">পূর্ণ নাম</label>
          <div className="relative mt-1.5">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input className="input pl-10" placeholder="আপনার নাম" {...register('name', { required: 'নাম আবশ্যক' })} />
          </div>
          {errors.name && <p className="mt-1 text-xs text-bd-red-600">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">মোবাইল নম্বর (Phone)</label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input className="input pl-10" placeholder="017xxxxxxxx" {...register('phone', { required: 'ফোন নম্বর আবশ্যক' })} />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-bd-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">উপজেলা</label>
            <select className="input mt-1.5" {...register('upazila', { required: 'উপজেলা আবশ্যক' })}>
              {UPAZILA_OPTIONS.map((u) => (
                <option key={u} value={u ?? ''}>{u}</option>
              ))}
            </select>
            {errors.upazila && <p className="mt-1 text-xs text-bd-red-600">{errors.upazila.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">বিভাগ (Department)</label>
            <select className="input mt-1.5" {...register('department', { required: 'বিভাগ আবশ্যক' })}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">সেশন (Session)</label>
            <select className="input mt-1.5" {...register('session', { required: 'সেশন আবশ্যক' })}>
              {SESSIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="custom">অন্যান্য (সেশন নিজে লিখুন)</option>
            </select>
            {watchedSession === 'custom' && (
              <input
                type="text"
                className="input mt-2"
                placeholder="যেমন: ১৯৯০-৯১ বা 1990-91"
                value={customSession}
                onChange={(e) => setCustomSession(e.target.value)}
                required
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">হল (Hall)</label>
            <div className="relative mt-1.5">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
              <select className="input pl-10" {...register('hall', { required: 'হল আবশ্যক' })}>
                {HALLS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">রক্তের গ্রুপ</label>
            <div className="relative mt-1.5">
              <Droplet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
              <select className="input pl-10" {...register('bloodGroup')}>
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ইমেইল (Email)</label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="email" className="input pl-10" placeholder="email@example.com" {...register('email', { required: 'ইমেইল আবশ্যক' })} />
            </div>
            {errors.email && <p className="mt-1 text-xs text-bd-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ফোন (ঐচ্ছিক/গোপনীয়)</label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="tel" className="input pl-10" placeholder="01711000000 (ঐচ্ছিক)" {...register('phone')} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">পাসওয়ার্ড</label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="password" className="input pl-10" placeholder="••••••••" {...register('password', { required: 'পাসওয়ার্ড আবশ্যক', minLength: { value: 6, message: 'কমপক্ষে ৬ অক্ষর' } })} />
            </div>
            {errors.password && <p className="mt-1 text-xs text-bd-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">নিশ্চিত করুন</label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="password" className="input pl-10" placeholder="••••••••" {...register('confirm', { required: 'নিশ্চিতকরণ আবশ্যক', validate: (v) => v === password || 'পাসওয়ার্ড মেলেনি' })} />
            </div>
            {errors.confirm && <p className="mt-1 text-xs text-bd-red-600">{errors.confirm.message}</p>}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <UserPlus className="h-4 w-4" /> {loading ? 'প্রক্রিয়াকরণ...' : 'নিবন্ধন করুন'}
        </button>
      </form>

      <div className="mt-5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          কমিটি সদস্যরা স্ব-নিবন্ধন করতে পারবেন না। কমিটি অ্যাকাউন্ট শুধু জেলা প্রশাসক তৈরি করতে পারেন।
        </p>
      </div>

      <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
        ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
        <Link to="/login" className="font-semibold text-bd-green-700 dark:text-bd-green-300 hover:underline">
          লগইন করুন
        </Link>
      </p>
    </div>
  );
}
