import { useState, useEffect } from 'react';
import { FadeIn, StaggerGroup, StaggerItem } from '@/components/ui/FadeIn';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS, POSITIONS, UPAZILA_OPTIONS, type UserRole, type UpazilaName, type MemberProfile } from '@/types';
import { NOTICES, EVENTS, ACTIVITIES, UPAZILAS } from '@/data/sampleData';
import { MEMBERS } from '@/data/membersData';
import { toBnNumber, formatBnDate, isUpcoming } from '@/utils/format';
import { listMembers } from '@/services/memberService';
import { listEvents, listNotices } from '@/services/contentService';
import { listAlbums } from '@/services/albumService';
import { listMembershipPayments } from '@/services/membershipService';
import { listPendingUsers, updateUserStatus, listAllUsers, listAuditLogs, writeAuditLog } from '@/services/userService';
import { assignCommitteePosition } from '@/services/committeeService';
import {
  Users, FileText, CalendarDays, Activity, TrendingUp, ArrowUpRight, Pin,
  GraduationCap, BookOpen, Award, MapPin, ShieldCheck, UserCog, ScrollText,
  DollarSign, Image as ImageIcon, Search, CheckCircle2, XCircle, Settings,
  Download, Plus, Sparkles, Filter, Check, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import { canManageUsers, canCreateCommitteeAccounts, canViewAuditLogs, canManageUpazilaContent, canManageDistrictContent, isDistrictAdmin } from '@/utils/rbac';
import toast from 'react-hot-toast';

const growthData = [
  { month: 'জানু', members: 120 },
  { month: 'ফেব্রু', members: 185 },
  { month: 'মার্চ', members: 240 },
  { month: 'এপ্রিল', members: 310 },
  { month: 'মে', members: 390 },
  { month: 'জুন', members: 460 },
  { month: 'জুলাই', members: 520 },
];

const upazilaData = [
  { name: 'সদর', value: 145 },
  { name: 'কালীগঞ্জ', value: 98 },
  { name: 'কোটচাঁদপুর', value: 74 },
  { name: 'মহেশপুর', value: 62 },
  { name: 'শৈলকূপা', value: 85 },
  { name: 'হরিণাকুণ্ডু', value: 56 },
];

const paymentPieData = [
  { name: 'পরিশোধিত (Paid)', value: 340 },
  { name: 'প্রক্রিয়াধীন (Pending)', value: 85 },
  { name: 'মেয়াদোত্তীর্ণ (Expired)', value: 45 },
];

const PIE_COLORS = ['#059669', '#f59e0b', '#ef4444'];

export function DashboardHome() {
  const { user } = useAuth();
  const role = user?.role;
  const isSuperAdmin = isDistrictAdmin(role) || role === 'district_admin';

  // Live Stats State
  const [allMembers, setAllMembers] = useState<MemberProfile[]>([]);
  const [eventsCount, setEventsCount] = useState(EVENTS.length);
  const [noticesCount, setNoticesCount] = useState(NOTICES.length);
  const [albumsCount, setAlbumsCount] = useState(12);
  const [totalCollection, setTotalCollection] = useState(245000);
  const [paidMembersCount, setPaidMembersCount] = useState(340);
  const [pendingTeachers, setPendingTeachers] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Member Search & Committee Assign State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [assignPosition, setAssignPosition] = useState(POSITIONS[0]);
  const [assignScope, setAssignScope] = useState<'district' | 'upazila'>('district');
  const [assignUpazila, setAssignUpazila] = useState<UpazilaName>('ঝিনাইদহ সদর');
  const [assigning, setAssigning] = useState(false);

  const loadData = async () => {
    try {
      const [membersList, eventsList, noticesList, albumsList, paymentsList, pendingList, auditList] = await Promise.all([
        listMembers(),
        listEvents(),
        listNotices(),
        listAlbums(),
        listMembershipPayments(),
        listPendingUsers(),
        listAuditLogs(10),
      ]);

      if (membersList.length > 0) setAllMembers(membersList);
      if (eventsList.length > 0) setEventsCount(eventsList.length);
      if (noticesList.length > 0) setNoticesCount(noticesList.length);
      if (albumsList.length > 0) setAlbumsCount(albumsList.length);

      if (paymentsList.length > 0) {
        const paid = paymentsList.filter((p) => p.status === 'paid');
        setPaidMembersCount(paid.length);
        setTotalCollection(paid.reduce((sum, p) => sum + p.amount, 0));
      }

      setPendingTeachers(pendingList.filter((u) => u.role === 'teacher' || u.status === 'pending'));
      setRecentLogs(auditList);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Counts
  const studentsCount = allMembers.filter((m) => m.status === 'student').length;
  const teachersCount = allMembers.filter((m) => m.status === 'teacher').length;
  const alumniCount = allMembers.filter((m) => m.status === 'alumni').length;
  const districtCommitteeCount = 21; // Standard executive size
  const upazilaCommitteeCount = 6 * 15; // 6 upazilas
  const totalCommitteeCount = districtCommitteeCount + upazilaCommitteeCount;

  // Searched Members
  const searchedMembers = searchQuery.trim()
    ? allMembers.filter((m) =>
        [m.name, m.email, m.phone, m.department, m.upazila].join(' ').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleApproveTeacher = async (uid: string) => {
    try {
      await updateUserStatus(uid, 'active', user!.uid);
      await writeAuditLog({
        actorId: user!.uid,
        actorEmail: user!.email ?? '',
        actorRole: user!.role,
        action: 'user_approved',
        targetId: uid,
        details: 'শিক্ষক অ্যাকাউন্ট অনুমোদন করা হয়েছে',
      });
      toast.success('শিক্ষক অ্যাকাউন্ট অনুমোদিত হয়েছে');
      await loadData();
    } catch {
      toast.error('অনুমোদনে সমস্যা হয়েছে');
    }
  };

  const handleRejectTeacher = async (uid: string) => {
    try {
      await updateUserStatus(uid, 'suspended', user!.uid);
      toast.success('অ্যাকাউন্ট প্রত্যাখান করা হয়েছে');
      await loadData();
    } catch {
      toast.error('প্রত্যাখ্যানে সমস্যা হয়েছে');
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedMember) return;
    setAssigning(true);
    try {
      await assignCommitteePosition({
        session: '২০২৬-২৭',
        scope: assignScope,
        upazila: assignScope === 'upazila' ? assignUpazila : undefined,
        name: selectedMember.name,
        photoUrl: selectedMember.photo,
        position: assignPosition,
        department: selectedMember.department,
        studentSession: selectedMember.session,
        phone: selectedMember.phone,
        email: selectedMember.email,
        assignedBy: user?.email ?? undefined,
      });

      await writeAuditLog({
        actorId: user!.uid,
        actorEmail: user!.email ?? '',
        actorRole: user!.role,
        action: 'committee_assigned',
        targetId: selectedMember.id,
        details: `কমিটি পদবি প্রদান: ${assignPosition} (${selectedMember.name})`,
      });

      toast.success(`${selectedMember.name}-কে ${assignPosition} পদবি সফলভাবে প্রদান করা হয়েছে`);
      setSelectedMember(null);
      setSearchQuery('');
    } catch {
      toast.error('পদবি প্রদানে সমস্যা হয়েছে');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Welcome Banner */}
      <FadeIn>
        <div className="rounded-3xl bg-gradient-to-r from-bd-green-900 via-emerald-800 to-teal-950 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-500/30">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
            <ShieldCheck className="h-96 w-96 text-white" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur border border-white/20 shadow-inner shrink-0">
                <ShieldCheck className="h-8 w-8 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">জেলা সুপার ড্যাশবোর্ড (Super Admin)</h1>
                  <Badge variant="amber" className="text-xs">সুপার অ্যাডমিন</Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-emerald-100">
                  ঝিনাইদহ জেলা সমিতি · সর্বমোট সদস্য, শিক্ষক অনুমোদন, কমিটি পদবি ও তহবিল সংগ্রহ ড্যাশবোর্ড
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (printWin) {
                    printWin.document.write(`<html><head><title>রিপোর্ট</title></head><body><h1>ঝিনাইদহ জেলা সমিতি - ওভারভিউ রিপোর্ট</h1><p>মোট সদস্য: ${allMembers.length}</p><p>মোট আদায়: ৳ ${totalCollection}</p></body></html>`);
                    printWin.document.close();
                    printWin.print();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs transition flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> রিপোর্ট ডাউনলোড
              </button>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Analytics Cards Grid (10 Stat Cards) */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* 1. Total Members */}
        <div className="card p-4 border-l-4 border-l-bd-green-600">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">মোট সদস্য</p>
            <Users className="h-4 w-4 text-bd-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{toBnNumber(allMembers.length)}</h3>
          <p className="text-[10px] text-emerald-600 mt-1">সব উপজেলা মিলিয়ে</p>
        </div>

        {/* 2. Students */}
        <div className="card p-4 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">শিক্ষার্থী</p>
            <GraduationCap className="h-4 w-4 text-sky-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{toBnNumber(studentsCount)}</h3>
          <p className="text-[10px] text-sky-600 mt-1">বর্তমান অধ্যয়নরত</p>
        </div>

        {/* 3. Teachers */}
        <div className="card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">শিক্ষকবৃন্দ</p>
            <BookOpen className="h-4 w-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{toBnNumber(teachersCount)}</h3>
          <p className="text-[10px] text-amber-600 mt-1">সম্মানিত শিক্ষকগণ</p>
        </div>

        {/* 4. Alumni */}
        <div className="card p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">প্রাক্তন (Alumni)</p>
            <Award className="h-4 w-4 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{toBnNumber(alumniCount)}</h3>
          <p className="text-[10px] text-indigo-600 mt-1">সাবেক শিক্ষার্থীবৃন্দ</p>
        </div>

        {/* 5. Committee Members */}
        <div className="card p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">কমিটি সদস্য</p>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{toBnNumber(totalCommitteeCount)}</h3>
          <p className="text-[10px] text-emerald-600 mt-1">জেলা + ৬ উপজেলা</p>
        </div>

        {/* 6. District Committee */}
        <div className="card p-4 border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">জেলা কমিটি</p>
            <Award className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{toBnNumber(districtCommitteeCount)}</h3>
          <p className="text-[10px] text-purple-600 mt-1">মূল কার্যনির্বাহী কমিটি</p>
        </div>

        {/* 7. Events */}
        <div className="card p-4 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">আয়োজন (Events)</p>
            <CalendarDays className="h-4 w-4 text-teal-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{toBnNumber(eventsCount)}</h3>
          <p className="text-[10px] text-teal-600 mt-1">অনুষ্ঠান ও কর্মসূচি</p>
        </div>

        {/* 8. Memory Albums */}
        <div className="card p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">গ্যালারি অ্যালবাম</p>
            <ImageIcon className="h-4 w-4 text-rose-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{toBnNumber(albumsCount)}</h3>
          <p className="text-[10px] text-rose-600 mt-1">স্মৃতি অ্যালবাম</p>
        </div>

        {/* 9. Notices */}
        <div className="card p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">নোটিশ</p>
            <FileText className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{toBnNumber(noticesCount)}</h3>
          <p className="text-[10px] text-blue-600 mt-1">প্রকাশিত নোটিশসমূহ</p>
        </div>

        {/* 10. Total Collections */}
        <div className="card p-4 border-l-4 border-l-amber-600 bg-amber-50/40 dark:bg-amber-900/10">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase">মোট আদায় (৳)</p>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-2">
            ৳ {totalCollection.toLocaleString('bn-BD')}
          </h3>
          <p className="text-[10px] text-amber-600 mt-1">{paidMembersCount} জন পরিশোধিত</p>
        </div>
      </div>

      {/* Member Fast Search & Committee Assignment Bar */}
      <div className="card p-5 space-y-3 border-2 border-bd-green-500/20 bg-gradient-to-r from-bd-green-50/50 via-white to-emerald-50/50 dark:from-gray-900 dark:to-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-bd-green-600" />
              সদস্য খুঁজুন ও দ্রুত কমিটি পদবি প্রদান করুন (Assign Committee Position)
            </h3>
            <p className="text-xs text-gray-500">যেকোনো শিক্ষার্থী বা সাবেক শিক্ষার্থীকে সরাসরি জেলা বা উপজেলা কমিটিতে যুক্ত করুন</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, ফোন বা বিভাগ দিয়ে সদস্য খুঁজুন..."
            className="input pl-10 !py-2.5 !text-sm shadow-sm"
          />
        </div>

        {searchedMembers.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-800 rounded-xl border p-2 shadow-md">
            {searchedMembers.map((m) => (
              <div key={m.id} className="p-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-bd-green-100 text-bd-green-700 font-bold grid place-items-center overflow-hidden">
                    {m.photo ? <img src={m.photo} alt={m.name} className="h-full w-full object-cover" /> : m.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900 dark:text-white">{m.name}</p>
                    <p className="text-[11px] text-gray-400">{m.department} ({m.session}) • {m.upazila}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMember(m)}
                  className="btn-primary !py-1 !px-3 text-xs flex items-center gap-1"
                >
                  <Award className="h-3.5 w-3.5" /> পদবি দিন
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teacher Approval Queue Widget */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              শিক্ষক যাচাই ও অনুমোদন তালিকা (Teacher Approval Queue)
            </h3>
            <Badge variant="amber">{pendingTeachers.length} জন অপেক্ষমাণ</Badge>
          </div>

          <Link to="/dashboard/users" className="text-xs font-semibold text-bd-green-600 hover:underline">
            সকল ব্যবহারকারী দেখুন
          </Link>
        </div>

        {pendingTeachers.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            কোনো শিক্ষক অ্যাকাউন্ট অনুমোদনের জন্য অপেক্ষমাণ নেই
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingTeachers.map((u) => (
              <div key={u.uid} className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white">{u.name}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{u.email}</p>
                  <p className="text-[10px] text-amber-600 font-medium mt-1">উপজেলা: {u.upazila || 'অনুল্লেখিত'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveTeacher(u.uid)}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> অনুমোদন
                  </button>
                  <button
                    onClick={() => handleRejectTeacher(u.uid)}
                    className="p-1.5 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 text-xs"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Management Hub Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-gray-900 dark:text-white">ম্যানেজমেন্ট হাব (Management Hub)</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/dashboard/notices" className="card p-4 flex items-center gap-3 hover:border-bd-green-500 transition group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><FileText className="h-5 w-5" /></div>
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-white">নোটিশ ব্যবস্থাপনা</p>
              <p className="text-[10px] text-gray-400">জেলা ও উপজেলা নোটিশ</p>
            </div>
          </Link>

          <Link to="/dashboard/gallery" className="card p-4 flex items-center gap-3 hover:border-bd-green-500 transition group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><ImageIcon className="h-5 w-5" /></div>
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-white">গ্যালারি অ্যালবাম</p>
              <p className="text-[10px] text-gray-400">ছবি ও ভিডিও গ্যালারি</p>
            </div>
          </Link>

          <Link to="/dashboard/events" className="card p-4 flex items-center gap-3 hover:border-bd-green-500 transition group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-600"><CalendarDays className="h-5 w-5" /></div>
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-white">ইভেন্ট ব্যবস্থাপনা</p>
              <p className="text-[10px] text-gray-400">অনুষ্ঠান ও রেজিস্ট্রেশন</p>
            </div>
          </Link>

          <Link to="/dashboard/membership" className="card p-4 flex items-center gap-3 hover:border-bd-green-500 transition group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-white">মেম্বারশিপ ও পেমেন্ট</p>
              <p className="text-[10px] text-gray-400">কার্ড ও অর্থ ট্র্যাকিং</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">সদস্য বৃদ্ধি (Member Growth Curve)</h3>
                <p className="text-xs text-gray-400">মাসভিত্তিক সর্বমোট নিবন্ধিত সদস্য</p>
              </div>
              <Badge variant="green"><TrendingUp className="h-3 w-3" /> +২৪%</Badge>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={growthData} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Hind Siliguri' }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ fontFamily: 'Hind Siliguri', borderRadius: 12, border: 'none' }} />
                <Area type="monotone" dataKey="members" stroke="#059669" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="card p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">উপজেলাভিত্তিক সদস্য বন্টন (Upazila Distribution)</h3>
              <p className="text-xs text-gray-400">৬ টি উপজেলার মোট সদস্য সংখ্যা</p>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={upazilaData} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Hind Siliguri' }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ fontFamily: 'Hind Siliguri', borderRadius: 12, border: 'none' }} />
                <Bar dataKey="value" fill="#006a4e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FadeIn>
      </div>

      {/* Recent Activity Timeline */}
      <FadeIn>
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-bd-green-600" />
              সাম্প্রতিক প্রশাসনিক ক্রিয়াকলাপ (Recent Activity Feed)
            </h3>
            <Link to="/dashboard/audit" className="text-xs font-semibold text-bd-green-600 hover:underline">
              সম্পূর্ণ অডিট লগ
            </Link>
          </div>

          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">সাম্প্রতিক কোনো ক্রিয়াকলাপ নিবন্ধিত হয়নি</p>
            ) : (
              recentLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{log.details || log.action}</p>
                    <p className="text-[10px] text-gray-400">{log.actorEmail} • {new Date(log.createdAt).toLocaleTimeString('bn-BD')}</p>
                  </div>
                  <Badge variant="gray">{log.action}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </FadeIn>

      {/* Assign Committee Position Modal */}
      {selectedMember && (
        <Modal open={true} onClose={() => setSelectedMember(null)} title="কমিটি পদবি বরাদ্দ করুন" size="md">
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-bd-green-50 dark:bg-bd-green-900/30 border border-bd-green-200">
              <p className="font-bold text-sm text-bd-green-800 dark:text-bd-green-300">{selectedMember.name}</p>
              <p className="text-gray-600 dark:text-gray-300">{selectedMember.department} ({selectedMember.session}) • {selectedMember.upazila}</p>
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">কমিটি পর্যায়</label>
              <select
                value={assignScope}
                onChange={(e) => setAssignScope(e.target.value as any)}
                className="input"
              >
                <option value="district">জেলা কমিটি (District Committee)</option>
                <option value="upazila">উপজেলা কমিটি (Upazila Committee)</option>
              </select>
            </div>

            {assignScope === 'upazila' && (
              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">উপজেলা নির্বাচন করুন</label>
                <select
                  value={assignUpazila}
                  onChange={(e) => setAssignUpazila(e.target.value as UpazilaName)}
                  className="input"
                >
                  {UPAZILA_OPTIONS.map((u) => <option key={u} value={u ?? ''}>{u}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                পদবি লিখুন (যেকোনো নতুন বা কাস্টম পদবি টাইপ করুন)
              </label>
              <input
                type="text"
                value={assignPosition}
                onChange={(e) => setAssignPosition(e.target.value)}
                placeholder="যেমন: সহ-সভাপতি, সাংস্কৃতিক সম্পাদক..."
                className="input mb-2"
              />
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] text-gray-400 font-medium self-center mr-1">দ্রুত সিলেক্ট:</span>
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAssignPosition(p)}
                    className={`chip text-[11px] py-0.5 px-2 ${
                      assignPosition === p
                        ? 'bg-bd-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button onClick={handleConfirmAssignment} disabled={assigning} className="btn-primary flex-1">
                {assigning ? 'পদবি যোগ হচ্ছে...' : 'পদবি চূড়ান্ত করুন'}
              </button>
              <button onClick={() => setSelectedMember(null)} className="btn-ghost">বাতিল</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
