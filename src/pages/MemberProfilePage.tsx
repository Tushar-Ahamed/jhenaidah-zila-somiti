import { SEO } from '@/components/SEO';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMember } from '@/services/memberService';
import type { MemberProfile } from '@/types';
import { FadeIn } from '@/components/ui/FadeIn';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowLeft, Mail, Phone, MapPin, Facebook, Linkedin, Droplet, GraduationCap, Building, CalendarDays, User } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Lock, LogIn, UserPlus } from 'lucide-react';

export function MemberProfilePage() {
  const { user: currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const m = id ? await getMember(id) : null;
      if (active) { setMember(m); setLoading(false); }
    })();
    return () => { active = false; };
  }, [id]);

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <FadeIn>
          <div className="rounded-3xl border border-bd-green-200 dark:border-bd-green-800/60 bg-gradient-to-br from-bd-green-50/90 via-white to-bd-green-50/40 dark:from-bd-green-950/40 dark:via-gray-900 dark:to-gray-950 p-8 sm:p-12 text-center shadow-xl backdrop-blur">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-bd-green-600 text-white shadow-lg">
              <Lock className="h-10 w-10" />
            </div>
            <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              সদস্যের বিস্তারিত প্রোফাইল দেখতে লগইন করুন
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
              সদস্যদের গোপনীয়তা সুরক্ষার জন্য ইমেইল, ফোন নম্বর ও বিস্তারিত পরিচিতি শুধু রেজিস্টার্ড সদস্যদের নিকট দৃশ্যমান।
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/login" className="btn-primary px-8 py-3 text-base shadow-md">
                <LogIn className="h-5 w-5" /> লগইন করুন
              </Link>
              <Link to="/register" className="btn-secondary px-8 py-3 text-base">
                <UserPlus className="h-5 w-5" /> নিবন্ধন করুন
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <SkeletonCard />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState icon={<User className="h-8 w-8" />} title="সদস্য পাওয়া যায়নি" description="এই আইডির সাথে মিলে যাওয়া কোনো সদস্য প্রোফাইল নেই।" action={<Link to="/members" className="btn-primary">সদস্য তালিকায় ফিরুন</Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <SEO title={member.name} description={member.bio} type="profile" />
      <FadeIn>
        <Link to="/members" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-bd-green-700 dark:hover:text-bd-green-300 mb-6">
          <ArrowLeft className="h-4 w-4" /> সদস্য তালিকায় ফিরুন
        </Link>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="card overflow-hidden">
          {/* Cover */}
          <div className="h-32 sm:h-40 bg-bd-gradient relative">
            <div className="absolute inset-0 bg-bd-radial opacity-40" />
          </div>

          <div className="px-6 sm:px-8 pb-8">
            {/* Avatar + name */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
              <div className="relative shrink-0">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl object-cover border-4 border-white dark:border-gray-900 shadow-glass"
                />
                {member.bloodGroup && (
                  <div className="absolute -bottom-1 -right-1">
                    <Badge variant="red"><Droplet className="h-3 w-3" /> {member.bloodGroup}</Badge>
                  </div>
                )}
              </div>
              <div className="flex-1 sm:pb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{member.name}</h1>
                <p className="mt-1 text-sm text-bd-green-700 dark:text-bd-green-300 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" /> {member.department}
                </p>
              </div>
              {/* Socials */}
              <div className="flex items-center gap-2 sm:pb-2">
                {member.facebook && (
                  <a href={member.facebook} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 dark:bg-gray-800 text-bd-green-700 dark:text-bd-green-300 hover:bg-bd-green-600 hover:text-white transition" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
                )}
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 dark:bg-gray-800 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a>
                )}
                {member.email && (
                  <a href={`mailto:${member.email}`} className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-bd-green-600 hover:text-white transition" aria-label="Email"><Mail className="h-5 w-5" /></a>
                )}
                {member.phone && (
                  <a href={`tel:${member.phone}`} className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-bd-green-600 hover:text-white transition" aria-label="Phone"><Phone className="h-5 w-5" /></a>
                )}
              </div>
            </div>

            {/* Bio */}
            {member.bio && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">পরিচিতি</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{member.bio}</p>
              </div>
            )}

            {/* Details grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { icon: GraduationCap, label: 'বিভাগ', value: member.department },
                { icon: CalendarDays, label: 'সেশন', value: member.session },
                { icon: Building, label: 'হল', value: member.hall },
                { icon: MapPin, label: 'উপজেলা', value: member.upazila ?? '—' },
                { icon: Mail, label: 'ইমেইল', value: member.email },
                { icon: Phone, label: 'ফোন', value: member.phone },
              ].map((f) => (
                <div key={f.label} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-bd-green-50 text-bd-green-600 dark:bg-bd-green-900/30 dark:text-bd-green-300 shrink-0">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{f.label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
