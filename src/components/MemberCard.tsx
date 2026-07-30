import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Linkedin, Droplet, GraduationCap, Building2 } from 'lucide-react';
import type { MemberProfile } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface MemberCardProps {
  member: MemberProfile;
  to?: string;
  onClick?: () => void;
}

const GRADIENTS = [
  'from-emerald-500 to-teal-700 text-white shadow-emerald-500/20',
  'from-blue-500 to-indigo-700 text-white shadow-blue-500/20',
  'from-purple-500 to-pink-700 text-white shadow-purple-500/20',
  'from-amber-500 to-orange-700 text-white shadow-amber-500/20',
  'from-cyan-500 to-blue-700 text-white shadow-cyan-500/20',
  'from-rose-500 to-red-700 text-white shadow-rose-500/20',
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

function getInitial(name: string): string {
  if (!name) return 'স';
  return name.trim().charAt(0).toUpperCase();
}

export function MemberCard({ member, to, onClick }: MemberCardProps) {
  const link = to ?? `/members/${member.id}`;
  const initial = getInitial(member.name);
  const gradientClass = getGradient(member.name);

  const content = (
    <div
      onClick={onClick}
      className="group bg-card hover:bg-card/90 rounded-2xl border border-border/80 p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Sleek Gradient Initial Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center font-bold text-xl shadow-lg border border-white/20 group-hover:scale-105 transition-transform duration-300`}
          >
            {initial}
          </div>
          <span
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-card rounded-full shadow-sm"
            title="অনুমোদিত সদস্য"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors text-base tracking-tight">
            {member.name}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
            <GraduationCap className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
            <span className="truncate">{member.department}</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge variant="outline" className="text-[11px] py-0.5 px-2 font-medium bg-secondary/30">
              {member.session}
            </Badge>
            {member.bloodGroup && (
              <Badge variant="secondary" className="text-[11px] py-0.5 px-2 font-medium text-rose-500 bg-rose-500/10 border-rose-500/20">
                <Droplet className="w-3 h-3 mr-0.5 inline fill-current" />
                {member.bloodGroup}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-border/60 text-xs text-muted-foreground space-y-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate font-medium">{member.upazila}</span>
        </div>
        {member.hall && (
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
            <span className="truncate">{member.hall}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 flex items-center justify-between text-xs border-t border-border/40 text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="কল করুন"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="ইমেইল করুন"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        {(member.facebookUrl || member.linkedinUrl) && (
          <div className="flex items-center gap-1">
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
    <div className="bg-card rounded-2xl border border-border/80 p-5 animate-pulse flex flex-col h-full">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
      </div>
      <div className="mt-auto pt-3 border-t border-border/60 space-y-2">
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}
