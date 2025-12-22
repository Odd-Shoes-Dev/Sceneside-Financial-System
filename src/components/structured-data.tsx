export default function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'Sceneside L.L.C',
    description: 'Premium hotels, car rentals, and tours across the United States',
    url: 'https://sceneside.com',
    logo: 'https://sceneside.com/Sceneside%20assets/logo.png',
    telephone: '+1-857-384-2899',
    email: 'info@sceneside.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '121 Bedford Street',
      addressLocality: 'Waltham',
      addressRegion: 'MA',
      postalCode: '02453',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '42.3756',
      longitude: '-71.2356',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '16:00',
      },
    ],
    sameAs: [
      // Add social media URLs here when available
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  );
}
