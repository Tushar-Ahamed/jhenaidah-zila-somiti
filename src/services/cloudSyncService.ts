import type { MemberProfile, UpazilaName } from '@/types';

const PRIMARY_SYNC_URL = 'https://jsonblob.com/api/jsonBlob/019fb52d-9d88-74d9-8598-27f8a1525e3c';
const BACKUP_SYNC_URL = 'https://jsonblob.com/api/jsonBlob/019fb52d-2884-7fe9-8ad8-61878a824a47';

const ENDPOINTS = [PRIMARY_SYNC_URL, BACKUP_SYNC_URL];

export function deduplicateMemberList(list: MemberProfile[]): MemberProfile[] {
  const result: MemberProfile[] = [];

  for (const m of list) {
    if (!m || !m.name || m.name.trim().length === 0) continue;

    const normEmail = (m.email || '').trim().toLowerCase();
    const normName = m.name.trim().toLowerCase().replace(/\s+/g, '');

    const existingIndex = result.findIndex((item) => {
      const itemEmail = (item.email || '').trim().toLowerCase();
      const itemName = item.name.trim().toLowerCase().replace(/\s+/g, '');

      if (normEmail && itemEmail && normEmail === itemEmail) return true;
      if (normName && itemName && normName === itemName) return true;
      if (m.id && item.id && (m.id === item.id || m.id === item.uid || m.uid === item.id)) return true;
      return false;
    });

    if (existingIndex === -1) {
      result.push({ ...m, status: m.status || 'approved' });
    } else {
      const existing = result[existingIndex];
      const isExistingDefault = !existing.photo || existing.photo.includes('unsplash.com') || existing.photo.startsWith('blob:');
      const isNewCustom = m.photo && !m.photo.includes('unsplash.com') && !m.photo.startsWith('blob:');

      const bestPhoto = isNewCustom ? m.photo : (isExistingDefault ? m.photo || existing.photo : existing.photo);

      result[existingIndex] = {
        ...existing,
        ...m,
        status: m.status || existing.status || 'approved',
        email: m.email || existing.email,
        phone: m.phone || existing.phone,
        department: m.department && m.department !== 'অনুল্লেখিত' ? m.department : existing.department,
        session: m.session && m.session !== '২০২২-২৩' ? m.session : existing.session,
        hall: m.hall && m.hall !== 'অনুল্লেখিত' ? m.hall : existing.hall,
        upazila: m.upazila || existing.upazila,
        photo: bestPhoto,
      };
    }
  }

  return result;
}

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
          const raw = (data.members as MemberProfile[]).filter((m) => m && m.name && m.id);
          return deduplicateMemberList(raw);
        }
      }
    } catch {
      // try next
    }
  }
  return [];
}

export async function saveCloudMembers(members: MemberProfile[]): Promise<void> {
  const clean = deduplicateMemberList(members);
  for (const url of ENDPOINTS) {
    try {
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ members: clean }),
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
    const updatedList = deduplicateMemberList([...existing, member]);
    await saveCloudMembers(updatedList);
  } catch {
    // best-effort
  }
}

export async function syncAllLocalMembersToCloud(): Promise<void> {
  try {
    const existing = await fetchCloudMembers();
    const localProfiles: MemberProfile[] = [];

    const getCachedPhoto = (uid?: string, email?: string, existingPhoto?: string) => {
      if (existingPhoto && !existingPhoto.includes('unsplash.com') && !existingPhoto.startsWith('blob:')) {
        return existingPhoto;
      }
      try {
        if (uid) {
          const c = localStorage.getItem(`avatar-cache:${uid}`);
          if (c && !c.includes('unsplash.com') && !c.startsWith('blob:')) return c;
        }
        if (email) {
          const c = localStorage.getItem(`avatar-cache:${email.toLowerCase()}`);
          if (c && !c.includes('unsplash.com') && !c.startsWith('blob:')) return c;
        }
      } catch {
        // ignore
      }
      return existingPhoto || '';
    };

    const demoRaw = localStorage.getItem('jhenaidah_demo_user');
    if (demoRaw) {
      const demo = JSON.parse(demoRaw);
      if (demo && demo.name && (demo.email || demo.uid)) {
        const rawPhoto = demo.photoUrl || demo.photo;
        const photo = getCachedPhoto(demo.uid, demo.email, rawPhoto);
        localProfiles.push({
          id: demo.uid || `demo-${demo.email}`,
          uid: demo.uid,
          name: demo.name,
          photo,
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
        if (m && m.name) {
          const photo = getCachedPhoto(m.uid || m.id, m.email, m.photo);
          localProfiles.push({ ...m, photo, status: 'approved' });
        }
      }
    }

    const regRaw = localStorage.getItem('jhenaidah_registered_users_v1');
    if (regRaw) {
      const regList = JSON.parse(regRaw);
      for (const r of regList) {
        if (r.profile && r.profile.name) {
          const photo = getCachedPhoto(r.profile.uid, r.email, r.profile.photoUrl);
          localProfiles.push({
            id: r.profile.uid || `reg-${r.email}`,
            uid: r.profile.uid,
            name: r.profile.name,
            photo,
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

    const merged = deduplicateMemberList([...existing, ...localProfiles]);
    await saveCloudMembers(merged);
  } catch {
    // best-effort
  }
}
