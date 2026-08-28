import React from 'react';
import { Mail } from 'lucide-react';
import Reveal, { Eyebrow } from '../components/Reveal';
import ExpandableProfileCard from './ExpandableProfileCard';
import { cn } from '../lib/utils';

// Deterministic per-name gradient so avatars aren't visually identical, but
// consistent across renders (no Math.random / no re-shuffle on re-render).
const AVATAR_GRADIENTS = [
  'from-aurora-teal to-aurora-cyan',
  'from-aurora-cyan to-aurora-indigo',
  'from-aurora-indigo to-aurora-teal',
  'from-aurora-teal via-aurora-cyan to-aurora-indigo',
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Initials-based avatar tile, generated entirely in CSS/SVG -- no third-party
// image host (Unsplash/pravatar/gravatar) at runtime, so the site has no
// external image dependency for placeholder team photos.
function InitialsAvatar({ name, seed }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const gradient = AVATAR_GRADIENTS[hashString(seed) % AVATAR_GRADIENTS.length];

  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br font-display text-base font-bold text-ink',
        gradient
      )}
    >
      {initials}
    </span>
  );
}

// Portrait tile for the two roles with a real photograph on file. Sized 480px for a
// 56px slot so it stays crisp at 3x; lazy + explicit dimensions so it never shifts
// layout while loading.
function PhotoAvatar({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      width="56"
      height="56"
      loading="lazy"
      decoding="async"
      className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-line"
    />
  );
}

// Names and photographs are pending. The bios describe each ROLE's remit --
// which is a fact of the role, not a claim about a person -- so the page reads
// as finished rather than as unshipped scaffolding, while inventing nothing
// about anyone. Swap `name` and `bio` when the team is announced. Roles are
// exact strings by spec.
const TEAM_MEMBERS = [
  {
    role: 'CEO',
    name: 'To be announced',
    photo: '/assets/founder-vergel.webp',
    bio: 'Owns the studio’s direction and its client relationships — who Zelarion takes on, what gets committed to, and that the commitment holds.',
    focus: 'Vision & Strategy',
  },
  {
    role: 'CTO',
    name: 'To be announced',
    photo: '/assets/cofounder-lara.webp',
    bio: 'Owns architecture and the engineering standard every build is held to, from the first schema decision through to what runs in production.',
    focus: 'Architecture & Engineering',
  },
  {
    role: 'Senior UI/UX',
    name: 'To be announced',
    bio: 'Owns product design and the design system — how a build looks, how it behaves under a real user, and how it stays consistent as it grows.',
    focus: 'Product Design',
  },
  {
    role: 'Chief Marketing Officer (CMO)',
    name: 'To be announced',
    bio: 'Owns brand and go-to-market: how Zelarion explains what it builds, and how the work reaches the businesses that need it.',
    focus: 'Growth & Brand',
  },
];

export default function TeamSection() {
  return (
    <section id="team" className="relative border-t border-border py-24 md:py-32" data-testid="team-section">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>The people behind Zelarion</Eyebrow>
          <h2 className="mt-6 font-display text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.02] tracking-tightest text-foreground">
            Small team, full-stack range.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Roles are confirmed; the people behind them will be announced soon.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM_MEMBERS.map((member, i) => (
            <Reveal key={member.role} delay={i * 0.08} y={24}>
              <ExpandableProfileCard
                name={member.name}
                role={member.role}
                bio={member.bio}
                avatar={
                  member.photo ? (
                    <PhotoAvatar src={member.photo} alt={`Zelarion ${member.role}`} />
                  ) : (
                    <InitialsAvatar name={member.name} seed={member.role} />
                  )
                }
                stats={[
                  { label: 'Focus', value: member.focus },
                  { label: 'Based in', value: 'Philippines' },
                ]}
                socials={[{ label: 'Email Zelarion', href: 'mailto:hello@zelarion.com', icon: Mail }]}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
