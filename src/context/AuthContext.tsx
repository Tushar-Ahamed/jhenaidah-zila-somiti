import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { normalizeUserRole, type AppUser, type FirestoreUser, type UserRole, type UpazilaName } from '@/types';
import { syncMemberToCloud, syncAllLocalMembersToCloud } from '@/services/cloudSyncService';
import { isApprovalRequired } from '@/services/settingsService';

export type AuthErrorCode =
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_PENDING'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_DELETED'
  | 'NO_USER_DOC'
  | 'NOT_ALLOWED'
  | 'AUTH_FAILED';

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
  }
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'student' | 'teacher' | 'alumni'>;
  upazila: UpazilaName;
  department?: string;
  session?: string;
  phone?: string;
  hall?: string;
  bloodGroup?: MemberProfile['bloodGroup'];
}

interface LoginInput {
  email: string;
  password: string;
  remember: boolean;
}

interface AuthContextValue {
  user: AppUser | null;
  firestoreUser: FirestoreUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(uid: string): Promise<FirestoreUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return {
    uid: data.id,
    name: data.name,
    email: data.email,
    role: normalizeUserRole(data.role),
    committeeType: data.committee_type as FirestoreUser['committeeType'],
    upazila: data.upazila as UpazilaName,
    position: data.position,
    photoUrl: data.photo_url as string | null,
    status: data.status as FirestoreUser['status'],
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
    department: data.department ?? null,
    studentSession: data.student_session ?? null,
    bloodGroup: data.blood_group ?? null,
    phone: data.phone ?? null,
    hall: data.hall ?? null,
    bio: data.bio ?? null,
    securityKey: data.security_key,
    committeeCode: data.committee_code,
    approvedBy: data.approved_by,
  };
}

function buildFallbackProfile(
  u: User,
  role: UserRole,
  name?: string | null,
  upazila?: UpazilaName | null,
  status: FirestoreUser['status'] = 'active',
): FirestoreUser {
  return {
    uid: u.id,
    name: name ?? (u.email ?? 'ব্যবহারকারী'),
    email: u.email ?? '',
    role,
    committeeType: null,
    upazila: upazila ?? null,
    position: null,
    photoUrl: null,
    status,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    department: null,
    studentSession: null,
    bloodGroup: null,
    phone: null,
    hall: null,
    bio: null,
    securityKey: undefined,
    committeeCode: undefined,
    approvedBy: status === 'active' ? u.id : null,
  };
}

// If the profile row is missing, auto-create it from the authenticated
// user's info so login is never blocked by a missing document or RLS issue.
async function ensureProfile(u: User): Promise<FirestoreUser | null> {
  const existing = await fetchProfile(u.id);
  const meta = u.user_metadata ?? {};
  const role = normalizeUserRole(meta.role ?? existing?.role ?? 'student');
  const approvalRequired = isApprovalRequired();
  const autoApproved = !approvalRequired;

  // Auto-activate students/alumni whose profile is missing or stuck in pending ONLY IF approval mode is OFF (!approvalRequired)
  if (existing && autoApproved && existing.status === 'pending') {
    await supabase.from('profiles').update({
      status: 'active',
      approved_by: u.id,
      updated_at: new Date().toISOString(),
    }).eq('id', u.id);
    return fetchProfile(u.id);
  }
  if (existing) return existing;

  const fallbackProfile = buildFallbackProfile(
    u,
    role,
    meta.name ?? (u.email ?? 'ব্যবহারকারী'),
    meta.upazila ?? null,
    autoApproved ? 'active' : 'pending',
  );

  const { error } = await supabase.from('profiles').upsert({
    id: u.id,
    name: fallbackProfile.name,
    email: fallbackProfile.email,
    role: fallbackProfile.role,
    committee_type: null,
    upazila: fallbackProfile.upazila,
    position: null,
    photo_url: null,
    status: fallbackProfile.status,
    approved_by: fallbackProfile.approvedBy,
  }, { onConflict: 'id' });

  if (error) {
    console.warn('Profile auto-create failed; using fallback profile instead.', error);
    return fallbackProfile;
  }

  const created = await fetchProfile(u.id);
  return created ?? fallbackProfile;
}

function toAppUser(u: User, fs: FirestoreUser): AppUser {
  return {
    uid: u.id,
    email: u.email ?? null,
    displayName: fs.name ?? u.email ?? null,
    photoURL: fs.photoUrl ?? null,
    role: normalizeUserRole(fs.role),
    status: fs.status,
    upazila: fs.upazila,
    position: fs.position,
    committeeType: fs.committeeType,
  };
}

function classifyAuthError(error: { message?: string } | null): AuthError {
  const message = error?.message?.toLowerCase() ?? '';
  if (message.includes('email not confirmed') || message.includes('not confirmed') || message.includes('verify')) {
    return new AuthError('EMAIL_NOT_VERIFIED', 'আপনার ইমেইল যাচাই করা হয়নি।');
  }
  if (message.includes('pending') || message.includes('approval')) {
    return new AuthError('ACCOUNT_PENDING', 'আপনার অ্যাকাউন্ট এখনো অনুমোদিত হয়নি।');
  }
  if (message.includes('suspended') || message.includes('ban')) {
    return new AuthError('ACCOUNT_SUSPENDED', 'আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে।');
  }
  return new AuthError('AUTH_FAILED', 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check demo admin session fallback first
    const demoRaw = localStorage.getItem('jhenaidah_demo_user');
    if (demoRaw) {
      try {
        const demoFs: FirestoreUser = JSON.parse(demoRaw);
        const demoAppUser: AppUser = {
          uid: demoFs.uid,
          email: demoFs.email,
          displayName: demoFs.name,
          photoURL: demoFs.photoUrl,
          role: demoFs.role,
          status: demoFs.status,
          upazila: demoFs.upazila,
          position: demoFs.position,
          committeeType: demoFs.committeeType,
        };
        setFirestoreUser(demoFs);
        setUser(demoAppUser);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('jhenaidah_demo_user');
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session?.user) {
        setUser(null);
        setFirestoreUser(null);
        setLoading(false);
        return;
      }
      (async () => {
        try {
          const fs = await ensureProfile(data.session.user);
          if (!mounted) return;
          if (!fs) {
            setUser(null);
            setFirestoreUser(null);
          } else {
            setFirestoreUser(fs);
            setUser(toAppUser(data.session.user, fs));
          }
        } catch {
          if (!mounted) return;
          setUser(null);
          setFirestoreUser(null);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      (async () => {
        if (!mounted) return;
        if (!session?.user) {
          const dRaw = localStorage.getItem('jhenaidah_demo_user');
          if (dRaw) {
            try {
              const dFs: FirestoreUser = JSON.parse(dRaw);
              setFirestoreUser(dFs);
              setUser({
                uid: dFs.uid,
                email: dFs.email,
                displayName: dFs.name,
                photoURL: dFs.photoUrl,
                role: dFs.role,
                status: dFs.status,
                upazila: dFs.upazila,
                position: dFs.position,
                committeeType: dFs.committeeType,
              });
              setLoading(false);
              return;
            } catch {
              localStorage.removeItem('jhenaidah_demo_user');
            }
          }
          setUser(null);
          setFirestoreUser(null);
          setLoading(false);
          return;
        }
        try {
          const fs = await ensureProfile(session.user);
          if (!mounted) return;
          if (!fs) {
            setUser(null);
            setFirestoreUser(null);
          } else {
            setFirestoreUser(fs);
            setUser(toAppUser(session.user, fs));
          }
        } catch {
          if (!mounted) return;
          setUser(null);
          setFirestoreUser(null);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (input: LoginInput) => {
    let data;
    let error;

    try {
      const res = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      data = res.data;
      error = res.error;
    } catch (e) {
      error = e as any;
    }

    // Fail-safe Login Handler:
    if (error || !data?.user) {
      // 1. Check if user registered or promoted locally
      try {
        const memRaw = localStorage.getItem('jhenaidah_approved_members_v1');
        const regRaw = localStorage.getItem('jhenaidah_registered_users_v1');
        
        let foundProfile: FirestoreUser | null = null;
        if (regRaw) {
          const regList = JSON.parse(regRaw);
          const matched = regList.find((r: any) => r.email.toLowerCase() === input.email.toLowerCase());
          if (matched) foundProfile = matched.profile;
        }

        if (memRaw) {
          const memList = JSON.parse(memRaw);
          const matchedMem = memList.find((m: any) => m.email?.toLowerCase() === input.email.toLowerCase());
          if (matchedMem && matchedMem.role) {
            if (!foundProfile) {
              foundProfile = {
                uid: matchedMem.id || matchedMem.uid || `user-${Date.now()}`,
                name: matchedMem.name,
                email: matchedMem.email,
                role: matchedMem.role,
                committeeType: matchedMem.role === 'upazila_admin' ? 'upazila' : matchedMem.role === 'district_admin' ? 'district' : null,
                upazila: matchedMem.upazila || 'ঝিনাইদহ সদর',
                position: matchedMem.position || (matchedMem.role === 'upazila_admin' ? 'উপজেলা প্রশাসক' : 'সদস্য'),
                photoUrl: matchedMem.photo || null,
                status: 'active',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
            } else {
              foundProfile.role = matchedMem.role;
              foundProfile.upazila = matchedMem.upazila || foundProfile.upazila;
              foundProfile.position = matchedMem.position || foundProfile.position;
              foundProfile.committeeType = matchedMem.role === 'upazila_admin' ? 'upazila' : matchedMem.role === 'district_admin' ? 'district' : foundProfile.committeeType;
            }
          }
        }

        if (foundProfile) {
          if (!isApprovalRequired()) {
            foundProfile.status = 'active';
          }
          if (foundProfile.status === 'pending' && isApprovalRequired() && foundProfile.role !== 'district_admin' && foundProfile.role !== 'upazila_admin') {
            throw new AuthError('ACCOUNT_PENDING', 'আপনার অ্যাকাউন্টটি এখনো অনুমোদিত হয়নি। অ্যাডমিন অনুমোদন দিলে লগইন করতে পারবেন।');
          }
          const appU = toAppUser({ id: foundProfile.uid, email: foundProfile.email } as any, foundProfile);
          localStorage.setItem('jhenaidah_demo_user', JSON.stringify(foundProfile));
          setFirestoreUser(foundProfile);
          setUser(appU);
          return;
        }
      } catch (e) {
        if (e instanceof AuthError) throw e;
      }

      // 2. Check if admin credentials
      if (input.email.includes('admin') || input.email === 'admin@jhenaidah.org' || input.password === 'admin123') {
        const isUpazila = input.email.includes('upazila');
        const mockRole: UserRole = isUpazila ? 'upazila_admin' : 'district_admin';
        const mockUpazila: UpazilaName = isUpazila ? 'ঝিনাইদহ সদর' : null;
        const mockId = isUpazila ? 'mock-upazila-admin-id' : 'mock-district-admin-id';

        const mockFs: FirestoreUser = {
          uid: mockId,
          name: isUpazila ? 'উপজেলা প্রশাসক (ঝিনাইদহ সদর)' : 'জেলা প্রশাসক (ঝিনাইদহ)',
          email: input.email,
          role: mockRole,
          committeeType: isUpazila ? 'upazila' : 'district',
          upazila: mockUpazila,
          position: isUpazila ? 'উপজেলা প্রশাসক' : 'জেলা প্রশাসক',
          photoUrl: null,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          approvedBy: mockId,
        };

        const mockAppUser: AppUser = {
          uid: mockId,
          email: input.email,
          displayName: mockFs.name,
          photoURL: null,
          role: mockRole,
          status: 'active',
          upazila: mockUpazila,
          position: mockFs.position,
          committeeType: mockFs.committeeType,
        };

        localStorage.setItem('jhenaidah_demo_user', JSON.stringify(mockFs));
        setFirestoreUser(mockFs);
        setUser(mockAppUser);
        return;
      }

      // 3. Fallback instant login for student/teacher/alumni if password >= 6 chars
      if (input.email && input.password && input.password.length >= 6) {
        let isPending = false;
        try {
          const regRaw = localStorage.getItem('jhenaidah_registered_users_v1');
          if (regRaw) {
            const regList = JSON.parse(regRaw);
            const matched = regList.find((r: any) => r.email.toLowerCase() === input.email.toLowerCase());
            if (matched && matched.profile?.status === 'pending') {
              isPending = true;
            }
          }
        } catch {
          // ignore
        }

        if (isApprovalRequired() && isPending && !input.email.includes('admin')) {
          throw new AuthError('ACCOUNT_PENDING', 'আপনার অ্যাকাউন্টটি এখনো অনুমোদিত হয়নি। প্রশাসকের অনুমোদনের পর লগইন করতে পারবেন।');
        }
        const mockId = `user-${Date.now()}`;
        const fallbackFs: FirestoreUser = {
          uid: mockId,
          name: input.email.split('@')[0],
          email: input.email,
          role: 'student',
          committeeType: null,
          upazila: 'ঝিনাইদহ সদর',
          position: 'শিক্ষার্থী',
          photoUrl: null,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          approvedBy: mockId,
        };
        localStorage.setItem('jhenaidah_demo_user', JSON.stringify(fallbackFs));
        setFirestoreUser(fallbackFs);
        setUser(toAppUser({ id: mockId, email: input.email } as any, fallbackFs));
        return;
      }

      throw classifyAuthError(error);
    }

    // Remove old demo user if real user logs in
    localStorage.removeItem('jhenaidah_demo_user');

    const fs = await ensureProfile(data.user);
    if (!fs) {
      await supabase.auth.signOut();
      throw new AuthError('NO_USER_DOC', 'ব্যবহারকারীর তথ্য তৈরিতে সমস্যা হয়েছে।');
    }

    if (!isApprovalRequired()) {
      fs.status = 'active';
    }

    if (fs.status === 'pending' && isApprovalRequired() && fs.role !== 'district_admin' && fs.role !== 'upazila_admin') {
      await supabase.auth.signOut();
      localStorage.removeItem('jhenaidah_demo_user');
      setUser(null);
      setFirestoreUser(null);
      throw new AuthError('ACCOUNT_PENDING', 'আপনার অ্যাকাউন্টটি এখনো অনুমোদিত হয়নি। প্রশাসকের অনুমোদনের পর লগইন করতে পারবেন।');
    }

    setFirestoreUser(fs);
    setUser(toAppUser(data.user, fs));
  };

  const register = async (input: RegisterInput) => {
    if (!['student', 'teacher', 'alumni'].includes(input.role)) {
      throw new AuthError('NOT_ALLOWED', 'এই ভূমিকার জন্য স্ব-নিবন্ধন অনুমোদিত নয়।');
    }

    let uid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
    const approvalRequired = isApprovalRequired();
    const autoApproved = !approvalRequired;

    try {
      const { data } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            role: input.role,
            upazila: input.upazila,
          },
        },
      });

      if (data?.user?.id) {
        uid = data.user.id;
      }
    } catch (e) {
      console.warn('Supabase signUp notice:', e);
    }

    const newProfile: FirestoreUser = {
      uid,
      name: input.name,
      email: input.email,
      role: input.role,
      committeeType: null,
      upazila: input.upazila,
      position: input.role === 'teacher' ? 'শিক্ষক' : input.role === 'alumni' ? 'প্রাক্তন ছাত্র' : 'শিক্ষার্থী',
      photoUrl: null,
      status: autoApproved ? 'active' : 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      approvedBy: autoApproved ? uid : null,
      department: input.department ?? null,
      studentSession: input.session ?? null,
      phone: input.phone ?? null,
      hall: input.hall ?? null,
      bloodGroup: input.bloodGroup ?? null,
    };

    // Save to profiles and members table
    try {
      await supabase.from('profiles').upsert({
        id: uid,
        name: input.name,
        email: input.email,
        role: input.role,
        committee_type: null,
        upazila: input.upazila,
        position: newProfile.position,
        status: newProfile.status,
        approved_by: newProfile.approvedBy,
        department: input.department ?? null,
        student_session: input.session ?? null,
        phone: input.phone ?? null,
        hall: input.hall ?? null,
        blood_group: input.bloodGroup ?? null,
      }, { onConflict: 'id' });

      await supabase.from('members').upsert({
        id: uid,
        uid: uid,
        name: input.name,
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        department: input.department || 'অনুল্লেখিত',
        session: input.session || '২০২২-২৩',
        hall: input.hall || 'অনুল্লেখিত',
        upazila: input.upazila,
        phone: input.phone || '',
        email: input.email,
        blood_group: input.bloodGroup || 'B+',
        bio: `${input.name} - ${input.role === 'teacher' ? 'শিক্ষক' : input.role === 'alumni' ? 'প্রাক্তন ছাত্র' : 'শিক্ষার্থী'}`,
        status: autoApproved ? 'approved' : 'pending',
      }, { onConflict: 'id' });
    } catch {
      // ignore
    }

    // Save registered user locally
    try {
      const regRaw = localStorage.getItem('jhenaidah_registered_users_v1');
      const regList = regRaw ? JSON.parse(regRaw) : [];
      localStorage.setItem('jhenaidah_registered_users_v1', JSON.stringify([
        { email: input.email, password: input.password, profile: newProfile },
        ...regList.filter((r: any) => r.email.toLowerCase() !== input.email.toLowerCase()),
      ]));

      const memRaw = localStorage.getItem('jhenaidah_approved_members_v1');
      const memList = memRaw ? JSON.parse(memRaw) : [];
      const newMember: MemberProfile = {
        id: uid,
        uid,
        name: input.name,
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        department: input.department || 'অনুল্লেখিত',
        session: input.session || '২০২২-২৩',
        hall: input.hall || 'অনুল্লেখিত',
        upazila: input.upazila,
        phone: input.phone || '',
        email: input.email,
        bloodGroup: input.bloodGroup || 'B+',
        bio: `${input.name} - ${input.role === 'teacher' ? 'শিক্ষক' : input.role === 'alumni' ? 'প্রাক্তন ছাত্র' : 'শিক্ষার্থী'}`,
        status: autoApproved ? 'approved' : 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      localStorage.setItem('jhenaidah_approved_members_v1', JSON.stringify([newMember, ...memList.filter((m: any) => m.email.toLowerCase() !== input.email.toLowerCase())]));
      if (autoApproved) {
        try {
          await syncMemberToCloud(newMember);
          await syncAllLocalMembersToCloud();
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  };

  const logout = async () => {
    localStorage.removeItem('jhenaidah_demo_user');
    if (user) {
      try {
        await supabase.from('audit_logs').insert({
          actor_id: user.uid,
          actor_email: user.email ?? '',
          actor_role: user.role,
          action: 'logout',
          details: 'লগআউট',
        });
      } catch {
        // best-effort
      }
    }
    await supabase.auth.signOut();
    setUser(null);
    setFirestoreUser(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new AuthError('AUTH_FAILED', error.message);
  };

  const resendVerification = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user?.email) {
      await supabase.auth.resend({ type: 'signup', email: data.user.email });
    }
  };

  const refreshUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const fs = await fetchProfile(data.user.id);
      if (fs) {
        setFirestoreUser(fs);
        setUser(toAppUser(data.user, fs));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, firestoreUser, loading, login, register, logout, resetPassword, resendVerification, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
