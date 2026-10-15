// The portfolio. Every project card and the homepage hero wall read from this list, and each
// `preview` is a captured landing page, so the site never presents an outdated screen as
// current work. Screenshots are 8:5 (1400x875) to fill the card without cropping.
//
// Norvane Cold Systems is a fictional company that Zelarion made as a concept project. It is
// labelled as one on the card and on the site itself, and it must stay labelled that way.
export const PROJECTS = [
  {
    id: 'denz-motor-shop',
    name: 'Denz Motor Shop',
    domain: 'denz-motorshop.vercel.app',
    sector: 'Parts catalogue',
    summary:
      'An online catalogue for a Quezon City motorcycle parts counter that sells Honda and Yamaha parts. Customers check live stock and prices across eleven categories, see repair rates, and keep service history and maintenance reminders in My Garage, then pay and pick up in store.',
    preview: '/assets/showcase/denz-landing.webp',
  },
  {
    id: 'villa-crisanta',
    name: 'Villa Crisanta',
    domain: 'villa-crisanta.com',
    sector: 'Resort website',
    summary:
      'A website for a spring resort in Laguna with two villas. Each villa has its own page and starting rate, alongside dining and other signature experiences, with a Reserve button on every page to start a booking.',
    preview: '/assets/showcase/villa-landing.webp',
  },
  {
    id: 'norvane-cold-systems',
    name: 'Norvane Cold Systems',
    domain: 'norvane-lyart.vercel.app',
    sector: 'Concept project',
    summary:
      'A concept website for a fictional commercial-refrigeration company, built to show how we approach a multi-page B2B site: an animated 3D hero, industry pages, an equipment catalogue and a service-focused contact page. The company, its partners and its clients are invented.',
    preview: '/assets/showcase/norvane-landing.webp',
  },
];
