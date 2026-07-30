import type { MemberProfile, UpazilaName } from '@/types';

const SHARED_CLOUD_DB_ID = 'ff8081819f7e10ae019fb51ccbe550b1';
const SYNC_URL = `https://api.restful-api.dev/objects/${SHARED_CLOUD_DB_ID}`;

export async function fetchCloudMembers(): Promise<MemberProfile[]> {
  try {
    const res = await fetch(SYNC_URL, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.data?.members && Array.isArray(data.data.members)) {
      return (data.data.members as MemberProfile[]).filter((m) => m && m.name && !m.id.startsWith('u1') && !m.id.startsWith('u2') && !m.id.startsWith('u3'));
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
  if (!member || !member.name || (!member.email && !member.id)) return;
  try {
    const existing = await fetchCloudMembers();
    const map = new Map<string, MemberProfile>();
    for (const m of existing) {
      if (m && m.name) {
        const key = m.email ? m.email.toLowerCase() : m.id;
        map.set(key, m);
      }
    }
    const myKey = member.email ? member.email.toLowerCase() : member.id;
    const previous = map.get(myKey);
    map.set(myKey, {
      ...previous,
      ...member,
      status: 'approved',
      photo: (member.photo && !member.photo.startsWith('blob:')) ? member.photo : previous?.photo || '',
    });
    await saveCloudMembers(Array.from(map.values()));
  } catch {
    // best-effort
  }
}

export async function syncAllLocalMembersToCloud(): Promise<void> {
  try {
    const localProfiles: MemberProfile[] = [];

    const demoRaw = localStorage.getItem('jhenaidah_demo_user');
    if (demoRaw) {
      const demo = JSON.parse(demoRaw);
      if (demo && demo.name && (demo.email || demo.uid)) {
        localProfiles.push({
          id: demo.uid || `demo-${demo.email}`,
          uid: demo.uid,
          name: demo.name,
          photo: (demo.photoUrl || demo.photo) && !(demo.photoUrl || demo.photo).startsWith('blob:') ? (demo.photoUrl || demo.photo) : '',
          department: demo.department || 'অনুল্লেখিত',
          session: demo.studentSession || '২০২২-২৩',
          hall: demo.hall || 'অনুল্লেখিত',
          upazila: (demo.upazila || 'ঝিনাইদহ সদর') as UpazilaName,
          phone: demo.phone || '',
          email: demo.email || '',
          bloodGroup: demo.bloodGroup || 'B+',
          bio: demo.bio || `${demo.name} - ${demo.position || 'সদস্য'}`,
          status: 'approved',
          createdAt: demo.createdAt || Date.now(),
          updatedAt: demo.updatedAt || Date.now(),
        });
      }
    }

    const memRaw = localStorage.getItem('jhenaidah_approved_members_v1');
    if (memRaw) {
      const memList: MemberProfile[] = JSON.parse(memRaw);
      for (const m of memList) {
        if (m && m.name) localProfiles.push({ ...m, status: 'approved' });
      }
    }

    const regRaw = localStorage.getItem('jhenaidah_registered_users_v1');
    if (regRaw) {
      const regList = JSON.parse(regRaw);
      for (const r of regList) {
        if (r.profile && r.profile.name) {
          localProfiles.push({
            id: r.profile.uid || `reg-${r.email}`,
            uid: r.profile.uid,
            name: r.profile.name,
            photo: r.profile.photoUrl && !r.profile.photoUrl.startsWith('blob:') ? r.profile.photoUrl : '',
            department: r.profile.department || 'অনুল্লেখিত',
            session: r.profile.studentSession || '২০২২-২৩',
            hall: r.profile.hall || 'অনুল্লেখিত',
            upazila: (r.profile.upazila || 'ঝিনাইদহ সদর') as UpazilaName,
            phone: r.profile.phone || '',
            email: r.email,
            bloodGroup: r.profile.bloodGroup || 'B+',
            bio: r.profile.bio || `${r.profile.name} - ${r.profile.position || 'সদস্য'}`,
            status: 'approved',
            createdAt: r.profile.createdAt || Date.now(),
            updatedAt: r.profile.updatedAt || Date.now(),
          });
        }
      }
    }

    for (const p of localProfiles) {
      await syncMemberToCloud(p);
    }
  } catch {
    // best-effort
  }
}
