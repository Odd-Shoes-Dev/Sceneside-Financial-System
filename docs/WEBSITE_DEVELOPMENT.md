# Sceneside Tourism Website - Development Guide

## Overview
This project now includes a CMS-powered tourism website for Sceneside L.L.C, allowing the company to showcase their hotels, car hire services, and tour packages.

## Architecture

### Phase 1: Database & Admin Panel ✅ COMPLETED
- **Database Schema**: Created comprehensive tables for website content
  - `website_hotels` - Hotel listings
  - `website_cars` - Vehicle fleet
  - `website_tours` - Tour packages
  - `website_content` - General website content (hero, about, etc.)
  - `website_testimonials` - Customer reviews
  - `website_gallery` - Photo library
  - `website_inquiries` - Booking/contact forms

- **Admin Panel**: Added "Website" section to dashboard
  - Dashboard navigation updated with "Website" link
  - Main website management page created at `/dashboard/website`
  - API endpoint for stats created

### Phase 2: Admin CRUD Pages (IN PROGRESS)
Next steps to complete the admin panel:

1. **Hotels Management**
   - `/dashboard/website/hotels` - List all hotels
   - `/dashboard/website/hotels/new` - Add new hotel
   - `/dashboard/website/hotels/[id]/edit` - Edit hotel
   - Image upload for hotel photos

2. **Cars Management**
   - `/dashboard/website/cars` - List all vehicles
   - `/dashboard/website/cars/new` - Add new vehicle
   - `/dashboard/website/cars/[id]/edit` - Edit vehicle

3. **Tours Management**
   - `/dashboard/website/tours` - List all tours
   - `/dashboard/website/tours/new` - Add new tour
   - `/dashboard/website/tours/[id]/edit` - Edit tour

4. **Content Management**
   - `/dashboard/website/content` - Edit homepage hero, about us, etc.

5. **Gallery Management**
   - `/dashboard/website/gallery` - Manage photo library

6. **Testimonials Management**
   - `/dashboard/website/testimonials` - Manage customer reviews

7. **Inquiries Management**
   - `/dashboard/website/inquiries` - View and manage booking requests

### Phase 3: Public Website (PENDING)
Create separate Next.js app in `/website` folder:

1. **Homepage**
   - Hero section with call-to-action
   - Featured hotels, cars, tours
   - Testimonials
   - Search/booking form

2. **Hotels Page**
   - List all hotels
   - Filter by location, price, amenities
   - Individual hotel detail pages

3. **Car Hire Page**
   - Vehicle catalog
   - Filter by category, price
   - Individual vehicle details

4. **Tours Page**
   - Tour packages list
   - Filter by destination, duration
   - Individual tour details

5. **Contact Page**
   - Contact form
   - Company information
   - Google Maps integration

6. **About Page**
   - Company story
   - Team
   - Values

## Database Migration

To apply the database schema:

1. Run the migration in Supabase Dashboard:
   ```sql
   -- Copy contents from: supabase/migrations/020_create_website_tables.sql
   ```

2. Or use Supabase CLI:
   ```bash
   supabase db push
   ```

## File Structure

```
src/
├── app/
│   ├── dashboard/
│   │   └── website/          # Admin panel for website management
│   │       ├── page.tsx      # Main website dashboard
│   │       ├── hotels/       # Hotels CRUD (to be created)
│   │       ├── cars/         # Cars CRUD (to be created)
│   │       ├── tours/        # Tours CRUD (to be created)
│   │       ├── content/      # Content management (to be created)
│   │       ├── gallery/      # Gallery management (to be created)
│   │       ├── testimonials/ # Testimonials CRUD (to be created)
│   │       └── inquiries/    # Inquiries management (to be created)
│   └── api/
│       └── website/
│           └── stats/        # Website stats API
│               └── route.ts
└── website/                   # Public website (to be created)
    ├── package.json
    ├── next.config.js
    └── src/
        └── app/
            ├── page.tsx      # Homepage
            ├── hotels/       # Hotels pages
            ├── cars/         # Car hire pages
            ├── tours/        # Tours pages
            ├── about/        # About page
            └── contact/      # Contact page
```

## Next Steps

### Immediate (Phase 2)
1. Create Hotels CRUD pages
2. Create Cars CRUD pages
3. Create Tours CRUD pages
4. Implement image upload functionality
5. Create Content management page
6. Create Gallery management
7. Create Testimonials CRUD
8. Create Inquiries dashboard

### After Admin Panel Complete (Phase 3)
1. Set up `/website` folder as separate Next.js app
2. Build public website pages
3. Connect to Supabase database
4. Implement booking/inquiry forms
5. Add SEO optimization
6. Deploy public website to Vercel

## Deployment

### Financial System (Current)
- Already deployed on Vercel
- Points to root directory

### Public Website (Future)
- Deploy separately on Vercel
- Point to `/website` directory
- Configure custom domain or subdomain

## Environment Variables

Add to `.env.local`:
```env
# Public website URL (for admin panel links)
NEXT_PUBLIC_WEBSITE_URL=https://your-website-url.com
```

## Design System

The website will use the established Sceneside brand:
- **Primary Color**: Navy (#1e3a5f)
- **Secondary Colors**: From the existing color palette
- **Logo**: Sceneside_logo.png
- **Typography**: Inter font family
- **Style**: Clean, modern, professional

## Content Guidelines

When adding content through the admin panel:
- **Images**: High-quality photos (minimum 1920x1080 for heroes)
- **Descriptions**: Clear, compelling copy
- **SEO**: Include relevant keywords naturally
- **Accessibility**: Add alt text to all images

## Support

For questions or assistance:
- Check migration file: `supabase/migrations/020_create_website_tables.sql`
- Review admin panel: `/dashboard/website`
- Database schema includes RLS policies for security

---

**Status**: Phase 1 Complete ✅ | Phase 2 In Progress 🚧 | Phase 3 Pending ⏳
