import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/permits - List all permits and licenses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const expiringSoon = searchParams.get('expiring_soon') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get permits from products table where inventory_category = 'permit'
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('inventory_category', 'permit')
      .order('permit_expiry_date', { ascending: true });

    if (status) {
      query = query.eq('permit_status', status);
    }

    if (expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query = query.lte('permit_expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);
      query = query.gte('permit_expiry_date', new Date().toISOString().split('T')[0]);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate permit status summaries
    const { data: allPermits } = await supabase
      .from('products')
      .select('permit_status, permit_expiry_date')
      .eq('inventory_category', 'permit');

    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const summary = {
      total: allPermits?.length || 0,
      active: allPermits?.filter(p => p.permit_status === 'active').length || 0,
      expiring_soon: allPermits?.filter(p => {
        if (!p.permit_expiry_date) return false;
        const expiry = new Date(p.permit_expiry_date);
        return expiry >= today && expiry <= thirtyDays;
      }).length || 0,
      expired: allPermits?.filter(p => p.permit_status === 'expired').length || 0,
      pending_renewal: allPermits?.filter(p => p.permit_status === 'pending_renewal').length || 0,
    };

    return NextResponse.json({
      data,
      summary,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inventory/permits - Create a new permit
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.name || !body.permit_number) {
      return NextResponse.json(
        { error: 'Missing required fields: name, permit_number' },
        { status: 400 }
      );
    }

    // Generate SKU if not provided
    const sku = body.sku || `PRM-${body.permit_number.replace(/[^a-zA-Z0-9]/g, '')}`;

    // Check SKU uniqueness
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 400 }
      );
    }

    // Determine initial status based on dates
    let permitStatus = body.permit_status || 'pending';
    const today = new Date();
    
    if (body.permit_expiry_date) {
      const expiryDate = new Date(body.permit_expiry_date);
      if (expiryDate < today) {
        permitStatus = 'expired';
      }
    }

    if (body.permit_issue_date) {
      const issueDate = new Date(body.permit_issue_date);
      if (issueDate > today) {
        permitStatus = 'pending';
      } else if (permitStatus !== 'expired') {
        permitStatus = 'active';
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        sku,
        name: body.name,
        description: body.description || null,
        product_type: 'service',
        inventory_category: 'permit',
        track_inventory: false,
        is_active: true,
        permit_number: body.permit_number,
        permit_type: body.permit_type || null,
        issuing_authority: body.issuing_authority || null,
        permit_issue_date: body.permit_issue_date || null,
        permit_expiry_date: body.permit_expiry_date || null,
        permit_status: permitStatus,
        permit_cost: body.permit_cost || 0,
        currency: body.currency || 'USD',
        annual_quota: body.annual_quota || null,
        quota_used: body.quota_used || 0,
        renewal_reminder_days: body.renewal_reminder_days || 30,
        linked_product_ids: body.linked_product_ids || [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
