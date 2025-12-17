import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get counts for each section
    const [hotels, cars, tours, inquiries, testimonials] = await Promise.all([
      supabase
        .from('website_hotels')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('website_cars')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('website_tours')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('website_inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new'),
      supabase
        .from('website_testimonials')
        .select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      hotels: hotels.count || 0,
      cars: cars.count || 0,
      tours: tours.count || 0,
      inquiries: inquiries.count || 0,
      testimonials: testimonials.count || 0,
    });
  } catch (error) {
    console.error('Error fetching website stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
