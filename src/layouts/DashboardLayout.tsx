import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Home, LogOut, User, Settings, FileText, Calendar, Image, Users, ShieldCheck, ScrollText, UserCog, Award, CreditCard } from 'lucide-react';
import { classNames } from '@/utils/format';
import { canManageUsers, canViewAuditLogs, canCreateCommitteeAccounts, canManageDistrictContent, canManageUpazilaContent } from '@/utils/rbac';
import { ROLE_LABELS, type UserRole } from '@/types';
import toast from 'react-hot-toast';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

function buildNavLinks(role: UserRole | undefined): NavItem[] {
  const links: NavItem[] = [{ to: '/dashboard', label: 'ওভারভিউ', icon: LayoutDashboard, end: true }];

  // Content management — committee/admin
  if (canManageDistrictContent(role) || canManageUpazilaContent(role)) {
    links.push({ to: '/dashboard/notices', label: 'নোটিশ', icon: FileText });
    links.push({ to: '/dashboard/events', label: 'আয়োজন', icon: Calendar });
    links.push({ to: '/dashboard/gallery', label: 'গ্যালারি', icon: Image });
  }

  // User management — admins only
  if (canManageUsers(role)) {
    links.push({ to: '/dashboard/users', label: 'ব্যবহারকারী', icon: UserCog });
  }

  // Committee account creation / management — district & upazila admin
  if (canCreateCommitteeAccounts(role)) {
    links.push({ to: '/dashboard/create-committee', label: 'কমিটি ব্যবস্থাপনা', icon: Award });
  }

  // Audit logs — admins only
  if (canViewAuditLogs(role)) {
    links.push({ to: '/dashboard/audit', label: 'অডিট লগ', icon: ScrollText });
  }

  // Members directory — everyone
  links.push({ to: '/dashboard/members', label: 'সদস্য', icon: Users });
  links.push({ to: '/dashboard/membership', label: 'মেম্বারশিপ ও পেমেন্ট', icon: CreditCard });

  links.push({ to: '/dashboard/profile', label: 'প্রোফাইল', icon: User });
  links.push({ to: '/dashboard/settings', label: 'সেটিংস', icon: Settings });

  return links;
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('সফলভাবে লগআউট হয়েছে');
      navigate('/');
    } catch {
      toast.error('লগআউটে সমস্যা হয়েছে');
    }
  };

  const navLinks = buildNavLinks(user?.role);

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-3xl border border-gray-200/80 bg-white/90 dark:border-gray-800/80 dark:bg-gray-900/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
              <div className="flex items-center gap-3.5 px-1 pb-5 mb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-bd-green-600 to-emerald-500 text-white font-bold text-lg shadow-[0_4px_16px_rgba(5,150,105,0.3)] shrink-0">
                    {user?.photoURL && !user.photoURL.startsWith('blob:') ? (
                      <img
                        src={user.photoURL}
                        alt="avatar"
                        className="h-full w-full rounded-2xl object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      user?.displayName?.[0] ?? user?.email?.[0] ?? 'U'
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {user?.displayName ?? 'সদস্য'}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-0.5 rounded-md bg-bd-green-50 dark:bg-bd-green-900/30 px-2 py-0.5 text-[11px] font-semibold text-bd-green-700 dark:text-bd-green-300">
                    {user ? ROLE_LABELS[user.role] : ''}
                  </span>
                </div>
              </div>
              
              <nav className="space-y-1">
                {navLinks.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      classNames(
                        'group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-bd-green-600 to-emerald-600 text-white shadow-[0_4px_16px_rgba(5,150,105,0.25)]'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                      )
                    }
                  >
                    <l.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    {l.label}
                  </NavLink>
                ))}
              </nav>
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
                <Link to="/" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 transition">
                  <Home className="h-4 w-4 text-gray-400" /> ওয়েবসাইটে ফিরুন
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition">
                  <LogOut className="h-4 w-4" /> লগআউট
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
