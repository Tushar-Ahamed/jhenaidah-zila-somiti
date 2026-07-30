import { supabase } from '@/lib/supabase';
import type { MemberProfile, MemberStatus, UpazilaName } from '@/types';
import { MEMBERS } from '@/data/membersData';
import { fetchCloudMembers, syncMemberToCloud, syncAllLocalMembersToCloud } from '@/services/cloudSyncService';

const COL = 'members';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

function sanitizePhotoUrl(url?: string | null): string {
  if (!url || url.startsWith('blob:')) return DEFAULT_AVATAR;
  return url;
}

function mapRow(r: Record<string, unknown>): MemberProfile {
  return {
    id: r.id as string,
    uid: (r.uid as string | null) ?? undefined,
    name: r.name as string,
    photo: sanitizePhotoUrl(r.photo as string),
    department: r.department as string,
    session: r.session as string,
    hall: r.hall as string,
    upazila: r.upazila as UpazilaName,
    phone: r.phone as string,
    email: r.email as string,
    bloodGroup: (r.blood_group as MemberProfile['bloodGroup']) ?? null,
    facebook: (r.facebook as string | null) ?? undefined,
    linkedin: (r.linkedin as string | null) ?? undefined,
    bio: r.bio as string,
    status: r.status as MemberStatus,
    createdAt: new Date(r.created_at as string).getTime(),
    updatedAt: new Date(r.updated_at as string).getTime(),
  };
}

export async function getMember(id: string): Promise<MemberProfile | null> {
  try {
    const { data, error } = await supabase.from(COL).select('*').eq('id', id).maybeSingle();
    if (!error && data) return mapRow(data);
  } catch {
    // fallback
  }

  // Check local storage members
  try {
    const memRaw = localStorage.getItem('jhenaidah_approved_members_v1');
    if (memRaw) {
      const localApproved: MemberProfile[] = JSON.parse(memRaw);
      const matched = localApproved.find((m) => m.id === id || m.uid === id);
      if (matched) return matched;
    }
    const regRaw = localStorage.getItem('jhenaidah_registered_users_v1');
    if (regRaw) {
      const regList = JSON.parse(regRaw);
      const matchedReg = regList.find((r: any) => r.profile?.uid === id || `reg-${r.email}` === id);
      if (matchedReg) {
        const p = matchedReg.profile;
        return {
          id: p.uid || `reg-${matchedReg.email}`,
          uid: p.uid,
          name: p.name,
          photo: p.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          department: p.department || 'অনুল্লেখিত',
          session: p.studentSession || '২০২২-২৩',
          hall: p.hall || 'অনুল্লেখিত',
          upazila: (p.upazila || 'ঝিনাইদহ সদর') as UpazilaName,
          phone: p.phone || '',
          email: matchedReg.email,
          bloodGroup: p.bloodGroup || 'B+',
          bio: p.bio || `${p.name} - ${p.position || 'সদস্য'}`,
          status: 'approved',
          createdAt: p.createdAt || Date.now(),
          updatedAt: p.updatedAt || Date.now(),
        };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export async function listMembers(status?: MemberStatus): Promise<MemberProfile[]> {
  let dbMembers: MemberProfile[] = [];

  // 1. Fetch from Supabase 'members' table
  try {
    let q = supabase.from(COL).select('*').order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      dbMembers = data.map((r) => mapRow(r as Record<string, unknown>));
    }
  } catch {
    // ignore
  }

  // 2. Fetch from Supabase 'profiles' table to include all registered users
  try {
    let qProf = supabase.from('profiles').select('*');
    const { data: profData, error: profError } = await qProf;
    if (!profError && profData && profData.length > 0) {
      const profMembers: MemberProfile[] = profData
        .filter((p: any) => p.name && p.upazila)
        .map((p: any) => ({
          id: p.id,
          uid: p.id,
          name: p.name || 'সদস্য',
          photo: sanitizePhotoUrl(p.photo_url || p.photo),
          department: p.department || 'অনুল্লেখিত',
          session: p.session || p.student_session || '২০২২-২৩',
          hall: p.hall || 'অনুল্লেখিত',
          upazila: (p.upazila || 'ঝিনাইদহ সদর') as UpazilaName,
          phone: p.phone || '',
          email: p.email || '',
          bloodGroup: p.blood_group || p.bloodGroup || 'B+',
          bio: p.bio || `${p.name} - ${p.position || 'সদস্য'}`,
          status: p.status === 'suspended' ? 'rejected' : p.status === 'pending' ? 'pending' : 'approved',
          createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
          updatedAt: p.updated_at ? new Date(p.updated_at).getTime() : Date.now(),
        }));
      dbMembers = [...profMembers, ...dbMembers];
    }
  } catch {
    // ignore
  }

  // 3. Sync any local profiles on this device to Cloud Sync database
  try {
    await syncAllLocalMembersToCloud();
  } catch {
    // ignore
  }

  let combined = [...dbMembers];

  // 4. Fetch from global Cloud Sync Database (works across all devices & phones)
  try {
    const cloudMembers = await fetchCloudMembers();
    if (cloudMembers.length > 0) {
      combined = [...cloudMembers.map((m) => ({ ...m, photo: sanitizePhotoUrl(m.photo) })), ...combined];
    }
  } catch {
    // ignore
  }

  // 5. Merge local storage persisted members (jhenaidah_approved_members_v1 & jhenaidah_registered_users_v1)
  try {
    const memRaw = localStorage.getItem('jhenaidah_approved_members_v1');
    if (memRaw) {
      const localApproved: MemberProfile[] = JSON.parse(memRaw);
      combined = [...localApproved.map((m) => ({ ...m, photo: sanitizePhotoUrl(m.photo) })), ...combined];
    }

    const regRaw = localStorage.getItem('jhenaidah_registered_users_v1');
    if (regRaw) {
      const regList = JSON.parse(regRaw);
      const localRegistered: MemberProfile[] = regList
        .filter((r: any) => r.profile)
        .map((r: any) => ({
          id: r.profile.uid || `reg-${r.email}`,
          uid: r.profile.uid,
          name: r.profile.name,
          photo: sanitizePhotoUrl(r.profile.photoUrl),
          department: r.profile.department || 'অনুল্লেখিত',
          session: r.profile.studentSession || '২০২২-২৩',
          hall: r.profile.hall || 'অনুল্লেখিত',
          upazila: (r.profile.upazila || 'ঝিনাইদহ সদর') as UpazilaName,
          phone: r.profile.phone || '',
          email: r.email,
          bloodGroup: r.profile.bloodGroup || 'B+',
          bio: r.profile.bio || `${r.profile.name} - ${r.profile.position || 'সদস্য'}`,
          status: r.profile.status === 'pending' ? 'pending' : 'approved',
          createdAt: r.profile.createdAt || Date.now(),
          updatedAt: r.profile.updatedAt || Date.now(),
        }));
      combined = [...localRegistered, ...combined];
    }
  } catch {
    // ignore
  }

  // Deduplicate members by Email or ID, prioritizing custom non-unsplash photos
  const uniqueMap = new Map<string, MemberProfile>();
  for (const m of combined) {
    const key = (m.email ? m.email.toLowerCase() : m.id);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, { ...m });
    } else {
      const existing = uniqueMap.get(key)!;
      const isExistingDefault = !existing.photo || existing.photo.includes('unsplash.com') || existing.photo.startsWith('blob:');
      const isNewCustom = m.photo && !m.photo.includes('unsplash.com') && !m.photo.startsWith('blob:');

      const bestPhoto = isNewCustom ? m.photo : (isExistingDefault ? m.photo || existing.photo : existing.photo);

      uniqueMap.set(key, {
        ...existing,
        ...m,
        photo: sanitizePhotoUrl(bestPhoto),
        upazila: m.upazila || existing.upazila,
      });
    }
  }

  // Fallback: check avatar cache and demo user for custom profile photo
  for (const [key, m] of uniqueMap.entries()) {
    if (!m.photo || m.photo.includes('unsplash.com') || m.photo.startsWith('blob:')) {
      try {
        const cached = localStorage.getItem(`avatar-cache:${m.uid || m.id}`);
        if (cached && !cached.includes('unsplash.com') && !cached.startsWith('blob:')) {
          uniqueMap.set(key, { ...m, photo: cached });
          continue;
        }
        const demoRaw = localStorage.getItem('jhenaidah_demo_user');
        if (demoRaw) {
          const demoFs = JSON.parse(demoRaw);
          if ((demoFs.uid === m.uid || demoFs.email?.toLowerCase() === m.email?.toLowerCase()) && demoFs.photoUrl && !demoFs.photoUrl.startsWith('blob:')) {
            uniqueMap.set(key, { ...m, photo: demoFs.photoUrl });
          }
        }
      } catch {
        // ignore
      }
    }
  }

  let finalMembers = Array.from(uniqueMap.values());
  try {
    localStorage.setItem('jhenaidah_approved_members_v1', JSON.stringify(finalMembers));
  } catch {
    // ignore
  }

  if (status) {
    finalMembers = finalMembers.filter((m) => m.status === status);
  }
  return finalMembers;
}

export async function listApprovedMembers(): Promise<MemberProfile[]> {
  return listMembers('approved');
}

export async function listPendingMembers(): Promise<MemberProfile[]> {
  return listMembers('pending');
}

export async function listRejectedMembers(): Promise<MemberProfile[]> {
  return listMembers('rejected');
}

export interface PagedResult {
  items: MemberProfile[];
  hasMore: boolean;
}

export async function listMembersPaged(
  pageSize: number,
  _cursor: unknown
): Promise<PagedResult> {
  try {
    const { data, error } = await supabase
      .from(COL)
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(pageSize);
    if (error) throw error;
    const items = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    return { items, hasMore: items.length === pageSize };
  } catch {
    return { items: MEMBERS.filter((m) => m.status === 'approved').slice(0, pageSize), hasMore: false };
  }
}

export interface CreateMemberInput {
  id: string;
  name: string;
  photo: string;
  department: string;
  session: string;
  hall: string;
  upazila: UpazilaName;
  phone: string;
  email: string;
  bloodGroup: MemberProfile['bloodGroup'];
  facebook?: string;
  linkedin?: string;
  bio: string;
}

export async function createMember(input: CreateMemberInput): Promise<void> {
  const { error } = await supabase.from(COL).insert({
    id: input.id,
    name: input.name,
    photo: input.photo,
    department: input.department,
    session: input.session,
    hall: input.hall,
    upazila: input.upazila,
    phone: input.phone,
    email: input.email,
    blood_group: input.bloodGroup,
    facebook: input.facebook ?? null,
    linkedin: input.linkedin ?? null,
    bio: input.bio,
    status: 'pending',
  });
  if (error) throw error;
}

export interface UpdateMemberInput {
  name?: string;
  photo?: string;
  department?: string;
  session?: string;
  hall?: string;
  upazila?: UpazilaName;
  phone?: string;
  email?: string;
  bloodGroup?: MemberProfile['bloodGroup'];
  facebook?: string;
  linkedin?: string;
  bio?: string;
}

export async function updateMember(id: string, patch: UpdateMemberInput): Promise<void> {
  const { error } = await supabase
    .from(COL)
    .update({
      ...(patch.name && { name: patch.name }),
      ...(patch.photo && { photo: patch.photo }),
      ...(patch.department && { department: patch.department }),
      ...(patch.session && { session: patch.session }),
      ...(patch.hall && { hall: patch.hall }),
      ...(patch.upazila && { upazila: patch.upazila }),
      ...(patch.phone && { phone: patch.phone }),
      ...(patch.email && { email: patch.email }),
      ...(patch.bloodGroup !== undefined && { blood_group: patch.bloodGroup }),
      ...(patch.facebook !== undefined && { facebook: patch.facebook }),
      ...(patch.linkedin !== undefined && { linkedin: patch.linkedin }),
      ...(patch.bio !== undefined && { bio: patch.bio }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function setMemberStatus(id: string, status: MemberStatus): Promise<void> {
  const { error } = await supabase
    .from(COL)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function approveMember(id: string): Promise<void> {
  await setMemberStatus(id, 'approved');
}

export async function rejectMember(id: string): Promise<void> {
  await setMemberStatus(id, 'rejected');
}

export interface MemberFilters {
  query?: string;
  department?: string;
  session?: string;
  upazila?: UpazilaName | 'all';
  bloodGroup?: MemberProfile['bloodGroup'] | 'all';
}

export function filterMembers(members: MemberProfile[], f: MemberFilters): MemberProfile[] {
  const q = (f.query ?? '').trim().toLowerCase();
  return members.filter((m) => {
    if (m.status !== 'approved') return false;
    const haystack = [m.name, m.email, m.department, m.upazila ?? '', m.hall, m.bio, m.phone].filter(Boolean).join(' ').toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (f.department && f.department !== 'all' && m.department !== f.department) return false;
    if (f.session && f.session !== 'all' && m.session !== f.session) return false;
    if (f.upazila && f.upazila !== 'all' && m.upazila !== f.upazila) return false;
    if (f.bloodGroup && f.bloodGroup !== 'all' && m.bloodGroup !== f.bloodGroup) return false;
    return true;
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
