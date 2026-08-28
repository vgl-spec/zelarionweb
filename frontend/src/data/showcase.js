// Screens for the parallax hero at the top of the homepage. Client names come from
// `./projects` (the single source of truth for that copy) instead of being retyped here —
// only the screenshot path and which page of the site each capture shows are specific to
// this file. No metrics or claims are added beyond what `projects.js` already states.
import { PROJECTS } from './projects';

const projectById = Object.fromEntries(PROJECTS.map((project) => [project.id, project]));
const clientName = (id) => projectById[id].name;

const BASE = '/assets/showcase';

// Order interleaves clients so no two consecutive screens — including across the row
// boundary the parallax component draws every 5 items — belong to the same client. Three
// screenshots of one site back to back would read as padding; five different clients per
// row reads as a portfolio.
export const SHOWCASE_SCREENS = [
  {
    id: 'palattao-01',
    src: `${BASE}/palattao-01.webp`,
    client: clientName('palattao-law-office'),
    page: 'Home',
    alt: 'Home page of the Palattao Law Office website',
  },
  {
    id: 'kaibo-01',
    src: `${BASE}/kaibo-01.webp`,
    client: clientName('kaibo-ph-opc'),
    page: 'Home',
    alt: 'Home page of the Kaibo PH OPC website',
  },
  {
    id: 'goldenstars-01',
    src: `${BASE}/goldenstars-01.webp`,
    client: clientName('goldenstars-packaging'),
    page: 'Home',
    alt: 'Home page of the Goldenstars Packaging Resources website',
  },
  {
    id: 'nogatualliance-01',
    src: `${BASE}/nogatualliance-01.webp`,
    client: clientName('nogatu-alliance'),
    page: 'Home',
    alt: 'Home page of the NOGATU Alliance website',
  },
  {
    id: 'nogatustore-01',
    src: `${BASE}/nogatustore-01.webp`,
    client: clientName('nogatu-store'),
    page: 'Home',
    alt: 'Home page of the Nogatu Store website',
  },
  {
    id: 'yor-01',
    src: `${BASE}/yor-01.webp`,
    client: clientName('yor-international'),
    page: 'Home',
    alt: 'Home page of the Yor International website',
  },
  {
    id: 'palattao-02',
    src: `${BASE}/palattao-02.webp`,
    client: clientName('palattao-law-office'),
    page: 'Practice areas',
    alt: 'Practice areas page of the Palattao Law Office website',
  },
  {
    id: 'kaibo-02',
    src: `${BASE}/kaibo-02.webp`,
    client: clientName('kaibo-ph-opc'),
    page: 'Industries',
    alt: 'Industries page of the Kaibo PH OPC website',
  },
  {
    id: 'goldenstars-02',
    src: `${BASE}/goldenstars-02.webp`,
    client: clientName('goldenstars-packaging'),
    page: 'Products',
    alt: 'Products page of the Goldenstars Packaging Resources website',
  },
  {
    id: 'nogatualliance-02',
    src: `${BASE}/nogatualliance-02.webp`,
    client: clientName('nogatu-alliance'),
    page: 'Products',
    alt: 'Products page of the NOGATU Alliance website',
  },
  {
    id: 'nogatustore-02',
    src: `${BASE}/nogatustore-02.webp`,
    client: clientName('nogatu-store'),
    page: 'Shop',
    alt: 'Shop page of the Nogatu Store website',
  },
  {
    id: 'yor-02',
    src: `${BASE}/yor-02.webp`,
    client: clientName('yor-international'),
    page: 'Product collection',
    alt: 'Product collection page of the Yor International website',
  },
  {
    id: 'palattao-03',
    src: `${BASE}/palattao-03.webp`,
    client: clientName('palattao-law-office'),
    page: 'Litigation services',
    alt: 'Litigation services page of the Palattao Law Office website',
  },
  {
    id: 'kaibo-03',
    src: `${BASE}/kaibo-03.webp`,
    client: clientName('kaibo-ph-opc'),
    page: 'Industrial manufacturing',
    alt: 'Industrial manufacturing page of the Kaibo PH OPC website',
  },
  {
    id: 'goldenstars-03',
    src: `${BASE}/goldenstars-03.webp`,
    client: clientName('goldenstars-packaging'),
    page: 'Manufacturing process',
    alt: 'Manufacturing process page of the Goldenstars Packaging Resources website',
  },
];
