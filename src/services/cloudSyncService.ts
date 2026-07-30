import type { MemberProfile, UpazilaName } from '@/types';

const PRIMARY_SYNC_URL = 'https://jsonblob.com/api/jsonBlob/019fb52d-9d88-74d9-8598-27f8a1525e3c';
const BACKUP_SYNC_URL = 'https://jsonblob.com/api/jsonBlob/019fb52d-2884-7fe9-8ad8-61878a824a47';

const ENDPOINTS = [PRIMARY_SYNC_URL, BACKUP_SYNC_URL];

export async function fetchCloudMembers(): Promise<MemberProfile[]> {
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.members && Array.isArray(data.members)) {
          return (data.members as MemberProfile[]).filter((m) => m && m.name && m.id);
        }
      }
    } catch {
      // try next
    }
  }
  return [];
}

export async function saveCloudMembers(members: MemberProfile[]): Promise<void> {
  for (const url of ENDPOINTS) {
    try {
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ members }),
      });
    } catch {
      // best-effort
    }
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
      photo: member.photo && !member.photo.startsWith('blob:') ? member.photo : previous?.photo || '',
    });
    await saveCloudMembers(Array.from(map.values()));
  } catch {
    // best-effort
  }
}

export async function syncAllLocalMembersToCloud(): Promise<void> {
  try {
    const existing = await fetchCloudMembers();
    const map = new Map<string, MemberProfile>();
    for (const m of existing) {
      if (m && m.name) {
        const key = m.email ? m.email.toLowerCase() : m.id;
        map.set(key, { ...m, status: 'approved' });
      }
    }

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

    let hasNew = false;
    for (const p of localProfiles) {
      const key = p.email ? p.email.toLowerCase() : p.id;
      const prev = map.get(key);
      if (!prev || prev.name !== p.name || (p.photo && !p.photo.startsWith('blob:') && p.photo !== prev.photo)) {
        map.set(key, {
          ...prev,
          ...p,
          status: 'approved',
          photo: p.photo && !p.photo.startsWith('blob:') ? p.photo : prev?.photo || '',
        });
        hasNew = true;
      }
    }

    if (hasNew || map.size > existing.length) {
      await saveCloudMembers(Array.from(map.values()));
    }
  } catch {
    // best-effort
  }
}
