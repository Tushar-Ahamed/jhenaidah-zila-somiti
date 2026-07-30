import { supabase } from '@/lib/supabase';
import type {
  FirestoreUser,
  UserRole,
  UserStatus,
  CommitteeType,
  UpazilaName,
  AuditLog,
  AuditAction,
} from '@/types';

function mapRow(r: Record<string, unknown>): FirestoreUser {
  return {
    uid: r.id as string,
    name: r.name as string,
    email: r.email as string,
    role: r.role as UserRole,
    committeeType: (r.committee_type as CommitteeType) ?? null,
    upazila: (r.upazila as UpazilaName) ?? null,
    position: (r.position as string | null) ?? null,
    photoUrl: (r.photo_url as string | null) ?? null,
    status: r.status as UserStatus,
    createdAt: new Date(r.created_at as string).getTime(),
    updatedAt: new Date(r.updated_at as string).getTime(),
    securityKey: (r.security_key as string | undefined) ?? undefined,
    committeeCode: (r.committee_code as string | undefined) ?? undefined,
    approvedBy: (r.approved_by as string | null) ?? null,
  };
}

export async function getUserDoc(uid: string): Promise<FirestoreUser | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

export async function getUserDocSafe(uid: string) {
  const u = await getUserDoc(uid);
  if (!u) return null;
  const { securityKey, committeeCode, approvedBy, ...safe } = u;
  void securityKey; void committeeCode; void approvedBy;
  return safe;
}

export interface CreateSelfUserInput {
  uid: string;
  name: string;
  email: string;
  role: Extract<UserRole, 'student' | 'teacher' | 'alumni'>;
  upazila: UpazilaName;
}

export async function createSelfUser(input: CreateSelfUserInput): Promise<void> {
  const { error } = await supabase.from('profiles').insert({
    id: input.uid,
    name: input.name,
    email: input.email,
    role: input.role,
    committee_type: null,
    upazila: input.upazila,
    position: null,
    status: 'pending',
    approved_by: null,
  });
  if (error) throw error;
}

export interface CreateCommitteeUserInput {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  committeeType: CommitteeType;
  upazila: UpazilaName;
  position: string;
  securityKey: string;
  committeeCode: string;
  approvedBy: string;
}

export async function createCommitteeUser(input: CreateCommitteeUserInput): Promise<void> {
  const { error } = await supabase.from('profiles').insert({
    id: input.uid,
    name: input.name,
    email: input.email,
    role: input.role,
    committee_type: input.committeeType,
    upazila: input.upazila,
    position: input.position,
    status: 'active',
    security_key: input.securityKey,
    committee_code: input.committeeCode,
    approved_by: input.approvedBy,
  });
  if (error) throw error;
}

export interface UpdateProfileInput {
  name?: string;
  upazila?: UpazilaName;
  position?: string | null;
  photoUrl?: string | null;
  department?: string | null;
  studentSession?: string | null;
  bloodGroup?: string | null;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  hall?: string | null;
}

export async function updateOwnProfile(uid: string, patch: UpdateProfileInput): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    ...(patch.name && { name: patch.name }),
    ...(patch.upazila !== undefined && { upazila: patch.upazila }),
    ...(patch.position !== undefined && { position: patch.position }),
    ...(patch.photoUrl !== undefined && { photo_url: patch.photoUrl }),
    ...(patch.department !== undefined && { department: patch.department }),
    ...(patch.studentSession !== undefined && { student_session: patch.studentSession }),
    ...(patch.bloodGroup !== undefined && { blood_group: patch.bloodGroup }),
    ...(patch.phone !== undefined && { phone: patch.phone }),
    ...(patch.email !== undefined && { email: patch.email }),
    ...(patch.bio !== undefined && { bio: patch.bio }),
    ...(patch.hall !== undefined && { hall: patch.hall }),
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', uid);
  } catch {
    // fallback
  }

  // Also sync with Supabase 'members' table
  try {
    const memberPayload: Record<string, unknown> = {
      ...(patch.name && { name: patch.name }),
      ...(patch.upazila !== undefined && { upazila: patch.upazila }),
      ...(patch.photoUrl !== undefined && { photo: patch.photoUrl }),
      ...(patch.department !== undefined && { department: patch.department }),
      ...(patch.studentSession !== undefined && { session: patch.studentSession }),
      ...(patch.bloodGroup !== undefined && { blood_group: patch.bloodGroup }),
      ...(patch.phone !== undefined && { phone: patch.phone }),
      ...(patch.email !== undefined && { email: patch.email }),
      ...(patch.bio !== undefined && { bio: patch.bio }),
      ...(patch.hall !== undefined && { hall: patch.hall }),
      updated_at: new Date().toISOString(),
    };
    await supabase
      .from('members')
      .update(memberPayload)
      .or(`id.eq.${uid},uid.eq.${uid}`);
  } catch {
    // ignore
  }

  // Save photoUrl to localStorage caches
  if (patch.photoUrl) {
    try {
      localStorage.setItem(`avatar-cache:${uid}`, patch.photoUrl);
      if (patch.email) {
        localStorage.setItem(`avatar-cache:${patch.email.toLowerCase()}`, patch.photoUrl);
      }
      const demoRaw = localStorage.getItem('jhenaidah_demo_user');
      if (demoRaw) {
        const demo = JSON.parse(demoRaw);
        if (demo.uid === uid || (patch.email && demo.email?.toLowerCase() === patch.email.toLowerCase())) {
          demo.photoUrl = patch.photoUrl;
          demo.photo = patch.photoUrl;
          localStorage.setItem('jhenaidah_demo_user', JSON.stringify(demo));
        }
      }
    } catch {
      // ignore
    }
  }

  // Also sync with member storage
  try {
    const raw = localStorage.getItem('jhenaidah_approved_members_v1');
    if (raw) {
      const list = JSON.parse(raw);
      const updated = list.map((m: any) => {
        const isMatch = m.id === uid || m.uid === uid || (patch.email && m.email?.toLowerCase() === patch.email.toLowerCase());
        if (isMatch) {
          return {
            ...m,
            ...(patch.name && { name: patch.name }),
            ...(patch.upazila !== undefined && { upazila: patch.upazila }),
            ...(patch.photoUrl !== undefined && { photo: patch.photoUrl }),
            ...(patch.department !== undefined && { department: patch.department }),
            ...(patch.studentSession !== undefined && { session: patch.studentSession }),
            ...(patch.bloodGroup !== undefined && { bloodGroup: patch.bloodGroup }),
            ...(patch.phone !== undefined && { phone: patch.phone }),
            ...(patch.email !== undefined && { email: patch.email }),
            ...(patch.bio !== undefined && { bio: patch.bio }),
            ...(patch.hall !== undefined && { hall: patch.hall }),
          };
        }
        return m;
      });
      localStorage.setItem('jhenaidah_approved_members_v1', JSON.stringify(updated));
    }
  } catch {
    // ignore
  }

  // Also sync with registered users storage
  try {
    const regRaw = localStorage.getItem('jhenaidah_registered_users_v1');
    if (regRaw) {
      const list = JSON.parse(regRaw);
      const updated = list.map((r: any) => {
        const isMatch = r.profile?.uid === uid || (patch.email && r.email?.toLowerCase() === patch.email.toLowerCase());
        if (isMatch && r.profile) {
          return {
            ...r,
            profile: {
              ...r.profile,
              ...(patch.name && { name: patch.name }),
              ...(patch.photoUrl !== undefined && { photoUrl: patch.photoUrl }),
              ...(patch.upazila !== undefined && { upazila: patch.upazila }),
              ...(patch.department !== undefined && { department: patch.department }),
              ...(patch.studentSession !== undefined && { studentSession: patch.studentSession }),
              ...(patch.bloodGroup !== undefined && { bloodGroup: patch.bloodGroup }),
              ...(patch.phone !== undefined && { phone: patch.phone }),
              ...(patch.bio !== undefined && { bio: patch.bio }),
              ...(patch.hall !== undefined && { hall: patch.hall }),
            },
          };
        }
        return r;
      });
      localStorage.setItem('jhenaidah_registered_users_v1', JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}

export async function updateUserStatus(
  uid: string,
  status: UserStatus,
  actorId: string
): Promise<void> {
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'active') update.approved_by = actorId;
  const { error } = await supabase.from('profiles').update(update).eq('id', uid);
  if (error) throw error;
}

export async function softDeleteUser(uid: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', uid);
  if (error) throw error;
}

export async function listUsersByRole(role: UserRole): Promise<FirestoreUser[]> {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', role);
  if (error || !data) return [];
  return data.map((r) => mapRow(r as Record<string, unknown>));
}

export async function listPendingUsers(): Promise<FirestoreUser[]> {
  const { data, error } = await supabase.from('profiles').select('*').eq('status', 'pending');
  if (error || !data) return [];
  return data.map((r) => mapRow(r as Record<string, unknown>));
}

export async function listAllUsers(): Promise<FirestoreUser[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((r) => mapRow(r as Record<string, unknown>));
}

export async function listUsersByUpazila(upazila: UpazilaName): Promise<FirestoreUser[]> {
  const { data, error } = await supabase.from('profiles').select('*').eq('upazila', upazila);
  if (error || !data) return [];
  return data.map((r) => mapRow(r as Record<string, unknown>));
}

// ===== Audit Logs =====

export async function writeAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      actor_role: entry.actorRole,
      action: entry.action,
      target_id: entry.targetId ?? null,
      target_email: entry.targetEmail ?? null,
      details: entry.details ?? null,
    });
  } catch {
    // best-effort logging
  }
}

export async function listAuditLogs(limit = 50): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as string,
    actorId: r.actor_id as string,
    actorEmail: r.actor_email as string,
    actorRole: r.actor_role as UserRole,
    action: r.action as AuditAction,
    targetId: r.target_id ?? undefined,
    targetEmail: r.target_email ?? undefined,
    details: r.details ?? undefined,
    createdAt: new Date(r.created_at as string).getTime(),
  }));
}

export function describeAction(action: AuditAction): string {
  const map: Record<AuditAction, string> = {
    login: 'লগইন',
    logout: 'লগআউট',
    register: 'নিবন্ধন',
    profile_update: 'প্রোফাইল হালনাগাদ',
    status_change: 'স্ট্যাটাস পরিবর্তন',
    role_change: 'ভূমিকা পরিবর্তন',
    account_created: 'অ্যাকাউন্ট তৈরি',
    account_deleted: 'অ্যাকাউন্ট মুছে ফেলা হয়েছে',
    account_approved: 'অ্যাকাউন্ট অনুমোদিত',
    password_reset: 'পাসওয়ার্ড পুনঃনির্ধারণ',
    email_verified: 'ইমেইল যাচাই',
  };
  return map[action];
}
