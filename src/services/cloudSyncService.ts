import type { MemberProfile } from '@/types';

const SHARED_CLOUD_DB_ID = 'ff8081819f7e10ae019fb51ccbe550b1';
const SYNC_URL = `https://api.restful-api.dev/objects/${SHARED_CLOUD_DB_ID}`;

export async function fetchCloudMembers(): Promise<MemberProfile[]> {
  try {
    const res = await fetch(SYNC_URL, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.data?.members && Array.isArray(data.data.members)) {
      return data.data.members as MemberProfile[];
    }
  } catch {
    // best-effort
  }
  return [];
}

export async function saveCloudMembers(members: MemberProfile[]): Promise<void> {
  try {
    await fetch(SYNC_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'jhenaidah_members_global_db_v1',
        data: { members },
      }),
    });
  } catch {
    // best-effort
  }
}

export async function syncMemberToCloud(member: MemberProfile): Promise<void> {
  try {
    const existing = await fetchCloudMembers();
    const map = new Map<string, MemberProfile>();
    for (const m of existing) {
      const key = m.email ? m.email.toLowerCase() : m.id;
      map.set(key, m);
    }
    const myKey = member.email ? member.email.toLowerCase() : member.id;
    const previous = map.get(myKey);
    map.set(myKey, {
      ...previous,
      ...member,
      photo: member.photo || previous?.photo || '',
    });
    await saveCloudMembers(Array.from(map.values()));
  } catch {
    // best-effort
  }
}
