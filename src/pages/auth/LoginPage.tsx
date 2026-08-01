import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, LogIn, Eye, EyeOff, RotateCcw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useAuth, AuthError } from '@/context/AuthContext';

interface FormValues {
  email: string;
  password: string;
  remember: boolean;
}

export function LoginPage() {
  const { login, resetPassword, logout } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<FormValues>({
    defaultValues: { remember: true },
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await login({ email: data.email, password: data.password, remember: data.remember });
      toast.success('সফলভাবে লগইন হয়েছে');
      navigate('/dashboard');
    } catch (e) {
      if (e instanceof AuthError) {
        if (e.code === 'EMAIL_NOT_VERIFIED') navigate('/verify-email');
        else if (e.code === 'ACCOUNT_SUSPENDED' || e.code === 'ACCOUNT_DELETED') navigate('/unauthorized');
        else toast.error(e.message || 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।');
      } else {
        toast.error('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। নিচের রিকভারি থেকে নতুন অ্যাকাউন্ট সেটআপ করুন।');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleClearSession = async () => {
    try {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      setValue('email', '');
      setValue('password', '');
      toast.success('পুরনো সেশন রিমুভ করা হয়েছে! নতুনভাবে প্রবেশ করুন।');
    } catch {
      localStorage.clear();
      toast.success('সেশন রিমুভ করা হয়েছে');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">লগইন করুন</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
        </div>
        <button
          onClick={handleClearSession}
          className="chip bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] flex items-center gap-1"
          title="পুরনো জমা রাখা সেশন মুছুন"
        >
          <Trash2 className="h-3 w-3" /> সেশন রিসেট
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">ইমেইল ঠিকানা</label>
          <div className="relative mt-1">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              className="input pl-10"
              placeholder="email@example.com"
              {...register('email', { required: 'ইমেইল আবশ্যক' })}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-bd-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">পাসওয়ার্ড</label>
          <div className="relative mt-1">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type={showPass ? 'text' : 'password'}
              className="input pl-10 pr-10"
              placeholder="••••••••"
              {...register('password', { required: 'পাসওয়ার্ড আবশ্যক', minLength: { value: 6, message: 'কমপক্ষে ৬ অক্ষর' } })}
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-bd-red-600">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300 cursor-pointer select-none">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-bd-green-600 focus:ring-bd-green-500" {...register('remember')} />
            আমাকে মনে রাখুন
          </label>
          <Link to="/forgot-password" className="font-semibold text-bd-green-700 dark:text-bd-green-300 hover:underline">
            পাসওয়ার্ড ভুলে গেছেন?
          </Link>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <LogIn className="h-4 w-4" /> {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center space-y-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          অ্যাকাউন্ট নেই?{' '}
          <Link to="/register" className="font-bold text-bd-green-700 dark:text-bd-green-300 hover:underline">
            নিবন্ধন করুন
          </Link>
        </p>

      </div>
    </div>
  );
}
