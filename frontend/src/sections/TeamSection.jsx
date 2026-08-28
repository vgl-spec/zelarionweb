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

// Real names, bios, and photos are pending -- this is intentionally
// placeholder content for four confirmed roles, wired up so the layout and
// the ExpandableProfileCard interaction are real and swap-ready once the
// team is announced. Roles are exact strings by spec; everything else here
// is a stand-in.
const TEAM_MEMBERS = [
  {
    role: 'CEO',
    name: 'TBA',
    photo: '/assets/founder-vergel.webp',
    bio: 'Placeholder bio -- CEO profile pending. Focus: vision, strategy, and client partnerships.',
    focus: 'Vision & Strategy',
  },
  {
    role: 'CTO',
    name: 'TBA',
    photo: '/assets/cofounder-lara.webp',
    bio: 'Placeholder bio -- CTO profile pending. Focus: architecture, engineering standards, and delivery.',
    focus: 'Architecture & Engineering',
  },
  {
    role: 'Senior UI/UX',
    name: 'TBA',
    bio: 'Placeholder bio -- design lead profile pending. Focus: product design and design systems.',
    focus: 'Product Design',
  },
  {
    role: 'Chief Marketing Officer (CMO)',
    name: 'TBA',
    bio: 'Placeholder bio -- CMO profile pending. Focus: brand, growth, and go-to-market.',
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
                  { label: 'Status', value: 'Bio pending' },
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
