import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Linkedin, Droplet, GraduationCap } from 'lucide-react';
import type { MemberProfile } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface MemberCardProps {
  member: MemberProfile;
  to?: string;
  onClick?: () => void;
}

export function MemberCard({ member, to, onClick }: MemberCardProps) {
  const link = to ?? `/members/${member.id}`;
  const content = (
    <div
      onClick={onClick}
      className="card overflow-hidden group h-full flex flex-col hover:shadow-glass cursor-pointer transition-all"
    >
      {/* Photo */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={member.photo}
          alt={member.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {member.bloodGroup && (
          <div className="absolute top-3 right-3">
            <Badge variant="red"><Droplet className="h-3 w-3" /> {member.bloodGroup}</Badge>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-semibold text-base leading-tight line-clamp-1">{member.name}</h3>
          <p className="text-xs text-white/85 flex items-center gap-1 mt-0.5">
            <GraduationCap className="h-3 w-3" /> {member.department}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 flex-1">
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-bd-green-600 shrink-0" />
            <span className="truncate">{member.upazila}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <span className="font-medium text-gray-400">সেশন:</span> {member.session}
          </p>
          <p className="flex items-center gap-1.5">
            <span className="font-medium text-gray-400">হল:</span> <span className="truncate">{member.hall}</span>
          </p>
        </div>

        {/* Socials */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
          {member.facebook && (
            <a
              href={member.facebook}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100 dark:bg-gray-800 text-bd-green-700 dark:text-bd-green-300 hover:bg-bd-green-600 hover:text-white transition"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
          )}
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100 dark:bg-gray-800 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          )}
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-bd-green-600 hover:text-white transition ml-auto"
              aria-label="Phone"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              onClick={(e) => e.stopPropagation()}
              className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-bd-green-600 hover:text-white transition"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  if (onClick) return content;
  return <Link to={link}>{content}</Link>;
}

export function MemberCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-44 w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  );
}
