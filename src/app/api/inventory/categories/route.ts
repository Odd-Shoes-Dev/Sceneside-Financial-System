import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Try to find existing category
    let { data: category, error: findError } = await supabase
      .from('product_categories')
      .select('id, name')
      .ilike('name', name)
      .single();

    // If category doesn't exist, create it
    if (findError || !category) {
      const { data: newCategory, error: createError } = await supabase
        .from('product_categories')
        .insert({
          name: name,
          description: null,
          is_active: true,
        })
        .select('id, name')
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      category = newCategory;
    }

    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
