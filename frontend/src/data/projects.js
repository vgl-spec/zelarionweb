// The portfolio. Every project card and the homepage hero wall read from this list, and each
// `preview` is a captured landing page, so the site never presents an outdated screen as
// current work. Screenshots are 8:5 (1400x875) to fill the card without cropping.
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
];
