import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PDF_SETTINGS, mergePdfSettings } from '@/lib/pdf/pdf-settings';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('company_settings')
      .select('pdf_settings')
      .single();

    if (error) {
      return NextResponse.json(DEFAULT_PDF_SETTINGS);
    }

    return NextResponse.json(mergePdfSettings(data?.pdf_settings));
  } catch {
    return NextResponse.json(DEFAULT_PDF_SETTINGS);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const merged = mergePdfSettings(body);

    const { data: existing } = await supabase
      .from('company_settings')
      .select('id')
      .single();

    const { error } = await supabase
      .from('company_settings')
      .upsert({
        id: existing?.id,
        pdf_settings: merged,
        updated_at: new Date().toISOString(),
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json(merged);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
