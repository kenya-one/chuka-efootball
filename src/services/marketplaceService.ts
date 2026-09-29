import { supabase } from '../lib/supabase';

export interface Business {
  id: string;
  business_name: string;
  category: string;
  description: string | null;
  location: string | null;
  maps_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  opening_hours: string | null;
  image_url: string | null;
  owner_name: string | null;
  owner_email: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  featured: boolean;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface CreateBusinessInput {
  business_name: string;
  category: string;
  description?: string;
  location?: string;
  maps_url?: string;
  phone?: string;
  whatsapp?: string;
  opening_hours?: string;
  image_url?: string;
  owner_name?: string;
  owner_email?: string;
}

export async function submitBusiness(input: CreateBusinessInput) {
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      ...input,
      status: 'PENDING',
      featured: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Business;
}

export async function getApprovedBusinesses() {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Business[];
}

export async function getPendingBusinesses() {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Business[];
}

export async function approveBusiness(
  businessId: string,
  adminEmail: string
) {
  const { data, error } = await supabase
    .from('businesses')
    .update({
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
      approved_by: adminEmail,
    })
    .eq('id', businessId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Business;
}

export async function rejectBusiness(
  businessId: string,
  adminEmail: string
) {
  const { data, error } = await supabase
    .from('businesses')
    .update({
      status: 'REJECTED',
      approved_at: null,
      approved_by: adminEmail,
    })
    .eq('id', businessId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Business;
}