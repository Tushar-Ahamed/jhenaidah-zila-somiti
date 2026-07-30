import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Linkedin, Droplet, GraduationCap } from 'lucide-react';
import type { MemberProfile } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface MemberCardProps {
  member: MemberProfile;
  to?: string;
  onClick?: () => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

export function MemberCard({ member, to, onClick }: MemberCardProps) {
  const link = to ?? `/members/${member.id}`;
  const displayPhoto = member.photo && member.photo.trim().length > 0 && !member.photo.startsWith('blob:')
    ? member.photo
    : DEFAULT_AVATAR;

  const content = (
    <div
      onClick={onClick}
      className="group bg-card rounded-xl border border-border p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col h-full cursor-pointer"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <img
            src={displayPhoto}
            alt={member.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 group-hover:border-primary transition-colors"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
            }}
          />
          <span
            className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full"
            title="অনুমোদিত সদস্য"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-base">
            {member.name}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
            <GraduationCap className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
            <span className="truncate">{member.department}</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge variant="outline" className="text-[11px] py-0 px-2 font-normal">
              {member.session}
            </Badge>
            {member.bloodGroup && (
              <Badge variant="secondary" className="text-[11px] py-0 px-1.5 font-normal text-rose-500 bg-rose-500/10 border-rose-500/20">
                <Droplet className="w-3 h-3 mr-0.5 inline fill-current" />
                {member.bloodGroup}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate">{member.upazila}</span>
        </div>
        {member.hall && (
          <div className="flex items-center gap-1.5">
            <span className="text-primary font-bold text-xs flex-shrink-0">হাল:</span>
            <span className="truncate">{member.hall}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 flex items-center justify-between text-xs border-t border-border/30 text-muted-foreground">
        <div className="flex items-center gap-2">
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
              title="কল করুন"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
              title="ইমেইল করুন"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        {(member.facebookUrl || member.linkedinUrl) && (
          <div className="flex items-center gap-1.5">
            {member.facebookUrl && (
              <a
                href={member.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:text-blue-500 transition-colors"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
            )}
            {member.linkedinUrl && (
              <a
                href={member.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:text-blue-400 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return content;
  }

  return <Link to={link}>{content}</Link>;
}

export function MemberCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-pulse flex flex-col h-full">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
      </div>
      <div className="mt-auto pt-3 border-t border-border/50 space-y-2">
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}
