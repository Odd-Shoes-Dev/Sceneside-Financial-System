-- Website Content Management Tables
-- These tables store all content for the public tourism website

-- Hotels table
CREATE TABLE IF NOT EXISTS website_hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  location VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'United States',
  phone VARCHAR(50),
  email VARCHAR(255),
  website_url VARCHAR(500),
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  price_range VARCHAR(50), -- e.g., "$100-$200/night"
  amenities JSONB DEFAULT '[]'::jsonb, -- ["WiFi", "Pool", "Parking", etc.]
  featured_image VARCHAR(500),
  gallery_images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cars/Vehicles table
CREATE TABLE IF NOT EXISTS website_cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  category VARCHAR(100), -- e.g., "SUV", "Sedan", "Luxury", "Van"
  brand VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  seats INTEGER,
  transmission VARCHAR(50), -- "Automatic", "Manual"
  fuel_type VARCHAR(50), -- "Gasoline", "Diesel", "Electric", "Hybrid"
  daily_rate DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  mileage_limit VARCHAR(100), -- e.g., "Unlimited", "200 miles/day"
  insurance_included BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]'::jsonb, -- ["GPS", "Bluetooth", "Backup Camera", etc.]
  featured_image VARCHAR(500),
  gallery_images JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tours/Packages table
CREATE TABLE IF NOT EXISTS website_tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  destination VARCHAR(255),
  duration VARCHAR(100), -- e.g., "3 Days 2 Nights"
  duration_days INTEGER,
  price DECIMAL(10,2),
  group_size_max INTEGER,
  itinerary JSONB DEFAULT '[]'::jsonb, -- Array of daily activities
  included JSONB DEFAULT '[]'::jsonb, -- What's included in the package
  excluded JSONB DEFAULT '[]'::jsonb, -- What's not included
  requirements VARCHAR(500), -- Age limit, fitness level, etc.
  featured_image VARCHAR(500),
  gallery_images JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website general content (hero, about, contact, etc.)
CREATE TABLE IF NOT EXISTS website_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key VARCHAR(100) NOT NULL UNIQUE, -- e.g., "hero_title", "about_content", "contact_phone"
  title VARCHAR(255),
  content TEXT,
  image_url VARCHAR(500),
  cta_text VARCHAR(100), -- Call to action button text
  cta_link VARCHAR(500), -- Call to action link
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional flexible data
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials/Reviews
CREATE TABLE IF NOT EXISTS website_testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(255) NOT NULL,
  customer_title VARCHAR(255), -- e.g., "Business Traveler", "Family Vacation"
  customer_photo VARCHAR(500),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  testimonial TEXT, -- Alias for comment for backward compatibility
  service_type VARCHAR(100), -- "hotel", "car", "tour"
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery/Media library
CREATE TABLE IF NOT EXISTS website_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255),
  description TEXT,
  image_url VARCHAR(500) NOT NULL,
  category VARCHAR(100), -- "hotel", "car", "tour", "destination", "general"
  alt_text VARCHAR(255),
  tags JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking inquiries/Contact form submissions
CREATE TABLE IF NOT EXISTS website_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_type VARCHAR(50) NOT NULL, -- "booking", "contact", "quote"
  service_type VARCHAR(50), -- "hotel", "car", "tour"
  service_id UUID, -- Reference to specific hotel/car/tour
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  check_in_date DATE,
  check_out_date DATE,
  guests INTEGER,
  message TEXT,
  status VARCHAR(50) DEFAULT 'new', -- "new", "contacted", "converted", "closed"
  notes TEXT,
  assigned_to UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_website_hotels_slug;
DROP INDEX IF EXISTS idx_website_hotels_active;
DROP INDEX IF EXISTS idx_website_hotels_featured;
DROP INDEX IF EXISTS idx_website_cars_slug;
DROP INDEX IF EXISTS idx_website_cars_active;
DROP INDEX IF EXISTS idx_website_cars_category;
DROP INDEX IF EXISTS idx_website_tours_slug;
DROP INDEX IF EXISTS idx_website_tours_active;
DROP INDEX IF EXISTS idx_website_content_section_key;
DROP INDEX IF EXISTS idx_website_testimonials_active;
DROP INDEX IF EXISTS idx_website_gallery_category;
DROP INDEX IF EXISTS idx_website_inquiries_status;
DROP INDEX IF EXISTS idx_website_inquiries_created;

-- Create indexes for better performance
CREATE INDEX idx_website_hotels_slug ON website_hotels(slug);
CREATE INDEX idx_website_hotels_active ON website_hotels(is_active);
CREATE INDEX idx_website_hotels_featured ON website_hotels(is_featured);

CREATE INDEX idx_website_cars_slug ON website_cars(slug);
CREATE INDEX idx_website_cars_active ON website_cars(is_active);
CREATE INDEX idx_website_cars_category ON website_cars(category);

CREATE INDEX idx_website_tours_slug ON website_tours(slug);
CREATE INDEX idx_website_tours_active ON website_tours(is_active);

CREATE INDEX idx_website_content_section_key ON website_content(section_key);

CREATE INDEX idx_website_testimonials_active ON website_testimonials(is_active);

CREATE INDEX idx_website_gallery_category ON website_gallery(category);

CREATE INDEX idx_website_inquiries_status ON website_inquiries(status);
CREATE INDEX idx_website_inquiries_created ON website_inquiries(created_at);

-- Enable Row Level Security
ALTER TABLE website_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users (admin access)
CREATE POLICY "Authenticated users can view website hotels"
  ON website_hotels FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage website hotels"
  ON website_hotels FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view website cars"
  ON website_cars FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage website cars"
  ON website_cars FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view website tours"
  ON website_tours FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage website tours"
  ON website_tours FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view website content"
  ON website_content FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage website content"
  ON website_content FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view website testimonials"
  ON website_testimonials FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage website testimonials"
  ON website_testimonials FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view website gallery"
  ON website_gallery FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage website gallery"
  ON website_gallery FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view website inquiries"
  ON website_inquiries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage website inquiries"
  ON website_inquiries FOR ALL
  USING (auth.role() = 'authenticated');

-- Public access policies (for the public website)
CREATE POLICY "Public can view active hotels"
  ON website_hotels FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view active cars"
  ON website_cars FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view active tours"
  ON website_tours FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view active website content"
  ON website_content FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view active testimonials"
  ON website_testimonials FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view gallery"
  ON website_gallery FOR SELECT
  USING (true);

CREATE POLICY "Public can submit inquiries"
  ON website_inquiries FOR INSERT
  WITH CHECK (true);

-- Create storage bucket for website images
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-images', 'website-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload website images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their website images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their website images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view website images" ON storage.objects;

-- Storage policies
CREATE POLICY "Authenticated users can upload website images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'website-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their website images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'website-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their website images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'website-images' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view website images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'website-images');
