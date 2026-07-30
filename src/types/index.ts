// ===== Authentication & User Schema =====

export type UserRole =
  | 'student'
  | 'teacher'
  | 'alumni'
  | 'upazila_committee'
  | 'district_committee'
  | 'upazila_admin'
  | 'district_admin';

export type UserStatus = 'pending' | 'active' | 'suspended' | 'deleted';

export type CommitteeType = 'upazila' | 'district' | null;

export type UpazilaName =
  | 'ঝিনাইদহ সদর'
  | 'কালীগঞ্জ'
  | 'কোটচাঁদপুর'
  | 'মহেশপুর'
  | 'শৈলকূপা'
  | 'হরিণাকুণ্ডু'
  | null;

// ===== Committee Positions & Structure =====

export type CommitteePositionTitle =
  | 'President'
  | 'Senior Vice President'
  | 'Vice President'
  | 'General Secretary'
  | 'Joint Secretary'
  | 'Organizing Secretary'
  | 'Office Secretary'
  | 'Finance Secretary'
  | 'Sports Secretary'
  | 'Cultural Secretary'
  | 'Publicity Secretary'
  | 'Executive Member';

export interface CommitteePositionConfig {
  key: CommitteePositionTitle;
  bnLabel: string;
  order: number;
  category: 'leadership' | 'secretariat' | 'executive';
}

export const COMMITTEE_POSITIONS: CommitteePositionConfig[] = [
  { key: 'President', bnLabel: 'সভাপতি', order: 1, category: 'leadership' },
  { key: 'Senior Vice President', bnLabel: 'সিনিয়র সহ-সভাপতি', order: 2, category: 'leadership' },
  { key: 'Vice President', bnLabel: 'সহ-সভাপতি', order: 3, category: 'leadership' },
  { key: 'General Secretary', bnLabel: 'সাধারণ সম্পাদক', order: 4, category: 'leadership' },
  { key: 'Joint Secretary', bnLabel: 'যুগ্ম সাধারণ সম্পাদক', order: 5, category: 'secretariat' },
  { key: 'Organizing Secretary', bnLabel: 'সাংগঠনিক সম্পাদক', order: 6, category: 'secretariat' },
  { key: 'Office Secretary', bnLabel: 'দপ্তর সম্পাদক', order: 7, category: 'secretariat' },
  { key: 'Finance Secretary', bnLabel: 'অর্থ সম্পাদক', order: 8, category: 'secretariat' },
  { key: 'Sports Secretary', bnLabel: 'ক্রীড়া সম্পাদক', order: 9, category: 'secretariat' },
  { key: 'Cultural Secretary', bnLabel: 'সাংস্কৃতিক সম্পাদক', order: 10, category: 'secretariat' },
  { key: 'Publicity Secretary', bnLabel: 'প্রচার সম্পাদক', order: 11, category: 'secretariat' },
  { key: 'Executive Member', bnLabel: 'কার্যনির্বাহী সদস্য', order: 12, category: 'executive' },
];

export const COMMITTEE_SESSIONS = [
  '২০২৬-২৭',
  '২০২৫-২৬',
  '২০২৪-২৫',
  '২০২৩-২৪',
  '২০২২-২৩',
];

export interface CommitteeMemberRecord {
  id: string;
  session: string;
  scope: 'district' | 'upazila';
  upazila: UpazilaName;
  userId?: string;
  memberId?: string;
  name: string;
  photoUrl?: string;
  position: string;
  positionOrder: number;
  department: string;
  studentSession: string;
  phone?: string;
  email?: string;
  assignedBy?: string;
  createdAt: number;
}


// Full Firestore user document. Hidden fields (securityKey, committeeCode,
// approvedBy) are stored but never surfaced to the UI.
export interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  committeeType: CommitteeType;
  upazila: UpazilaName;
  position: string | null;
  photoUrl: string | null;
  status: UserStatus;
  createdAt: number;
  updatedAt: number;
  department?: string | null;
  studentSession?: string | null;
  bloodGroup?: string | null;
  phone?: string | null;
  hall?: string | null;
  bio?: string | null;
  // Hidden — never expose in UI
  securityKey?: string;
  committeeCode?: string;
  approvedBy?: string | null;
}

// Safe projection for client-side use (hidden fields stripped).
export type SafeUser = Omit<FirestoreUser, 'securityKey' | 'committeeCode' | 'approvedBy'>;

// AppUser kept for backward-compat with existing components.
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  upazila?: UpazilaName;
  position?: string | null;
  committeeType?: CommitteeType;
  department?: string | null;
  studentSession?: string | null;
  bloodGroup?: string | null;
  phone?: string | null;
  hall?: string | null;
  bio?: string | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'শিক্ষার্থী',
  teacher: 'শিক্ষক',
  alumni: 'প্রাক্তন ছাত্র',
  upazila_committee: 'উপজেলা কমিটি',
  district_committee: 'জেলা কমিটি',
  upazila_admin: 'উপজেলা প্রশাসক',
  district_admin: 'জেলা প্রশাসক',
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  pending: 'অনুমোদন বিচারাধীন',
  active: 'সক্রিয়',
  suspended: 'স্থগিত',
  deleted: 'মুছে ফেলা হয়েছে',
};

const ROLE_ALIASES: Record<string, UserRole> = {
  student: 'student',
  teacher: 'teacher',
  alumni: 'alumni',
  upazila_committee: 'upazila_committee',
  upazila_committee_member: 'upazila_committee',
  district_committee: 'district_committee',
  district_committee_member: 'district_committee',
  upazila_admin: 'upazila_admin',
  upazilaadmin: 'upazila_admin',
  district_admin: 'district_admin',
  districtadmin: 'district_admin',
  admin: 'district_admin',
  super_admin: 'district_admin',
  superadmin: 'district_admin',
  administrator: 'district_admin',
};

export function normalizeUserRole(role: unknown): UserRole {
  if (typeof role !== 'string') return 'student';
  const normalized = role.trim().toLowerCase().replace(/[-\s]+/g, '_');
  return ROLE_ALIASES[normalized] ?? 'student';
}

// Roles that may self-register.
export const SELF_REGISTER_ROLES: UserRole[] = ['student', 'teacher', 'alumni'];

// Roles that are committee/admin (cannot self-register).
export const COMMITTEE_ROLES: UserRole[] = [
  'upazila_committee',
  'district_committee',
  'upazila_admin',
  'district_admin',
];

// Admin roles.
export const ADMIN_ROLES: UserRole[] = ['upazila_admin', 'district_admin'];

export const UPAZILA_OPTIONS: UpazilaName[] = [
  'ঝিনাইদহ সদর',
  'কালীগঞ্জ',
  'কোটচাঁদপুর',
  'মহেশপুর',
  'শৈলকূপা',
  'হরিণাকুণ্ডু',
];

// ===== Content types =====

export type NoticeCategory = 'জরুরি' | 'সাধারণ' | 'অনুষ্ঠান' | 'নির্বাচন' | 'পরীক্ষা/ভর্তি' | 'বৃত্তি';

export interface Notice {
  id: string;
  title: string;
  body: string;
  category: NoticeCategory;
  date: string;
  attachmentUrl?: string;
  pinned?: boolean;
  authorId?: string;
  authorName?: string;
  scope?: 'district' | 'upazila';
  upazila?: UpazilaName;
}

export interface MemoryAlbum {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  photos: string[];
  videoUrl?: string;
  category: string;
  authorId?: string;
  authorName?: string;
  authorPhoto?: string;
  authorRole?: string;
  scope?: 'district' | 'upazila';
  upazila?: UpazilaName;
  createdAt: number;
}

export interface OrgEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  chiefGuest?: string;
  coverImage?: string;
  status: 'upcoming' | 'ongoing' | 'past';
  registrationOpen?: boolean;
  registrationFee?: number;
  photos?: string[];
  videoUrl?: string;
  participantsCount?: number;
  authorId?: string;
  scope?: 'district' | 'upazila';
  upazila?: UpazilaName;
}

export interface EventRegistrationRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  session: string;
  paymentTrx?: string;
  status: 'confirmed' | 'pending';
  createdAt: number;
}

export type MembershipPaymentStatus = 'paid' | 'pending' | 'expired';

export interface MembershipPayment {
  id: string;
  userId?: string;
  memberName: string;
  email: string;
  phone: string;
  upazila: UpazilaName;
  department: string;
  session: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Bank';
  trxId: string;
  status: MembershipPaymentStatus;
  paidDate?: string;
  expiryDate?: string;
  createdAt: number;
}

export interface Member {
  id: string;
  name: string;
  designation: string;
  organization: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  upazila?: string;
  order?: number;
}

// ===== Member Management =====

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null;

export type MemberStatus = 'pending' | 'approved' | 'rejected';

export interface MemberProfile {
  id: string;
  uid?: string;
  name: string;
  photo: string;
  department: string;
  session: string;
  hall: string;
  upazila: UpazilaName;
  phone: string;
  email: string;
  bloodGroup: BloodGroup;
  facebook?: string;
  linkedin?: string;
  bio: string;
  status: MemberStatus;
  createdAt: number;
  updatedAt: number;
}

export const DEPARTMENTS = [
  // কলা অনুষদ (Faculty of Arts)
  'দর্শন',
  'ইতিহাস',
  'ইংরেজি',
  'বাংলা',
  'ইসলামিক ইতিহাস ও সংস্কৃতি',
  'আরবি',
  'ইসলামিক স্টাডিজ',
  'নাটক',
  'সংগীত',
  'ফারসি ভাষা ও সাহিত্য',
  'সংস্কৃত',
  'উর্দু',

  // আইন অনুষদ (Faculty of Law)
  'আইন',
  'আইন ও ভূমি প্রশাসন',

  // বিজ্ঞান অনুষদ (Faculty of Science)
  'গণিত',
  'পদার্থবিজ্ঞান',
  'রসায়ন',
  'পরিসংখ্যান',
  'বায়োকেমিস্ট্রি ও মলিকুলার বায়োলজি',
  'ফার্মেসি',
  'পপুলেশন সায়েন্স অ্যান্ড হিউম্যান রিসোর্স ডেভেলপমেন্ট',
  'ফলিত গণিত',
  'শারীরিক শিক্ষা ও ক্রীড়া বিজ্ঞান',

  // ব্যবসায় প্রশাসন অনুষদ (Faculty of Business Studies)
  'হিসাববিজ্ঞান ও তথ্য ব্যবস্থা (AIS)',
  'ম্যানেজমেন্ট স্টাডিজ',
  'মার্কেটিং',
  'ফিন্যান্স',
  'ব্যাংকিং অ্যান্ড ইন্স্যুরেন্স',
  'ট্যুরিজম অ্যান্ড হসপিটালিটি ম্যানেজমেন্ট',

  // সামাজিক বিজ্ঞান অনুষদ (Faculty of Social Sciences)
  'অর্থনীতি',
  'রাষ্ট্রবিজ্ঞান',
  'সমাজকর্ম',
  'সমাজবিজ্ঞান',
  'গণযোগাযোগ ও সাংবাদিকতা',
  'ইনফরমেশন সায়েন্স অ্যান্ড লাইব্রেরি ম্যানেজমেন্ট',
  'লোক প্রশাসন',
  'নৃবিজ্ঞান',
  'ফোকলোর অ্যান্ড সোশ্যাল ডেভেলপমেন্ট স্টাডিজ',
  'আন্তর্জাতিক সম্পর্ক',

  // কৃষি অনুষদ (Faculty of Agriculture)
  'এগ্রোনমি অ্যান্ড এগ্রিকালচারাল এক্সটেনশন',
  'ক্রপ সায়েন্স অ্যান্ড টেকনোলজি',

  // প্রকৌশল অনুষদ (Faculty of Engineering)
  'অ্যাপ্লাইড কেমিস্ট্রি অ্যান্ড কেমিক্যাল ইঞ্জিনিয়ারিং',
  'কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং (CSE)',
  'ইনফরমেশন অ্যান্ড কমিউনিকেশন ইঞ্জিনিয়ারিং (ICE)',
  'মেটেরিয়ালস সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং',
  'ইলেকট্রিক্যাল অ্যান্ড ইলেকট্রনিক ইঞ্জিনিয়ারিং (EEE)',

  // চারুকলা অনুষদ (Faculty of Fine Arts)
  'চিত্রকলা, প্রাচ্যকলা ও ছাপচিত্র',
  'মৃৎশিল্প ও ভাস্কর্য',
  'গ্রাফিক ডিজাইন, কারুশিল্প ও শিল্পকলার ইতিহাস',

  // জীববিজ্ঞান ও ভূ-বিজ্ঞান অনুষদ (Faculty of Life & Earth Sciences)
  'মনোবিজ্ঞান',
  'উদ্ভিদবিজ্ঞান',
  'প্রাণীবিজ্ঞান',
  'জেনেটিক ইঞ্জিনিয়ারিং অ্যান্ড বায়োটেকনোলজি',
  'ক্লিনিক্যাল সাইকোলজি',
  'মাইক্রোবায়োলজি',
  'ভূগোল ও পরিবেশবিদ্যা',
  'ভূতত্ত্ব ও খনিবিদ্যা',

  // মৎস্য অনুষদ (Faculty of Fisheries)
  'ফিশারিজ (মৎস্য বিজ্ঞান)',

  // ভেটেরিনারি অনুষদ (Faculty of Veterinary & Animal Sciences)
  'ভেটেরিনারি অ্যান্ড অ্যানিমেল সায়েন্সেস',
];

export const SESSIONS = [
  '২০২৬-২৭',
  '২০২৫-২৬',
  '২০২৪-২৫',
  '২০২৩-২৪',
  '২০২২-২৩',
  '২০২১-২২',
  '২০২০-২১',
  '২০১৯-২০',
  '২০১৮-১৯',
  '২০১৭-১৮',
  '২০১৬-১৭',
  '২০১৫-১৬',
  '২০১৪-১৫',
  '২০১৩-১৪',
  '২০১২-১৩',
  '২০১১-১২',
  '২০১০-১১',
];

export const HALLS = [
  'শের-ই-বাংলা ফজলুল হক হল',
  'শাহ্ মখদুম হল',
  'নবাব আব্দুল লতিফ হল',
  'সৈয়দ আমীর আলী হল',
  'শহীদ শামসুজ্জোহা হল',
  'শহীদ হবিবুর রহমান হল',
  'মতিহার হল',
  'মাদার বখ্শ হল',
  'হোসেন শহীদ সোহ্রাওয়ার্দী হল',
  'শহীদ জিয়াউর রহমান হল',
  'বিজয়-২৪ হল',
  'মুন্নুজান হল',
  'রোকেয়া হল',
  'তাপসী রাবেয়া হল',
  'বেগম খালেদা জিয়া হল',
  'রহমতুন্নেসা হল',
  'জুলাই-৩৬ হল',
  'শহীদ মীর আব্দুল কাইয়ুম আন্তর্জাতিক ডরমিটরি',
];

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export interface Upazila {
  id: string;
  name: string;
  description: string;
  president: string;
  secretary: string;
  memberCount: number;
  highlights: string[];
}

export interface GalleryItem {
  id: string;
  title: string;
  url: string;
  category: string;
  date: string;
  authorId?: string;
  scope?: 'district' | 'upazila';
  upazila?: UpazilaName;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: number;
}

// ===== Audit Logs =====

export type AuditAction =
  | 'login'
  | 'logout'
  | 'register'
  | 'profile_update'
  | 'status_change'
  | 'role_change'
  | 'account_created'
  | 'account_deleted'
  | 'account_approved'
  | 'password_reset'
  | 'email_verified';


export interface AuditLog {
  id?: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: AuditAction;
  targetId?: string;
  targetEmail?: string;
  details?: string;
  createdAt: number;
}

export const POSITIONS = [
  'সভাপতি',
  'সিনিয়র সহ-সভাপতি',
  'সহ-সভাপতি',
  'সাধারণ সম্পাদক',
  'যুগ্ম সাধারণ সম্পাদক',
  'সাংগঠনিক সম্পাদক',
  'দপ্তর সম্পাদক',
  'অর্থ সম্পাদক',
  'ক্রীড়া সম্পাদক',
  'সাংস্কৃতিক সম্পাদক',
  'প্রচার সম্পাদক',
  'কার্যনির্বাহী সদস্য',
] as const;

