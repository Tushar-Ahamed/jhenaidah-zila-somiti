import { useEffect, useState } from 'react';
import { SEO } from '@/components/SEO';
import { FadeIn, StaggerGroup, StaggerItem } from '@/components/ui/FadeIn';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ORG_INFO, STATS as DEFAULT_STATS } from '@/data/sampleData';
import { fetchDynamicStats, type DynamicStat } from '@/services/statsService';
import { Target, Eye, Users, Award, Heart, BookOpen } from 'lucide-react';
import { toBnNumber } from '@/utils/format';

const values = [
  { icon: Heart, title: 'সংহতি', text: 'দূরত্ব ভুলে একে অপরের পাশে দাঁড়ানো।' },
  { icon: BookOpen, title: 'শিক্ষা', text: 'শিক্ষার আলো সবার মাঝে ছড়িয়ে দেওয়া।' },
  { icon: Award, title: 'উৎকর্ষ', text: 'মেধা ও মানবিকতার সমন্বয়ে এগিয়ে যাওয়া।' },
  { icon: Users, title: 'সহযোগিতা', text: 'একে অপরের সফলতার অংশীদার হওয়া।' },
];

export function AboutPage() {
  const [stats, setStats] = useState<DynamicStat[]>(DEFAULT_STATS);

  useEffect(() => {
    fetchDynamicStats().then((data) => {
      if (data && data.length > 0) setStats(data);
    });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="আমাদের সম্পর্কে" description="ঝিনাইদহ জেলা সমিতির পরিচিতি, লক্ষ্য, স্বপ্ন ও মূল্যবোধ।" />
      {/* Hero */}
      <FadeIn className="rounded-3xl bg-bd-gradient p-8 sm:p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-bd-radial opacity-40" />
        <div className="relative max-w-2xl">
          <span className="chip bg-white/15 border border-white/20 text-white">পরিচিতি</span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold">{ORG_INFO.fullName}</h1>
          <p className="mt-3 text-white/85 leading-relaxed">{ORG_INFO.about}</p>
        </div>
      </FadeIn>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="card p-6 text-center">
            <p className="text-3xl font-bold text-bd-green-600">{toBnNumber(s.value)}{s.suffix}</p>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mission / Vision */}
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <FadeIn>
          <div className="card p-6 h-full">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-bd-green-50 text-bd-green-600 dark:bg-bd-green-900/30 dark:text-bd-green-300">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">আমাদের লক্ষ্য</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{ORG_INFO.mission}</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="card p-6 h-full">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-bd-red-50 text-bd-red-600 dark:bg-bd-red-900/30 dark:text-bd-red-300">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">আমাদের স্বপ্ন</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{ORG_INFO.vision}</p>
          </div>
        </FadeIn>
      </div>

      {/* Values */}
      <div className="mt-12">
        <SectionHeader title="আমাদের মূল্যবোধ" subtitle="যে নীতিতে আমরা বিশ্বাস করি" align="center" />
        <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <StaggerItem key={v.title}>
              <div className="card p-5 h-full text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-bd-green-50 text-bd-green-600 dark:bg-bd-green-900/30 dark:text-bd-green-300">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{v.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{v.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </div>
  );
}
