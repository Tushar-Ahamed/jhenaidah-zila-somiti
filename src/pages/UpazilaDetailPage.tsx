import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UPAZILAS } from '@/data/sampleData';
import { SEO } from '@/components/SEO';
import { FadeIn, StaggerGroup, StaggerItem } from '@/components/ui/FadeIn';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MemberCard } from '@/components/MemberCard';
import { listNotices, listEvents, listGallery } from '@/services/contentService';
import { listApprovedMembers } from '@/services/memberService';
import { listCommitteeMembers } from '@/services/committeeService';
import type { Notice, OrgEvent, GalleryItem, MemberProfile, UpazilaName, CommitteeMemberRecord } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, MapPin, Users, UserCheck, Star, CalendarDays, Pin, FileText, X, Phone, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { toBnNumber, formatBnDate, relativeBn, isUpcoming, classNames } from '@/utils/format';
import { AnimatePresence, motion } from 'framer-motion';

type Tab = 'overview' | 'committee' | 'members' | 'events' | 'gallery' | 'notices';

const tabs: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'পরিচিতি' },
  { key: 'committee', label: 'কমিটি' },
  { key: 'members', label: 'সদস্য' },
  { key: 'events', label: 'আয়োজন' },
  { key: 'gallery', label: 'গ্যালারি' },
  { key: 'notices', label: 'নোটিশ' },
];

const noticeVariant: Record<string, 'red' | 'green' | 'amber' | 'blue'> = {
  'জরুরি': 'red', 'সাধারণ': 'green', 'অনুষ্ঠান': 'blue', 'নির্বাচন': 'amber',
};

export function UpazilaDetailPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const upazila = UPAZILAS.find((u) => u.id === id);

  const [tab, setTab] = useState<Tab>('overview');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !upazila) return;
    let active = true;
    (async () => {
      setLoading(true);
      const upazilaName = upazila.name as UpazilaName;
      const [n, e, g, m, cm] = await Promise.all([
        listNotices('upazila', upazilaName),
        listEvents('upazila', upazilaName),
        listGallery('upazila', upazilaName),
        listApprovedMembers(),
        listCommitteeMembers('২০২৬-২৭', 'upazila', upazilaName),
      ]);
      if (!active) return;
      setNotices(n);
      setEvents(e);
      setGallery(g);
      setMembers(m.filter((mem) => mem.upazila === upazilaName));
      setCommitteeMembers(cm);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [id]);

  if (!upazila) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState icon={<MapPin className="h-8 w-8" />} title="উপজেলা পাওয়া যায়নি" description="এই আইডির সাথে মিলে যাওয়া কোনো উপজেলা নেই।" action={<Link to="/upazilas" className="btn-primary">উপজেলা তালিকায় ফিরুন</Link>} />
      </div>
    );
  }

  // Find assigned president & secretary dynamically
  const dynamicPresident = committeeMembers.find(c => c.position === 'সভাপতি' || c.position.includes('সভাপতি'))?.name || upazila.president;
  const dynamicSecretary = committeeMembers.find(c => c.position === 'সাধারণ সম্পাদক' || c.position.includes('সম্পাদক'))?.name || upazila.secretary;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <SEO title={upazila.name} description={upazila.description} />
      <FadeIn>
        <Link to="/upazilas" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-bd-green-700 dark:hover:text-bd-green-300 mb-6">
          <ArrowLeft className="h-4 w-4" /> উপজেলা তালিকায় ফিরুন
        </Link>
      </FadeIn>

      {/* Header */}
      <FadeIn delay={0.05}>
        <div className="rounded-3xl bg-bd-gradient p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-bd-radial opacity-40" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur border border-white/20">
              <MapPin className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">{upazila.name}</h1>
              <p className="mt-1 text-white/80 text-sm">{upazila.description}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/85">
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {toBnNumber(members.length || upazila.memberCount)} জন সদস্য</span>
                <span className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 text-amber-300" /> সভাপতি: {dynamicPresident}</span>
                <span className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 text-emerald-300" /> সম্পাদক: {dynamicSecretary}</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={classNames('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition', tab === t.key ? 'bg-white dark:bg-gray-900 text-bd-green-700 dark:text-bd-green-300 shadow-soft' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700')}>{t.label}</button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : tab === 'overview' ? (
          <FadeIn className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'কমিটি সদস্য', value: committeeMembers.length, suffix: ' জন' },
                { label: 'সাধারণ সদস্য', value: members.length, suffix: ' জন' },
                { label: 'আয়োজন', value: events.length, suffix: '' },
                { label: 'নোটিশ', value: notices.length, suffix: '' },
                { label: 'গ্যালারি', value: gallery.length, suffix: ' টি' },
              ].map((s) => (
                <div key={s.label} className="card p-5 text-center">
                  <p className="text-3xl font-bold text-bd-green-600">{toBnNumber(s.value)}{s.suffix}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">কার্যক্রমের বৈশিষ্ট্য</h3>
              <div className="flex flex-wrap gap-2">
                {upazila.highlights.map((h) => (
                  <span key={h} className="chip bg-bd-green-50 text-bd-green-700 dark:bg-bd-green-900/30 dark:text-bd-green-300"><Star className="h-3 w-3" /> {h}</span>
                ))}
              </div>
            </div>
          </FadeIn>
        ) : tab === 'committee' ? (
          committeeMembers.length === 0 ? (
            <EmptyState icon={<Users className="h-8 w-8" />} title="কোনো কমিটি নিযুক্তি নেই" description="এই উপজেলায় এখনো কোনো কমিটি সদস্য পদে যুক্ত করা হয়নি।" />
          ) : (
            <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {committeeMembers.map((m) => (
                <StaggerItem key={m.id}>
                  <div className="card p-5 h-full flex flex-col justify-between border-t-4 border-t-bd-green-600">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-bd-gradient text-white text-lg font-semibold shrink-0 overflow-hidden">
                          {m.photoUrl ? <img src={m.photoUrl} alt={m.name} className="h-full w-full object-cover" /> : m.name[0]}
                        </div>
                        <div className="min-w-0">
                          <Badge variant="green" className="mb-1">{m.position}</Badge>
                          <p className="font-bold text-gray-900 dark:text-white truncate">{m.name}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 space-y-1">
                        <p><span className="font-semibold">বিভাগ:</span> {m.department || 'অনুল্লেখিত'}</p>
                        <p><span className="font-semibold">সেশন:</span> {m.studentSession || 'অনুল্লেখিত'}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 flex flex-wrap gap-2 text-xs">
                      {m.phone && <Badge variant="gray"><Phone className="h-3 w-3" /> {m.phone}</Badge>}
                      {m.email && <Badge variant="gray"><Mail className="h-3 w-3" /> {m.email}</Badge>}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )
        ) : tab === 'members' ? (
          !user ? (
            <FadeIn>
              <div className="rounded-3xl border border-bd-green-200 dark:border-bd-green-800/60 bg-gradient-to-br from-bd-green-50/90 via-white to-bd-green-50/40 dark:from-bd-green-950/40 dark:via-gray-900 dark:to-gray-950 p-8 text-center shadow-xl backdrop-blur">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-bd-green-600 text-white shadow-md">
                  <Lock className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                  উপজেলার সদস্যদের তথ্য দেখতে লগইন আবশ্যক
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed">
                  সদস্যদের গোপনীয়তা সুরক্ষার জন্য ইমেইল, ফোন নম্বর ও বিস্তারিত পরিচিতি শুধু রেজিস্টার্ড সদস্যদের নিকট দৃশ্যমান।
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link to="/login" className="btn-primary px-6 py-2">
                    <LogIn className="h-4 w-4" /> লগইন করুন
                  </Link>
                  <Link to="/register" className="btn-secondary px-6 py-2">
                    <UserPlus className="h-4 w-4" /> নিবন্ধন করুন
                  </Link>
                </div>
              </div>
            </FadeIn>
          ) : members.length === 0 ? (
            <EmptyState icon={<Users className="h-8 w-8" />} title="কোনো সদস্য নেই" description="এই উপজেলায় এখনো কোনো সদস্য যুক্ত নেই।" />
          ) : (
            <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((m) => <StaggerItem key={m.id}><MemberCard member={m} /></StaggerItem>)}
            </StaggerGroup>
          )
        ) : tab === 'events' ? (
          events.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="কোনো আয়োজন নেই" description="এই উপজেলায় এখনো কোনো আয়োজন নেই।" />
          ) : (
            <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <StaggerItem key={e.id}>
                  <div className="card overflow-hidden h-full flex flex-col">
                    <div className="relative h-40 overflow-hidden">
                      {e.coverImage ? <img src={e.coverImage} alt={e.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full bg-bd-gradient" />}
                      <div className="absolute top-3 left-3"><Badge variant={isUpcoming(e.date) ? 'green' : 'gray'}>{isUpcoming(e.date) ? 'আসন্ন' : 'অতীত'}</Badge></div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{e.title}</h3>
                      <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{e.description}</p>
                      <div className="mt-3 space-y-1 text-xs text-gray-400">
                        <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-bd-green-600" /> {formatBnDate(e.date)}</p>
                        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-bd-green-600" /> {e.location}</p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )
        ) : tab === 'gallery' ? (
          gallery.length === 0 ? (
            <EmptyState icon={<MapPin className="h-8 w-8" />} title="কোনো ছবি নেই" description="এই উপজেলায় এখনো কোনো ছবি যোগ করা হয়নি।" />
          ) : (
            <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {gallery.map((g) => (
                <StaggerItem key={g.id}>
                  <button onClick={() => setLightbox(g.url)} className="card overflow-hidden group block w-full">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={g.url} alt={g.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    </div>
                    <div className="p-3 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{g.title}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{formatBnDate(g.date)}</p>
                    </div>
                  </button>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )
        ) : tab === 'notices' ? (
          notices.length === 0 ? (
            <EmptyState icon={<FileText className="h-8 w-8" />} title="কোনো নোটিশ নেই" description="এই উপজেলায় এখনো কোনো নোটিশ প্রকাশিত হয়নি।" />
          ) : (
            <StaggerGroup className="space-y-3">
              {notices.map((n) => (
                <StaggerItem key={n.id}>
                  <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-bd-green-50 text-bd-green-600 dark:bg-bd-green-900/30 dark:text-bd-green-300 shrink-0">
                      {n.pinned ? <Pin className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={noticeVariant[n.category]}>{n.category}</Badge>
                        {n.pinned && <Badge variant="amber">পিন করা</Badge>}
                      </div>
                      <h3 className="mt-1.5 font-semibold text-gray-900 dark:text-white">{n.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{n.body}</p>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0 sm:text-right">
                      <p className="flex items-center gap-1.5 sm:justify-end"><CalendarDays className="h-3.5 w-3.5" /> {formatBnDate(n.date)}</p>
                      <p className="mt-0.5">{relativeBn(n.date)}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )
        ) : null}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)} className="fixed inset-0 z-[100] grid place-items-center bg-black/80 backdrop-blur p-4">
            <button className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => setLightbox(null)}><X className="h-5 w-5" /></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={lightbox} alt="preview" className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
