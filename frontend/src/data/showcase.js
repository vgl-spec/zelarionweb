// The interface wall shown in the hero and in `CapabilityWall`. Kaibo PH OPC leads
// because it is the one live client build; the rest are interface studies from the
// studio's own library, included so the wall reads as a range of work rather than a
// single card floating on its own.
//
// These carry no visible caption on purpose (see `ShowcaseCard`) — the wall is atmosphere,
// and the portfolio card on `/work` is where a screen is named and attributed. `alt` is
// still written per image, since a screen reader has no other way to know what is there.
import { PROJECTS } from './projects';

const [KAIBO_PH_OPC] = PROJECTS;

export const SHOWCASE_SCREENS = [
  {
    id: 'kaibo-landing',
    src: KAIBO_PH_OPC.preview,
    alt: `${KAIBO_PH_OPC.name} landing page`,
  },
  { id: 'hero-1', src: '/assets/showcase/hero1.webp', alt: 'Dark product landing page with a faceted 3D graphic' },
  { id: 'dashboard-1', src: '/assets/showcase/dashboard1.webp', alt: 'Project management dashboard with analytics and a task list' },
  { id: 'hero-2', src: '/assets/showcase/hero2.webp', alt: 'Marketing landing page interface' },
  { id: 'dashboard-2', src: '/assets/showcase/dashboard2.webp', alt: 'Workspace dashboard with charts, reminders and progress rings' },
  { id: 'hero-3', src: '/assets/showcase/hero3.webp', alt: 'Editorial landing page interface' },
  { id: 'dashboard-3', src: '/assets/showcase/dashboard3.webp', alt: 'Reporting dashboard with data cards and a chart panel' },
  { id: 'hero-4', src: '/assets/showcase/hero4.webp', alt: 'Sports analytics landing page with live performance readouts' },
  { id: 'dashboard-4', src: '/assets/showcase/dashboard4.webp', alt: 'Operations dashboard with metrics and a team panel' },
  { id: 'hero-5', src: '/assets/showcase/hero5.webp', alt: 'Product landing page with a large headline and call to action' },
  { id: 'hero-6', src: '/assets/showcase/hero6.webp', alt: 'Portfolio landing page with oversized display type over a portrait' },
];
