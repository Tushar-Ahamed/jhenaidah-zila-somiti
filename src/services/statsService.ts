import { listMembers } from '@/services/memberService';
import { listEvents } from '@/services/contentService';
import { ORG_INFO } from '@/data/sampleData';

export interface DynamicStat {
  label: string;
  value: number;
  suffix: string;
}

export async function fetchDynamicStats(): Promise<DynamicStat[]> {
  let memberCount = 0;
  let eventsCount = 0;
  const upazilaCount = 6;
  const yearsPassed = new Date().getFullYear() - ORG_INFO.established;

  try {
    const [membersList, eventsList] = await Promise.all([
      listMembers('approved'),
      listEvents(),
    ]);

    if (membersList && Array.isArray(membersList)) {
      memberCount = membersList.length;
    }

    if (eventsList && Array.isArray(eventsList)) {
      eventsCount = eventsList.length;
    }
  } catch {
    // fallback
  }

  return [
    { label: 'সদস্য সংখ্যা', value: memberCount, suffix: '' },
    { label: 'উপজেলা শাখা', value: upazilaCount, suffix: '' },
    { label: 'আয়োজিত অনুষ্ঠান', value: eventsCount, suffix: '' },
    { label: 'বছর অতিবাহিত', value: yearsPassed, suffix: '' },
  ];
}
