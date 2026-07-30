import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { FadeIn } from '@/components/ui/FadeIn';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { updateOwnProfile, writeAuditLog } from '@/services/userService';
import { getMember } from '@/services/memberService';
import { deleteProfileImageByUrl, fileToDataURL, optimizeImageForUpload, uploadAvatar } from '@/services/uploadService';
import { syncMemberToCloud } from '@/services/cloudSyncService';
import { ROLE_LABELS, STATUS_LABELS, UPAZILA_OPTIONS, type UpazilaName } from '@/types';
import { Activity, Award, BookOpen, Briefcase, Calendar, Camera, Clock3, Globe, ImagePlus, Loader2, Mail, MapPin, Phone, Save, Shield, Sparkles, User, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface FormValues {
  name: string;
  upazila: UpazilaName;
  position?: string;
  department?: string;
  studentSession?: string;
  bloodGroup?: string;
  phone?: string;
  email?: string;
  hall?: string;
  bio?: string;
}

export function DashboardProfile() {
  const { user, firestoreUser, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatar, setAvatar] = useState<string | null>(user?.photoURL ?? null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageData, setCropImageData] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: user?.displayName ?? '',
      upazila: user?.upazila ?? 'ঝিনাইদহ সদর',
      position: user?.position ?? '',
      department: firestoreUser?.department ?? '',
      studentSession: firestoreUser?.studentSession ?? '২০২২-২৩',
      bloodGroup: firestoreUser?.bloodGroup ?? 'B+',
      phone: firestoreUser?.phone ?? '',
      email: user?.email ?? '',
      hall: firestoreUser?.hall ?? '',
      bio: firestoreUser?.bio ?? '',
    },
  });

  useEffect(() => {
    if (!user?.uid) return;
    const cachedAvatar = window.localStorage.getItem(`avatar-cache:${user.uid}`);
    if (cachedAvatar) {
      setAvatar(cachedAvatar);
      return;
    }
    setAvatar(user.photoURL ?? null);
  }, [user?.uid, user?.photoURL]);

  useEffect(() => {
    if (!user?.uid) return;
    const cachedCover = window.localStorage.getItem(`cover-cache:${user.uid}`);
    if (cachedCover) setCoverPhoto(cachedCover);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      const fullMember = await getMember(user.uid);
      if (!active) return;

      const name = firestoreUser?.name || fullMember?.name || user.displayName || '';
      const upazila = firestoreUser?.upazila || fullMember?.upazila || user.upazila || 'ঝিনাইদহ সদর';
      const position = firestoreUser?.position || fullMember?.position || user.position || '';
      const department = firestoreUser?.department || fullMember?.department || '';
      const studentSession = firestoreUser?.studentSession || fullMember?.session || '২০২২-২৩';
      const bloodGroup = firestoreUser?.bloodGroup || fullMember?.bloodGroup || 'B+';
      const phone = firestoreUser?.phone || fullMember?.phone || '';
      const email = firestoreUser?.email || fullMember?.email || user.email || '';
      const hall = firestoreUser?.hall || fullMember?.hall || '';
      const bio = firestoreUser?.bio || fullMember?.bio || '';

      reset({
        name,
        upazila,
        position,
        department,
        studentSession,
        bloodGroup,
        phone,
        email,
        hall,
        bio,
      });
    })();
    return () => { active = false; };
  }, [reset, user, firestoreUser]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  if (!user) return null;

  const profileCompletion = useMemo(() => {
    let score = 0;
    const checks = [
      Boolean(user.displayName),
      Boolean(user.email),
      Boolean(user.upazila),
      Boolean(user.department),
      Boolean(user.phone),
    ];
    checks.forEach((ok) => {
      if (ok) score += 20;
    });
    return score;
  }, [user]);

  const openCropper = (file: File) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;
    setSelectedFile(file);
    setCropImageData(previewUrl);
    setZoom(1);
    setRotation(0);
    setDragOffset({ x: 0, y: 0 });
    setCropModalOpen(true);
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'];
    const extensionOk = /\.(png|jpe?g|webp|heic|heif)$/i.test(file.name);
    if (!allowed.includes(file.type) && !extensionOk) {
      toast.error('অনুমোদিত ফাইল: JPG, PNG, WEBP, HEIC');
      return;
    }
    openCropper(file);
    if (e.target) e.target.value = '';
  };

  const handleCoverPhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'];
    const extensionOk = /\.(png|jpe?g|webp|heic|heif)$/i.test(file.name);
    if (!allowed.includes(file.type) && !extensionOk) {
      toast.error('কভার ফটো আপলোড করতে JPG/PNG/WebP ব্যবহার করুন');
      return;
    }
    try {
      const optimized = await optimizeImageForUpload(file, { maxWidth: 1600, maxHeight: 900, quality: 0.9, maxSizeMB: 10 });
      const url = URL.createObjectURL(optimized);
      setCoverPhoto(url);
      window.localStorage.setItem(`cover-cache:${user.uid}`, url);
      toast.success('কভার ফটো আপডেট করা হয়েছে');
    } catch {
      toast.error('কভার ফটো আপলোড ব্যর্থ হয়েছে');
    } finally {
      if (coverFileRef.current) coverFileRef.current.value = '';
    }
  };

  const handleApplyCrop = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      setUploadProgress(10);
      const optimized = await optimizeImageForUpload(selectedFile, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.85,
        maxSizeMB: 10,
        crop: {
          zoom,
          rotation,
          offsetX: dragOffset.x,
          offsetY: dragOffset.y,
        },
      });
      setUploadProgress(35);
      const { url } = await uploadAvatar(optimized, user.uid, (percent) => setUploadProgress(percent));
      setUploadProgress(100);
      if (avatar) {
        try {
          await deleteProfileImageByUrl(avatar);
        } catch {
          // best-effort
        }
      }
      const nextUrl = url;
      setAvatar(nextUrl);
      window.localStorage.setItem(`avatar-cache:${user.uid}`, nextUrl);
      if (user.email) {
        window.localStorage.setItem(`avatar-cache:${user.email.toLowerCase()}`, nextUrl);
      }
      try {
        await updateOwnProfile(user.uid, { photoUrl: nextUrl, email: user.email ?? undefined });
        const formVals = getValues();
        await syncMemberToCloud({
          id: user.uid,
          uid: user.uid,
          name: formVals.name || user.displayName || 'সদস্য',
          photo: nextUrl,
          department: formVals.department || user.department || 'অনুল্লেখিত',
          session: formVals.studentSession || user.studentSession || '২০২২-২৩',
          hall: formVals.hall || user.hall || 'অনুল্লেখিত',
          upazila: formVals.upazila || user.upazila || 'ঝিনাইদহ সদর',
          phone: formVals.phone || user.phone || '',
          email: user.email || formVals.email || '',
          bloodGroup: (formVals.bloodGroup as any) || user.bloodGroup || 'B+',
          bio: formVals.bio || user.bio || `${formVals.name || user.displayName} - ${formVals.position || 'সদস্য'}`,
          status: 'approved',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } catch {
        // keep local preview even if DB update fails
      }
      try {
        await writeAuditLog({
          actorId: user.uid,
          actorEmail: user.email ?? '',
          actorRole: user.role,
          action: 'profile_update',
          details: 'প্রোফাইল ছবি আপলোড',
        });
      } catch {
        // best-effort
      }
      try {
        await refreshUser();
      } catch {
        // best-effort
      }
      toast.success('প্রোফাইল ছবি আপডেট করা হয়েছে');
      closeCropper();
    } catch {
      try {
        const fallbackUrl = await fileToDataURL(selectedFile);
        setAvatar(fallbackUrl);
        window.localStorage.setItem(`avatar-cache:${user.uid}`, fallbackUrl);
        const formVals = getValues();
        await syncMemberToCloud({
          id: user.uid,
          uid: user.uid,
          name: formVals.name || user.displayName || 'সদস্য',
          photo: fallbackUrl,
          department: formVals.department || user.department || 'অনুল্লেখিত',
          session: formVals.studentSession || user.studentSession || '২০২২-২৩',
          hall: formVals.hall || user.hall || 'অনুল্লেখিত',
          upazila: formVals.upazila || user.upazila || 'ঝিনাইদহ সদর',
          phone: formVals.phone || user.phone || '',
          email: user.email || formVals.email || '',
          bloodGroup: (formVals.bloodGroup as any) || user.bloodGroup || 'B+',
          bio: formVals.bio || user.bio || `${formVals.name || user.displayName} - ${formVals.position || 'সদস্য'}`,
          status: 'approved',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        toast.success('ছবির প্রিভিউ আপডেট করা হয়েছে');
      } catch {
        toast.error('ছবি প্রসেস করতে সমস্যা হয়েছে');
      }
      closeCropper();
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const closeCropper = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setCropModalOpen(false);
    setCropImageData(null);
    setSelectedFile(null);
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setUploading(true);
    try {
      await updateOwnProfile(user.uid, { photoUrl: null });
      setAvatar(null);
      window.localStorage.removeItem(`avatar-cache:${user.uid}`);
      if (avatar) await deleteProfileImageByUrl(avatar);
      await writeAuditLog({ actorId: user.uid, actorEmail: user.email ?? '', actorRole: user.role, action: 'profile_update', details: 'প্রোফাইল ছবি মুছে ফেলা হয়েছে' });
      await refreshUser();
      toast.success('ছবি মুছে ফেলা হয়েছে');
    } catch {
      toast.error('ছবি মুছতে সমস্যা হয়েছে');
    } finally {
      setUploading(false);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragStartRef.current) return;
    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    setDragOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
  };

  const handlePointerUp = () => {
    setDragging(false);
    dragStartRef.current = null;
  };

  const onSubmit = async (data: FormValues) => {
    try {
      await updateOwnProfile(user.uid, {
        name: data.name,
        upazila: data.upazila,
        position: data.position || null,
        department: data.department || null,
        studentSession: data.studentSession || null,
        bloodGroup: data.bloodGroup || null,
        phone: data.phone || null,
        email: data.email || null,
        hall: data.hall || null,
        bio: data.bio || null,
      });
    } catch {
      // ignore
    }

    try {
      const demoRaw = localStorage.getItem('jhenaidah_demo_user');
      if (demoRaw) {
        const demo = JSON.parse(demoRaw);
        demo.name = data.name;
        demo.upazila = data.upazila;
        demo.position = data.position || null;
        demo.department = data.department || null;
        demo.studentSession = data.studentSession || null;
        demo.bloodGroup = data.bloodGroup || null;
        demo.phone = data.phone || null;
        demo.email = data.email || null;
        demo.hall = data.hall || null;
        demo.bio = data.bio || null;
        localStorage.setItem('jhenaidah_demo_user', JSON.stringify(demo));
      }

      const memRaw = localStorage.getItem('jhenaidah_approved_members_v1');
      if (memRaw) {
        const list = JSON.parse(memRaw);
        const updatedList = list.map((m: any) => {
          if (m.id === user.uid || m.email?.toLowerCase() === user.email?.toLowerCase()) {
            return {
              ...m,
              name: data.name,
              upazila: data.upazila,
              department: data.department || m.department,
              session: data.studentSession || m.session,
              bloodGroup: data.bloodGroup || m.bloodGroup,
              phone: data.phone || m.phone,
              email: data.email || m.email,
              hall: data.hall || m.hall,
              bio: data.bio || m.bio,
            };
          }
          return m;
        });
        localStorage.setItem('jhenaidah_approved_members_v1', JSON.stringify(updatedList));
      }
    } catch {
      // ignore
    }

    try {
      await refreshUser();
    } catch {
      // ignore
    }

    toast.success('আপনার প্রোফাইল তথ্য সফলভাবে আপডেট করা হয়েছে!');
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">আমার প্রোফাইল</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">একটি premium social profile experience</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => coverFileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-bd-green-200 bg-bd-green-50 px-3.5 py-2 text-sm font-semibold text-bd-green-700 transition hover:bg-bd-green-100 dark:border-bd-green-800 dark:bg-bd-green-900/30 dark:text-bd-green-300">
              <ImagePlus className="h-4 w-4" /> Change Cover Photo
            </button>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-ghost"><User className="h-4 w-4" /> সম্পাদন করুন</button>
            )}
          </div>
          <input ref={coverFileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif" className="hidden" onChange={handleCoverPhotoUpload} />
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="overflow-hidden rounded-[24px] border border-gray-200/70 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.08)] dark:border-gray-800 dark:bg-gray-900">
          <div className="relative h-56 overflow-hidden sm:h-72 md:h-80">
            <div
              className="absolute inset-0 bg-gradient-to-r from-bd-green-600 via-emerald-500 to-teal-500"
              style={coverPhoto ? { backgroundImage: `url(${coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(0,0,0,0.24))]" />
          </div>

          <div className="px-4 pb-6 sm:px-6 md:px-8">
            <div className="relative -mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full border-[5px] border-white bg-white shadow-[0_18px_40px_rgba(0,0,0,0.2)] dark:border-gray-900 dark:bg-gray-900 sm:h-36 sm:w-36">
                    {avatar ? (
                      <img src={avatar} alt={user.displayName ?? 'avatar'} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <span className="text-4xl font-bold text-bd-green-700 dark:text-bd-green-300 sm:text-5xl">
                        {user.displayName?.[0] ?? user.email?.[0] ?? 'U'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white text-bd-green-700 shadow-lg transition hover:scale-105 hover:bg-gray-50 disabled:opacity-50"
                    title="ছবি আপলোড করুন"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif" className="hidden" onChange={handlePhotoUpload} />
                </div>
                <div className="flex flex-wrap gap-2 sm:pb-2">
                  <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-bd-green-200 bg-bd-green-50 px-3.5 py-2 text-sm font-semibold text-bd-green-700 transition hover:bg-bd-green-100 dark:border-bd-green-800 dark:bg-bd-green-900/30 dark:text-bd-green-300 disabled:opacity-50">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    Change Profile Photo
                  </button>
                  {avatar && (
                    <button type="button" onClick={handleRemovePhoto} disabled={uploading} className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-600 transition hover:text-bd-red-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300">
                      <X className="h-4 w-4" /> Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 sm:pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.displayName ?? 'নামহীন সদস্য'}</h2>
                  <Badge variant={user.role === 'district_admin' ? 'red' : 'green'}><Shield className="h-3 w-3" /> {ROLE_LABELS[user.role]}</Badge>
                  <Badge variant="blue">{STATUS_LABELS[user.status]}</Badge>
                  {user.bloodGroup && <Badge variant="red">🩸 {user.bloodGroup}</Badge>}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="rounded-[20px] border border-gray-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">About / সংক্ষিপ্ত পরিচিতি</p>
                      <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{user.displayName ?? 'সদস্য'}</h3>
                    </div>
                    <div className="rounded-full bg-bd-green-50 p-2 text-bd-green-700 dark:bg-bd-green-900/30 dark:text-bd-green-300">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    {user.bio || `${user.displayName ?? 'এই সদস্য'} ${user.upazila ? `উপজেলা ${user.upazila} এর` : 'একজন'} ${ROLE_LABELS[user.role]} হিসেবে যুক্ত আছেন।`}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[20px] border border-gray-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Personal Information / শিক্ষা তথ্য</p>
                    <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-bd-green-600 shrink-0" /> <span className="font-medium text-gray-500 dark:text-gray-400">উপজেলা:</span> {user.upazila ?? 'অনুল্লেখিত'}</div>
                      <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-bd-green-600 shrink-0" /> <span className="font-medium text-gray-500 dark:text-gray-400">বিভাগ:</span> {user.department || 'অনুল্লেখিত'}</div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-bd-green-600 shrink-0" /> <span className="font-medium text-gray-500 dark:text-gray-400">সেশন:</span> {user.studentSession || '২০২২-২৩'}</div>
                      <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-bd-green-600 shrink-0" /> <span className="font-medium text-gray-500 dark:text-gray-400">পদবি:</span> {user.position || 'অনুল্লেখিত'}</div>
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-gray-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Contact & Other Details</p>
                    <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-bd-green-600 shrink-0" /> <span className="font-medium text-gray-500 dark:text-gray-400">ইমেইল:</span> {user.email ?? '—'}</div>
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-bd-green-600 shrink-0" /> <span className="font-medium text-gray-500 dark:text-gray-400">ফোন:</span> {user.phone || 'অনুল্লেখিত'}</div>
                      <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-bd-green-600 shrink-0" /> <span className="font-medium text-gray-500 dark:text-gray-400">রক্তের গ্রুপ:</span> {user.bloodGroup || 'অনুল্লেখিত'}</div>
                      <div className="flex items-center gap-2"><Award className="h-4 w-4 text-bd-green-600 shrink-0" /> <span className="font-medium text-gray-500 dark:text-gray-400">হল:</span> {user.hall || 'অনুল্লেখিত'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[20px] border border-gray-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Quick Actions</p>
                      <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">দ্রুত সম্পাদনা</h3>
                    </div>
                    <div className="rounded-full bg-bd-green-50 p-2 text-bd-green-700 dark:bg-bd-green-900/30 dark:text-bd-green-300">
                      <Activity className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <button type="button" onClick={() => setEditing(true)} className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:border-bd-green-300 hover:bg-bd-green-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-bd-green-900/20">
                      <span className="flex items-center gap-2"><User className="h-4 w-4" /> Edit Profile</span>
                      <span className="text-gray-400">→</span>
                    </button>
                    <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:border-bd-green-300 hover:bg-bd-green-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-bd-green-900/20">
                      <span className="flex items-center gap-2"><Camera className="h-4 w-4" /> Upload Profile Photo</span>
                      <span className="text-gray-400">→</span>
                    </button>
                    <button type="button" onClick={() => coverFileRef.current?.click()} className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:border-bd-green-300 hover:bg-bd-green-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-bd-green-900/20">
                      <span className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Change Cover</span>
                      <span className="text-gray-400">→</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-[20px] border border-gray-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Contact Information</p>
                      <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">যোগাযোগের বিবরণ</h3>
                    </div>
                    <div className="rounded-full bg-bd-green-50 p-2 text-bd-green-700 dark:bg-bd-green-900/30 dark:text-bd-green-300">
                      <Phone className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-bd-green-600" /> {user.email ?? '—'}</div>
                    <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-bd-green-600" /> {user.upazila ?? '—'}</div>
                    <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-bd-green-600" /> {user.position ?? '—'}</div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-gray-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Recent Activity</p>
                      <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">সাম্প্রতিক কার্যক্রম</h3>
                    </div>
                    <div className="rounded-full bg-bd-green-50 p-2 text-bd-green-700 dark:bg-bd-green-900/30 dark:text-bd-green-300">
                      <Clock3 className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      { title: 'Profile photo updated', meta: 'Just now' },
                      { title: 'Account details reviewed', meta: 'Today' },
                      { title: 'Profile status refreshed', meta: 'Yesterday' },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm dark:border-gray-800 dark:bg-gray-800/50">
                        <span className="font-medium text-gray-700 dark:text-gray-200">{item.title}</span>
                        <span className="text-gray-400">{item.meta}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[20px] border border-gray-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">আপনার তথ্য আপডেট করুন (সকল তথ্য ঐচ্ছিক)</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">যেসব তথ্য পূরণ বা পরিবর্তন করতে চান তা টাইপ করে নিচে সংরক্ষণ করুন</p>
                </div>
                <span className="rounded-full bg-bd-green-50 px-3 py-1 text-xs font-semibold text-bd-green-700 dark:bg-bd-green-900/30 dark:text-bd-green-300">
                  ঐচ্ছিক ফিল্ডস
                </span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">পূর্ণ নাম</label>
                  <input className="input mt-1.5" placeholder="যেমন: মোঃ রফিকুল ইসলাম" {...register('name', { required: 'নাম আবশ্যক' })} />
                  {errors.name && <p className="mt-1 text-xs text-bd-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">উপজেলা (ঐচ্ছিক)</label>
                  <select className="input mt-1.5" {...register('upazila')}>
                    {UPAZILA_OPTIONS.map((u) => <option key={u} value={u ?? ''}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">বিভাগ (Department - ঐচ্ছিক)</label>
                  <input className="input mt-1.5" placeholder="যেমন: পদার্থবিজ্ঞান / সিএসই" {...register('department')} />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">সেশন (Session - ঐচ্ছিক)</label>
                  <input className="input mt-1.5" placeholder="যেমন: 2022-23 বা 2020-21" {...register('studentSession')} />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">রক্তের গ্রুপ (Blood Group - ঐচ্ছিক)</label>
                  <select className="input mt-1.5" {...register('bloodGroup')}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="O-">O-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ফোন নম্বর (Phone Number - ঐচ্ছিক)</label>
                  <input className="input mt-1.5" placeholder="যেমন: 01711000000" {...register('phone')} />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ইমেইল ঠিকানা (Email - ঐচ্ছিক)</label>
                  <input type="email" className="input mt-1.5" placeholder="email@example.com" {...register('email')} />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">হল / বাসস্থান (Hall - ঐচ্ছিক)</label>
                  <input className="input mt-1.5" placeholder="যেমন: শহীদ জিয়াউর রহমান হল" {...register('hall')} />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">পদবি (Position - ঐচ্ছিক)</label>
                  <input className="input mt-1.5" placeholder="যেমন: শিক্ষার্থী, সভাপতি, সহকারী অধ্যাপক" {...register('position')} />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">সংক্ষিপ্ত পরিচিতি (Bio - ঐচ্ছিক)</label>
                  <textarea className="input mt-1.5 h-20" placeholder="আপনার নিজের সম্পর্কে লিখুন..." {...register('bio')} />
                </div>

                <div className="md:col-span-2 flex gap-3 pt-2">
                  <button type="submit" className="btn-primary"><Save className="h-4 w-4" /> প্রোফাইল সংরক্ষণ করুন</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </FadeIn>

      {cropModalOpen && cropImageData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[24px] border border-white/20 bg-white p-4 shadow-2xl dark:bg-gray-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Crop your profile photo</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Zoom, drag and rotate before upload</p>
              </div>
              <button type="button" onClick={closeCropper} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[20px] border border-gray-200/70 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                <div className="relative mx-auto flex h-[320px] w-[320px] items-center justify-center overflow-hidden rounded-full border border-gray-300/70 bg-white shadow-inner dark:border-gray-700 dark:bg-gray-900 sm:h-[360px] sm:w-[360px]">
                  <div
                    className="absolute inset-0 cursor-grab rounded-full"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  />
                  <img
                    src={cropImageData}
                    alt="Crop preview"
                    className="pointer-events-none max-h-[360px] max-w-[360px] object-contain"
                    style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: 'center center' }}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-[20px] border border-gray-200/70 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Zoom</label>
                  <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full accent-bd-green-600" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Rotate</label>
                  <input type="range" min="-180" max="180" step="1" value={rotation} onChange={(event) => setRotation(Number(event.target.value))} className="mt-2 w-full accent-bd-green-600" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRotation((value) => value - 90)} className="flex-1 rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200">Rotate Left</button>
                  <button type="button" onClick={() => setRotation((value) => value + 90)} className="flex-1 rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200">Rotate Right</button>
                </div>
                <div className="rounded-2xl border border-dashed border-bd-green-200 bg-bd-green-50 p-3 text-sm text-bd-green-700 dark:border-bd-green-800 dark:bg-bd-green-900/20 dark:text-bd-green-300">
                  • Up to 10MB upload size<br />
                  • Auto-resized to 1024×1024<br />
                  • Quality set to 85%
                </div>
                {uploading ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span>Uploading your profile photo</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-bd-green-600 to-emerald-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={handleApplyCrop} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-bd-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-bd-green-700">
                    <Camera className="h-4 w-4" /> Apply and Upload
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
