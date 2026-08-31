// The homepage hero uses the same current Kaibo capture as the portfolio card. Client
// copy remains sourced from `projects` so both surfaces stay aligned.
import { PROJECTS } from './projects';

const [KAIBO_PH_OPC] = PROJECTS;

export const SHOWCASE_SCREENS = [
  {
    id: 'kaibo-landing',
    src: KAIBO_PH_OPC.preview,
    client: KAIBO_PH_OPC.name,
    page: 'Landing page',
    alt: 'Kaibo PH OPC landing page',
  },
];
