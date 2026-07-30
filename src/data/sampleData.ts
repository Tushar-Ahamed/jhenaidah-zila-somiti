import type {
  Notice,
  OrgEvent,
  Member,
  Upazila,
  GalleryItem,
  Activity,
} from '@/types';

export const ORG_INFO = {
  name: 'ঝিনাইদহ জেলা সমিতি',
  fullName: 'ঝিনাইদহ জেলা সমিতি, রাজশাহী বিশ্ববিদ্যালয়',
  tagline: 'ঐক্য, সংহতি ও উন্নয়নের ঠিকানা',
  established: 2012,
  university: 'রাজশাহী বিশ্ববিদ্যালয়',
  address: 'রাজশাহী বিশ্ববিদ্যালয় ক্যাম্পাস, রাজশাহী-৬২০৫',
  email: 'jhenaidahsamiti.ru@gmail.com',
  phone: '+৮৮ ০১৭xx-xxxxxx',
  facebook: 'https://facebook.com',
  about:
    'ঝিনাইদহ জেলা সমিতি, রাজশাহী বিশ্ববিদ্যালয় খানখাবাদ একটি আপস সংগঠন। এখানে রাজশাহী বিশ্ববিদ্যালয়ে অধ্যয়নরত ঝিনাইদহ জেলার শিক্ষার্থীরা একত্রিত হয়ে নিজেদের সাংস্কৃতিক, সামাজিক ও শৈক্ষ�িক বিকাশে কাজ করে। আমরা বিশ্বাস করি, একসাথে থাকলে দূরত্ব কমে, ভালোবাসা বাড়ে এবং স্বপ্ন পূরণ সহজ হয়।',
  mission:
    'ঝিনাইদহের শিক্ষার্থীদের মাঝে সংহতি গড়ে তোলা, তাদের শিক্ষা ও ক্যারিয়ারে পারস্পরিক সহযোগিতা নিশ্চিত করা এবং জেলার উন্নয়নে অবদান রাখা।',
  vision:
    'একটি আত্মনির্ভরশীল, সচেতন ও প্রগতিশীল শিক্ষার্থী সমাজ গড়ে তোলা, যারা দেশ ও জেলার উন্নয়নে নেতৃত্ব দাবি করবে।',
};

export const STATS = [
  { label: 'সদস্য সংখ্যা', value: 0, suffix: '' },
  { label: 'উপজেলা শাখা', value: 6, suffix: '' },
  { label: 'আয়োজিত অনুষ্ঠান', value: 0, suffix: '' },
  { label: 'বছর অতিবাহিত', value: 14, suffix: '' },
];

export const NOTICES: Notice[] = [
  {
    id: 'n1',
    title: 'বার্ষিক সাধারণ সভার নোটিশ',
    body: 'আগামী ১৫ আগস্ট শুক্রবার সকাল ১০টায় টিটিসি মিলনায়তনে আমাদের বার্ষিক সাধারণ সভা অনুষ্ঠিত হবে। সকল সদস্যের উপস্থিতি কাম্য।',
    category: 'জরুরি',
    date: '2026-07-20',
    pinned: true,
  },
  {
    id: 'n2',
    title: 'শবে-বরাত উপলক্ষে দোয়া মাহফিল',
    body: 'আগামী রাত ৯টায় ক্যাম্পাস মসজিদ প্রাঙ্গণে শবে-বরাত উপলক্ষে দোয়া ও আলোচনা সভা অনুষ্ঠিত হবে।',
    category: 'অনুষ্ঠান',
    date: '2026-07-18',
  },
  {
    id: 'n3',
    title: 'নতুন কমিটি গঠন: আগ্রহী সদস্যদের আহ্বান',
    body: '২০২৬-২০২৭ মেয়াদের জন্য নতুন আহ্বায়ক কমিটি গঠন করা হবে। আগ্রহী সদস্যগণ ৫ আগস্টের মধ্যে আবেদন জমা দিন।',
    category: 'নির্বাচন',
    date: '2026-07-15',
  },
  {
    id: 'n4',
    title: 'রক্তদান কর্মসূচি',
    body: 'আগামী ২ আগস্ট শনিবার রাজশাহী মেডিকেল কলেজ হাসপাতালে সমিতির উদ্যোগে স্বেচ্ছায় রক্তদান কর্মসূচি।',
    category: 'সাধারণ',
    date: '2026-07-10',
  },
  {
    id: 'n5',
    title: 'বৃত্তি বিতরণ অনুষ্ঠান',
    body: 'গত বছরের এইচএসসিতে উত্তীর্ণ মেধাবী শিক্ষার্থীদের মাঝে বৃত্তি ও সংবর্ধনা প্রদান অনুষ্ঠান ২০ আগস্ট।',
    category: 'অনুষ্ঠান',
    date: '2026-07-05',
  },
];

export const EVENTS: OrgEvent[] = [
  {
    id: 'e1',
    title: 'বর্ষবরণ ও সাংস্কৃতিক অনুষ্ঠান',
    description: 'নববর্ষ উপলক্ষে আয়োজন — সঙ্গীত, আবৃত্তি ও নাট্যাঙ্ক। সকল সদস্য ও অতিথিরা আমন্ত্রিত।',
    date: '2026-08-14',
    location: 'শহীদ মিনার চত্বর, রাজশাহী বিশ্ববিদ্যালয়',
    coverImage: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=900',
    status: 'upcoming',
  },
  {
    id: 'e2',
    title: 'শিক্ষা সফর: পাহাড়পুর বিহার',
    description: 'নওগাঁ জেলার পাহাড়পুর বৌদ্ধ বিহারে একদিনের শিক্ষা সফর। নাম তালিকাভুক্তির শেষ তারিখ ১০ আগস্ট।',
    date: '2026-08-25',
    location: 'পাহাড়পুর, নওগাঁ',
    coverImage: 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=900',
    status: 'upcoming',
  },
  {
    id: 'e3',
    title: 'আলোচনা সভা: উচ্চশিক্ষায় সম্ভাবনা',
    description: 'বিশিষ্ট শিক্ষাবিদদের সাথে উচ্চশিক্ষা ও ক্যারিয়ার বিষয়ক আলোচনা সভা।',
    date: '2026-09-05',
    location: 'অর্থনীতি বিভাগ সেমিনার কক্ষ',
    coverImage: 'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg?auto=compress&cs=tinysrgb&w=900',
    status: 'upcoming',
  },
];

export const COMMITTEE: Member[] = [
  { id: 'm1', name: 'মোঃ রফিকুল ইসলাম', designation: 'আহ্বায়ক', organization: 'ইতিহাস বিভাগ, ২০২০-২১', phone: '০১৭xx-xxxxxx', email: 'rafiqul@ru.ac.bd', order: 1 },
  { id: 'm2', name: 'সুমাইয়া আক্তার', designation: 'সভাপতি', organization: 'বাংলা বিভাগ, ২০১৯-২০', phone: '০১৬xx-xxxxxx', email: 'sumaiya@ru.ac.bd', order: 2 },
  { id: 'm3', name: 'আব্দুল্লাহ আল মামুন', designation: 'সাধারণ সম্পাদক', organization: 'রাষ্ট্রবিজ্ঞান বিভাগ, ২০২০-২১', phone: '০১৫xx-xxxxxx', email: 'mamun@ru.ac.bd', order: 3 },
  { id: 'm4', name: 'তানিয়া সুলতানা', designation: 'সহ-সভাপতি', organization: 'সমাজবিজ্ঞান বিভাগ, ২০২০-২১', phone: '০১৮xx-xxxxxx', email: 'tania@ru.ac.bd', order: 4 },
  { id: 'm5', name: 'ইমরান হোসেন', designation: 'যুগ্ম-সাধারণ সম্পাদক', organization: 'ফিন্যান্স বিভাগ, ২০২১-২২', phone: '০১৭xx-xxxxxx', email: 'imran@ru.ac.bd', order: 5 },
  { id: 'm6', name: 'নুসরাত জাহান', designation: 'কোষাধ্যক্ষ', organization: 'গণিত বিভাগ, ২০২০-২১', phone: '০১৬xx-xxxxxx', email: 'nusrat@ru.ac.bd', order: 6 },
  { id: 'm7', name: 'সাব্বির আহমেদ', designation: 'প্রচার সম্পাদক', organization: 'ইংরেজি বিভাগ, ২০২১-২২', phone: '০১৫xx-xxxxxx', email: 'sabbir@ru.ac.bd', order: 7 },
  { id: 'm8', name: 'ফারজানা ইয়াসমিন', designation: 'সাংস্কৃতিক সম্পাদক', organization: 'দর্শন বিভাগ, ২০২০-২১', phone: '০১৮xx-xxxxxx', email: 'farzana@ru.ac.bd', order: 8 },
];

export const UPAZILAS: Upazila[] = [
  {
    id: 'u1',
    name: 'ঝিনাইদহ সদর',
    description: 'জেলার সদর উপজেলা ও প্রশাসনিক কেন্দ্র। সমিতির সবচেয়ে বড় শাখা এখান থেকেই পরিচালিত।',
    president: 'মোঃ রফিকুল ইসলাম',
    secretary: 'আব্দুল্লাহ আল মামুন',
    memberCount: 120,
    highlights: ['বার্ষিক সাংস্কৃতিক অনুষ্ঠান', 'বৃত্তি কর্মসূচি', 'রক্তদান শিবির'],
  },
  {
    id: 'u2',
    name: 'কালীগঞ্জ',
    description: 'ঐতিহাসিক কালীগঞ্জ উপজেলা — শিক্ষা ও সংস্কৃতির একটি গুরুত্বপূর্ণ কেন্দ্র।',
    president: 'সাব্বির আহমেদ',
    secretary: 'তানিয়া সুলতানা',
    memberCount: 68,
    highlights: ['বই বিতরণ', 'শিক্ষা সফর'],
  },
  {
    id: 'u3',
    name: 'কোটচাঁদপুর',
    description: 'কোটচাঁদপুর শাখা — ছাত্র-ছাত্রীদের মেধা বিকাশে অগ্রণী ভূমিকা পালন করছে।',
    president: 'ইমরান হোসেন',
    secretary: 'নুসরাত জাহান',
    memberCount: 54,
    highlights: ['বিজ্ঞান মেলা', 'আলোচনা সভা'],
  },
  {
    id: 'u4',
    name: 'মহেশপুর',
    description: 'মহেশপুর শাখা — স্বেচ্ছাশ্রম ও সমাজসেবায় অগ্রণী।',
    president: 'ফারজানা ইয়াসমিন',
    secretary: 'সুমাইয়া আক্তার',
    memberCount: 42,
    highlights: ['শীতবস্ত্র বিতরণ', 'চিকিৎসা ক্যাম্প'],
  },
  {
    id: 'u5',
    name: 'শৈলকূপা',
    description: 'শৈলকূপা শাখা — সাংস্কৃতিক চর্চা ও ক্রীড়ায় অগ্রগামী।',
    president: 'মোঃ রফিকুল ইসলাম',
    secretary: 'আব্দুল্লাহ আল মামুন',
    memberCount: 38,
    highlights: ['ফুটবল টুর্নামেন্ট', 'আবৃত্তি প্রতিযোগিতা'],
  },
  {
    id: 'u6',
    name: 'হরিণাকুণ্ডু',
    description: 'হরিণাকুণ্ডু শাখা — নবাগত শিক্ষার্থীদের জন্য সহায়ক ভূমিকা পালন করে।',
    president: 'তানিয়া সুলতানা',
    secretary: 'ইমরান হোসেন',
    memberCount: 20,
    highlights: ['ভর্তি পরামর্শ', 'অভিভাবক সমাবেশ'],
  },
];

export const GALLERY: GalleryItem[] = [
  { id: 'g1', title: 'বর্ষবরণ অনুষ্ঠান ২০২৫', url: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'অনুষ্ঠান', date: '2025-04-14' },
  { id: 'g2', title: 'রক্তদান শিবির', url: 'https://images.pexels.com/photos/3992866/pexels-photo-3992866.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'সমাজসেবা', date: '2025-06-02' },
  { id: 'g3', title: 'শিক্ষা সফর', url: 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'শিক্ষা সফর', date: '2025-03-10' },
  { id: 'g4', title: 'আলোচনা সভা', url: 'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'আলোচনা', date: '2025-02-18' },
  { id: 'g5', title: 'বৃত্তি বিতরণ', url: 'https://images.pexels.com/photos/2566581/pexels-photo-2566581.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'শিক্ষা', date: '2025-01-25' },
  { id: 'g6', title: 'সাংস্কৃতিক পরিবেশনা', url: 'https://images.pexels.com/photos/1387174/pexels-photo-1387174.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'সংস্কৃতি', date: '2024-12-31' },
  { id: 'g7', title: 'ক্রীড়া প্রতিযোগিতা', url: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'ক্রীড়া', date: '2024-11-15' },
  { id: 'g8', title: 'বই বিতরণ', url: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=800', category: 'শিক্ষা', date: '2024-09-20' },
];

export const ACTIVITIES: Activity[] = [
  { id: 'a1', title: 'শীতবস্ত্র বিতরণ', description: 'হারিয়ে যাওয়া পরিবারের মাঝে ২০০+ শীতবস্ত্র বিতরণ।', date: '2026-01-12', icon: 'heart' },
  { id: 'a2', title: 'বৃক্ষরোপণ কর্মসূচি', description: 'ক্যাম্পাসে ১৫০টি চারা রোপণ ও সচেতনতা সৃষ্টি।', date: '2026-06-05', icon: 'tree' },
  { id: 'a3', title: 'নবাগত শিক্ষার্থীদের অভ্যর্থনা', description: 'নতুন ভর্তিকৃত শিক্ষার্থীদের জন্য অভ্যর্থনা ও পরিচয় মেলা।', date: '2026-07-01', icon: 'users' },
  { id: 'a4', title: 'মুক্ত চিকিৎসা ক্যাম্প', description: 'ঝিনাইদহ সদর হাসপাতালে দিনব্যাপী মুক্ত চিকিৎসা সেবা।', date: '2026-05-20', icon: 'cross' },
];

export const NAV_LINKS = [
  { to: '/', label: 'হোম' },
  { to: '/about', label: 'পরিচিতি' },
  { to: '/committee', label: 'জেলা কমিটি' },
  { to: '/upazilas', label: 'উপজেলা' },
  { to: '/members', label: 'সদস্য' },
  { to: '/gallery', label: 'গ্যালারি' },
  { to: '/events', label: 'আয়োজন' },
  { to: '/notices', label: 'নোটিশ' },
  { to: '/contact', label: 'যোগাযোগ' },
];
