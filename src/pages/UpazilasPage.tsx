import { useEffect, useState } from 'react';
import { SEO } from '@/components/SEO';
import { FadeIn, StaggerGroup, StaggerItem } from '@/components/ui/FadeIn';
import { UPAZILAS } from '@/data/sampleData';
import { MapPin, Users, Star, UserCheck, ArrowRight } from 'lucide-react';
import { toBnNumber } from '@/utils/format';
import { Link } from 'react-router-dom';
import { listCommitteeMembers } from '@/services/committeeService';
import { listApprovedMembers } from '@/services/memberService';
import type { CommitteeMemberRecord, UpazilaName, MemberProfile } from '@/types';

export function UpazilasPage() {
  const [upazilaCommittees, setUpazilaCommittees] = useState<Record<string, CommitteeMemberRecord[]>>({});
  const [upazilaMemberCounts, setUpazilaMemberCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const recordsMap: Record<string, CommitteeMemberRecord[]> = {};
      for (const u of UPAZILAS) {
        const list = await listCommitteeMembers('২০২৬-২৭', 'upazila', u.name as UpazilaName);
        recordsMap[u.id] = list;
      }
      setUpazilaCommittees(recordsMap);

      try {
        const allMembers = await listApprovedMembers();
        const counts: Record<string, number> = {};
        for (const u of UPAZILAS) {
          const matched = allMembers.filter((m) => m.upazila === u.name);
          counts[u.id] = matched.length;
        }
        setUpazilaMemberCounts(counts);
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="উপজেলা শাখা" description="ঝিনাইদহের ছয়টি উপজেলার সমিতি শাখা।" />
      <FadeIn>
        <span className="chip bg-bd-green-100 text-bd-green-700 dark:bg-bd-green-900/40 dark:text-bd-green-300">উপজেলা শাখা</span>
        <h1 className="section-title mt-4">ঝিনাইদহের ছয়টি উপজেলা</h1>
        <p className="section-subtitle max-w-2xl">জেলার প্রতিটি উপজেলায় সমিতির সক্রিয় শাখা রয়েছে। বিস্তারিত দেখতে কার্ডে ক্লিক করুন।</p>
      </FadeIn>

      <StaggerGroup className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {UPAZILAS.map((u) => {
          const list = upazilaCommittees[u.id] || [];
          const pres = list.find((c) => c.position === 'সভাপতি' || c.position.includes('সভাপতি'))?.name || u.president;
          const sec = list.find((c) => c.position === 'সাধারণ সম্পাদক' || c.position.includes('সম্পাদক'))?.name || u.secretary;
          const realCount = upazilaMemberCounts[u.id] !== undefined ? upazilaMemberCounts[u.id] : u.memberCount;

          return (
            <StaggerItem key={u.id}>
              <Link to={`/upazilas/${u.id}`} className="card p-6 h-full flex flex-col group hover:shadow-glass transition-all border-t-4 border-t-bd-green-600">
                <div className="flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-bd-gradient text-white">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <span className="chip bg-bd-green-50 text-bd-green-700 dark:bg-bd-green-900/30 dark:text-bd-green-300 font-semibold">
                    <Users className="h-3 w-3" /> {toBnNumber(realCount)} জন
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-bd-green-700 dark:group-hover:text-bd-green-300 transition flex items-center justify-between">
                  {u.name}
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-bd-green-600 group-hover:translate-x-0.5 transition" />
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1">{u.description}</p>

                <div className="mt-4 space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <UserCheck className="h-3.5 w-3.5 text-bd-green-600" /> সভাপতি: <span className="font-semibold text-gray-900 dark:text-white">{pres}</span>
                  </p>
                  <p className="text-xs flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <UserCheck className="h-3.5 w-3.5 text-bd-green-600" /> সম্পাদক: <span className="font-semibold text-gray-900 dark:text-white">{sec}</span>
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {u.highlights.map((h) => (
                    <span key={h} className="chip bg-bd-green-50 text-bd-green-700 dark:bg-bd-green-900/30 dark:text-bd-green-300">
                      <Star className="h-3 w-3" /> {h}
                    </span>
                  ))}
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </div>
  );
}
