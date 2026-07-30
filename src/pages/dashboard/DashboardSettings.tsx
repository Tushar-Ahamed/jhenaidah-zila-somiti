import { useState } from 'react';
import { FadeIn } from '@/components/ui/FadeIn';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Moon, Sun, Bell, Globe, Shield, LogOut, UserCheck, ShieldAlert } from 'lucide-react';
import { classNames } from '@/utils/format';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { isApprovalRequired, setApprovalRequired } from '@/services/settingsService';

export function DashboardSettings() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [approvalReq, setApprovalReq] = useState(isApprovalRequired());

  const handleLogout = async () => {
    await logout();
    toast.success('লগআউট সম্পন্ন হয়েছে');
    navigate('/');
  };

  const handleToggleApproval = () => {
    const next = !approvalReq;
    setApprovalReq(next);
    setApprovalRequired(next);
    toast.success(
      next
        ? 'নিবন্ধন অনুমোদন মোড চালু করা হয়েছে (অ্যাডমিন অনুমোদন আবশ্যক)'
        : 'স্বয়ংক্রিয় অনুমোদন মোড চালু করা হয়েছে (সরাসরি লগইন সম্ভব)'
    );
  };

  const toggles = [
    { icon: theme === 'dark' ? Moon : Sun, label: 'ডার্ক মোড', desc: 'অন্ধকার থিম ব্যবহার করুন', on: theme === 'dark', onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
    { icon: Bell, label: 'নোটিফিকেশন', desc: 'নতুন নোটিশের জন্য বিজ্ঞপ্তি', on: true, onClick: () => toast('নোটিফিকেশন সেটিং পরিবর্তিত') },
    { icon: Globe, label: 'ভাষা', desc: 'বাংলা (প্রদর্শিত)', on: true, onClick: () => toast('ভাষা বাংলায় নির্ধারিত') },
    { icon: Shield, label: 'দ্বি-স্তরীয় নিরাপত্তা', desc: 'অতিরিক্ত সুরক্ষা যোগ করুন', on: false, onClick: () => toast('দ্বি-স্তরীয় নিরাপত্তা ডেমোতে নিষ্ক্রিয়') },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">সেটিংস</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">আপনার পছন্দ ও নিরাপত্তা পরিচালনা করুন</p>
      </FadeIn>

      {/* Security & Registration Control (Admin Only or All Admins) */}
      {(user?.role === 'district_admin' || user?.role === 'upazila_admin') && (
        <FadeIn delay={0.03}>
          <div className="card p-5 border border-bd-green-200 dark:border-bd-green-800/50 bg-bd-green-50/40 dark:bg-bd-green-950/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-bd-green-600 text-white shrink-0">
                  {approvalReq ? <ShieldAlert className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                    সদস্য নিবন্ধনে অ্যাডমিন অনুমোদন ব্যবস্থা
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                    {approvalReq
                      ? '🔒 অনুমোদন মোড চালু (নতুনদের লগইন করতে অ্যাডমিনের অনুমোদন লাগবে)'
                      : '⚡ স্বয়ংক্রিয় মোড চালু (নতুন শিক্ষার্থীরা সরাসরি অ্যাকাউন্ট চালু করতে পারবে)'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleApproval}
                className={classNames(
                  'relative h-6 w-11 rounded-full transition-colors shrink-0',
                  approvalReq ? 'bg-bd-green-600' : 'bg-gray-300 dark:bg-gray-700'
                )}
              >
                <span className={classNames('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', approvalReq ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.05}>
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {toggles.map((t) => (
            <div key={t.label} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-bd-green-50 text-bd-green-600 dark:bg-bd-green-900/30 dark:text-bd-green-300">
                  <t.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.label}</p>
                  <p className="text-xs text-gray-400">{t.desc}</p>
                </div>
              </div>
              <button
                onClick={t.onClick}
                className={classNames(
                  'relative h-6 w-11 rounded-full transition-colors shrink-0',
                  t.on ? 'bg-bd-green-600' : 'bg-gray-300 dark:bg-gray-700'
                )}
              >
                <span className={classNames('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', t.on ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="card p-5 border border-bd-red-100 dark:border-bd-red-900/40">
          <h3 className="font-semibold text-bd-red-700 dark:text-bd-red-300">বিপজ্জনক অঞ্চল</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">অ্যাকাউন্ট থেকে লগআউট করুন।</p>
          <button onClick={handleLogout} className="btn-danger mt-4">
            <LogOut className="h-4 w-4" /> লগআউট
          </button>
        </div>
      </FadeIn>
    </div>
  );
}
