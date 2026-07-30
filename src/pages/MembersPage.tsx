import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { FadeIn, StaggerGroup, StaggerItem } from '@/components/ui/FadeIn';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { MemberCard, MemberCardSkeleton } from '@/components/MemberCard';
import { listApprovedMembers, filterMembers, paginate, totalPages } from '@/services/memberService';
import { DEPARTMENTS, SESSIONS, UPAZILA_OPTIONS, BLOOD_GROUPS, type MemberProfile, type UpazilaName } from '@/types';
import { Search, SlidersHorizontal, X, Users, ChevronLeft, ChevronRight, Phone, Mail, GraduationCap, CalendarDays, Building, MapPin, Droplet, ExternalLink } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { toBnNumber, classNames } from '@/utils/format';

const PAGE_SIZE = 9;

export function MembersPage() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState<string>('all');
  const [session, setSession] = useState<string>('all');
  const [upazila, setUpazila] = useState<UpazilaName | 'all'>('all');
  const [bloodGroup, setBloodGroup] = useState<MemberProfile['bloodGroup'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const debounced = useDebounce(query, 250);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await listApprovedMembers();
      setMembers(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => filterMembers(members, { query: debounced, department, session, upazila, bloodGroup }),
    [members, debounced, department, session, upazila, bloodGroup]
  );

  const pages = totalPages(filtered.length, PAGE_SIZE);
  const current = Math.min(page, pages);
  const visible = paginate(filtered, current, PAGE_SIZE);

  const resetPage = () => setPage(1);

  const activeFilterCount = [department !== 'all', session !== 'all', upazila !== 'all', bloodGroup !== 'all'].filter(Boolean).length;

  const clearFilters = () => {
    setDepartment('all'); setSession('all'); setUpazila('all'); setBloodGroup('all'); setQuery(''); resetPage();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="সদস্য ডিরেক্টরি" description="ঝিনাইদহ জেলা সমিতির অনুমোদিত সদস্যদের তালিকা।" />
      <FadeIn>
        <span className="chip bg-bd-green-100 text-bd-green-700 dark:bg-bd-green-900/40 dark:text-bd-green-300">সদস্য ডিরেক্টরি</span>
        <h1 className="section-title mt-4">আমাদের সদস্য</h1>
        <p className="section-subtitle max-w-2xl">ঝিনাইদহ জেলা সমিতির অনুমোদিত সদস্যদের তালিকা। যেকোনো সদস্য কার্ডে ক্লিক করে নাম, ফোন নম্বর, বিভাগ, সেশন ও ইমেইল বিস্তারিত দেখুন।</p>
      </FadeIn>

      {/* Search + filter toggle */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); resetPage(); }}
            placeholder="নাম, ইমেইল, বিভাগ দিয়ে খুঁজুন..."
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters((p) => !p)}
          className={classNames('btn-ghost border', showFilters ? 'border-bd-green-500 bg-bd-green-50 dark:bg-bd-green-900/30' : 'border-gray-200 dark:border-gray-700')}
        >
          <SlidersHorizontal className="h-4 w-4" /> ফিল্টার
          {activeFilterCount > 0 && (
            <span className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-bd-green-600 text-white text-xs">{toBnNumber(activeFilterCount)}</span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <FadeIn className="mt-4 card p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">বিভাগ</label>
              <select value={department} onChange={(e) => { setDepartment(e.target.value); resetPage(); }} className="input mt-1.5">
                <option value="all">সব বিভাগ</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">সেশন</label>
              <select value={session} onChange={(e) => { setSession(e.target.value); resetPage(); }} className="input mt-1.5">
                <option value="all">সব সেশন</option>
                {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">উপজেলা</label>
              <select value={upazila ?? ''} onChange={(e) => { setUpazila((e.target.value || 'all') as UpazilaName | 'all'); resetPage(); }} className="input mt-1.5">
                <option value="all">সব উপজেলা</option>
                {UPAZILA_OPTIONS.map((u) => <option key={u} value={u ?? ''}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">রক্তের গ্রুপ</label>
              <select value={bloodGroup ?? ''} onChange={(e) => { setBloodGroup((e.target.value || 'all') as MemberProfile['bloodGroup'] | 'all'); resetPage(); }} className="input mt-1.5">
                <option value="all">সব গ্রুপ</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b ?? ''}>{b}</option>)}
              </select>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-bd-red-600 hover:underline">
              <X className="h-3.5 w-3.5" /> ফিল্টার মুছুন
            </button>
          )}
        </FadeIn>
      )}

      {/* Results */}
      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => <MemberCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : visible.length === 0 ? (
          <EmptyState icon={<Users className="h-8 w-8" />} title="কোনো সদস্য পাওয়া যায়নি" description="আপনার অনুসন্ধান বা ফিল্টারের সাথে মিলে যাওয়া কোনো সদস্য নেই।" action={<button onClick={clearFilters} className="btn-ghost">ফিল্টার মুছুন</button>} />
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">মোট {toBnNumber(filtered.length)} জন সদস্য</p>
            <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((m) => (
                <StaggerItem key={m.id}>
                  <MemberCard member={m} onClick={() => setSelectedMember(m)} />
                </StaggerItem>
              ))}
            </StaggerGroup>

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={current === 1}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: pages }).map((_, i) => {
                  const n = i + 1;
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={classNames(
                        'h-9 w-9 rounded-lg text-sm font-medium transition',
                        n === current
                          ? 'bg-bd-green-600 text-white shadow-soft'
                          : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      {toBnNumber(n)}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={current === pages}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <Modal open={true} onClose={() => setSelectedMember(null)} title="সদস্যের বিস্তারিত তথ্য" size="md">
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-bd-green-900 to-emerald-800 text-white relative overflow-hidden shadow-md">
              <img
                src={selectedMember.photo}
                alt={selectedMember.name}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-white/40 shrink-0 shadow"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold truncate">{selectedMember.name}</h3>
                <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" /> {selectedMember.department}
                </p>
                {selectedMember.bloodGroup && (
                  <div className="mt-2">
                    <Badge variant="red" className="text-xs"><Droplet className="h-3 w-3" /> {selectedMember.bloodGroup}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed attributes grid */}
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 font-medium">মোবাইল নম্বর (Phone)</p>
                  {selectedMember.phone ? (
                    <a href={`tel:${selectedMember.phone}`} className="font-semibold text-bd-green-600 hover:underline block truncate">
                      {selectedMember.phone}
                    </a>
                  ) : (
                    <p className="font-medium text-gray-500">অনুল্লেখিত</p>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 font-medium">ইমেইল (Email)</p>
                  {selectedMember.email ? (
                    <a href={`mailto:${selectedMember.email}`} className="font-semibold text-blue-600 hover:underline block truncate">
                      {selectedMember.email}
                    </a>
                  ) : (
                    <p className="font-medium text-gray-500">অনুল্লেখিত</p>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 shrink-0">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 font-medium">বিভাগ (Department)</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{selectedMember.department}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 shrink-0">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 font-medium">সেশন (Session)</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{selectedMember.session}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 font-medium">উপজেলা (Upazila)</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{selectedMember.upazila || '—'}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 shrink-0">
                  <Building className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 font-medium">হল (Hall)</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{selectedMember.hall || 'অনুল্লেখিত'}</p>
                </div>
              </div>
            </div>

            {selectedMember.bio && (
              <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <p className="text-xs font-semibold text-gray-500 mb-1">বায়ো / পরিচিতি</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{selectedMember.bio}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <Link
                to={`/members/${selectedMember.id}`}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" /> সম্পূর্ণ প্রোফাইল লিঙ্কে যান
              </Link>

              <button onClick={() => setSelectedMember(null)} className="btn-ghost text-xs">
                বন্ধ করুন
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

