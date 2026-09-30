import { supabase } from '../lib/supabase';

export type BusinessStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ItemType = 'PRODUCT' | 'SERVICE' | 'ROOM' | 'PACKAGE';
export type FulfillmentType = 'PICKUP' | 'DELIVERY';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'RECEIVED' | 'CANCELLED';

export interface Business {
  id: string;
  owner_id: string | null;
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
  status: BusinessStatus;
  featured: boolean;
  created_at: string;
  updated_at?: string;
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

export interface CatalogueItem {
  id: string;
  business_id: string;
  item_name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  item_type: ItemType;
  category: string | null;
  stock_status: string;
  quantity: number | null;
  is_new: boolean;
  available_today: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogueItemInput {
  item_name: string;
  description?: string;
  price?: number | null;
  image_url?: string;
  item_type?: ItemType;
  category?: string;
  stock_status?: string;
  quantity?: number | null;
  is_new?: boolean;
  available_today?: boolean;
  active?: boolean;
}

export interface MarketplaceOrderItem {
  id: string;
  order_id: string;
  catalogue_item_id: string | null;
  item_name: string;
  unit_price: number;
  quantity: number;
}

export interface MarketplaceOrder {
  id: string;
  business_id: string;
  customer_id: string;
  status: OrderStatus;
  fulfillment_type: FulfillmentType;
  customer_name: string | null;
  customer_phone: string | null;
  pickup_time: string | null;
  delivery_address: string | null;
  delivery_landmark: string | null;
  delivery_instructions: string | null;
  delivery_fee: number;
  notes: string | null;
  subtotal: number;
  total: number;
  created_at: string;
  updated_at: string;
  received_at: string | null;
  business?: Business;
  items?: MarketplaceOrderItem[];
}

export interface CreateOrderInput {
  business_id: string;
  fulfillment_type: FulfillmentType;
  customer_name?: string;
  customer_phone?: string;
  pickup_time?: string;
  delivery_address?: string;
  delivery_landmark?: string;
  delivery_instructions?: string;
  delivery_fee?: number;
  notes?: string;
  items: Array<{
    catalogue_item_id: string;
    item_name: string;
    unit_price: number;
    quantity: number;
  }>;
}

export async function submitBusiness(input: CreateBusinessInput) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      ...input,
      owner_id: user?.id ?? null,
      status: 'PENDING',
      featured: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Business;
}

export async function getApprovedBusinesses() {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Business[];
}

export async function getPendingBusinesses() {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Business[];
}

export async function approveBusiness(businessId: string, adminEmail: string) {
  const { data, error } = await supabase
    .from('businesses')
    .update({ status: 'APPROVED', approved_at: new Date().toISOString(), approved_by: adminEmail })
    .eq('id', businessId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Business;
}

export async function rejectBusiness(businessId: string, adminEmail: string) {
  const { data, error } = await supabase
    .from('businesses')
    .update({ status: 'REJECTED', approved_at: null, approved_by: adminEmail })
    .eq('id', businessId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Business;
}

export async function getMyBusinesses() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Business[];
}

export async function updateMyBusiness(businessId: string, input: Partial<CreateBusinessInput>) {
  const { data, error } = await supabase
    .from('businesses')
    .update(input)
    .eq('id', businessId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Business;
}

export async function getCatalogueItems(businessId: string, includeInactive = false) {
  let query = supabase
    .from('catalogue_items')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as CatalogueItem[];
}

export async function createCatalogueItem(businessId: string, input: CatalogueItemInput) {
  const { data, error } = await supabase
    .from('catalogue_items')
    .insert({ business_id: businessId, ...input })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CatalogueItem;
}

export async function updateCatalogueItem(itemId: string, input: Partial<CatalogueItemInput>) {
  const { data, error } = await supabase
    .from('catalogue_items')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CatalogueItem;
}

export async function deleteCatalogueItem(itemId: string) {
  const { error } = await supabase
    .from('catalogue_items')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', itemId);
  if (error) throw new Error(error.message);
}

export async function uploadMarketplaceImage(file: File, folder: string) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('marketplace').upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('marketplace').getPublicUrl(path);
  return data.publicUrl;
}

export async function createOrder(input: CreateOrderInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in before placing an order.');
  if (!input.items.length) throw new Error('Your cart is empty.');

  const deliveryFee = input.fulfillment_type === 'DELIVERY' ? Number(input.delivery_fee || 0) : 0;
  const subtotal = input.items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from('marketplace_orders')
    .insert({
      business_id: input.business_id,
      customer_id: user.id,
      status: 'PENDING',
      fulfillment_type: input.fulfillment_type,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      pickup_time: input.pickup_time,
      delivery_address: input.delivery_address,
      delivery_landmark: input.delivery_landmark,
      delivery_instructions: input.delivery_instructions,
      delivery_fee: deliveryFee,
      notes: input.notes,
      subtotal,
      total: subtotal + deliveryFee,
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  const { error: itemError } = await supabase.from('marketplace_order_items').insert(
    input.items.map((item) => ({ ...item, order_id: order.id }))
  );
  if (itemError) {
    await supabase.from('marketplace_orders').delete().eq('id', order.id);
    throw new Error(itemError.message);
  }
  return order as MarketplaceOrder;
}

export async function getBusinessOrders(businessId: string, activeOnly = true) {
  let query = supabase
    .from('marketplace_orders')
    .select('*, items:marketplace_order_items(*)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (activeOnly) query = query.neq('status', 'RECEIVED').neq('status', 'CANCELLED');
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as MarketplaceOrder[];
}

export async function getMyOrders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('marketplace_orders')
    .select('*, items:marketplace_order_items(*), business:businesses(*)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MarketplaceOrder[];
}

export async function markOrderReceived(orderId: string) {
  const { data, error } = await supabase
    .from('marketplace_orders')
    .update({ status: 'RECEIVED', received_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MarketplaceOrder;
}
