import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import {
  createCatalogueItem,
  createOrder,
  deleteCatalogueItem,
  getApprovedBusinesses,
  getBusinessOrders,
  getCatalogueItems,
  getMyBusinesses,
  getMyOrders,
  markOrderReceived,
  submitBusiness,
  updateCatalogueItem,
  updateMyBusiness,
  uploadMarketplaceImage,
  type Business,
  type CatalogueItem,
  type CatalogueItemInput,
  type CreateBusinessInput,
  type FulfillmentType,
  type MarketplaceOrder,
} from '../services/marketplaceService';

const CATEGORIES = [
  'All', 'Food', 'Laundry', 'Hotel', 'Clothing', 'Electronics', 'Beauty',
  'Printing', 'Stationery', 'Services', 'General',
];

const ITEM_TYPES = ['PRODUCT', 'SERVICE', 'ROOM', 'PACKAGE'] as const;

type CartLine = CatalogueItem & { cartQuantity: number };

type ViewMode = 'DISCOVER' | 'OWNER' | 'ORDERS';

const emptyBusinessForm: CreateBusinessInput = {
  business_name: '', category: 'General', description: '', location: '',
  maps_url: '', phone: '', whatsapp: '', opening_hours: '', image_url: '',
};

const emptyItemForm: CatalogueItemInput = {
  item_name: '', description: '', price: null, image_url: '', item_type: 'PRODUCT',
  category: '', stock_status: 'IN_STOCK', quantity: null, is_new: false,
  available_today: true, active: true,
};

function whatsappUrl(number: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, '')}`;
}

function money(value: number | null | undefined) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

function orderLabel(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export const MarketplaceView: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [myOrders, setMyOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [view, setView] = useState<ViewMode>('DISCOVER');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('PICKUP');
  const [checkout, setCheckout] = useState({
    name: '', phone: '', pickupTime: '', address: '', landmark: '', instructions: '', deliveryFee: '0', notes: '',
  });
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [businessForm, setBusinessForm] = useState<CreateBusinessInput>(emptyBusinessForm);
  const [ownerBusiness, setOwnerBusiness] = useState<Business | null>(null);
  const [ownerCatalogue, setOwnerCatalogue] = useState<CatalogueItem[]>([]);
  const [ownerOrders, setOwnerOrders] = useState<MarketplaceOrder[]>([]);
  const [itemForm, setItemForm] = useState<CatalogueItemInput>(emptyItemForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [businessImageFile, setBusinessImageFile] = useState<File | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);

  const setFailure = (err: unknown) => setError(err instanceof Error ? err.message : 'Something went wrong.');

  const loadBusinesses = async () => {
    setLoading(true);
    setError('');
    try { setBusinesses(await getApprovedBusinesses()); }
    catch (err) { setFailure(err); }
    finally { setLoading(false); }
  };

  const loadOwner = async () => {
    try {
      const mine = await getMyBusinesses();
      setMyBusinesses(mine);
      const first = mine[0] || null;
      setOwnerBusiness(first);
      if (first) {
        const [items, orders] = await Promise.all([getCatalogueItems(first.id, true), getBusinessOrders(first.id, true)]);
        setOwnerCatalogue(items);
        setOwnerOrders(orders);
      } else {
        setOwnerCatalogue([]); setOwnerOrders([]);
      }
    } catch (err) { setFailure(err); }
  };

  const loadOrders = async () => {
    try { setMyOrders(await getMyOrders()); }
    catch (err) { setFailure(err); }
  };

  useEffect(() => { void loadBusinesses(); void loadOwner(); void loadOrders(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((business) => {
      const categoryMatch = category === 'All' || business.category === category;
      const searchable = [business.business_name, business.category, business.description, business.location].filter(Boolean).join(' ').toLowerCase();
      return categoryMatch && (!q || searchable.includes(q));
    });
  }, [businesses, category, query]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price || 0) * item.cartQuantity, 0), [cart]);
  const deliveryFee = fulfillment === 'DELIVERY' ? Number(checkout.deliveryFee || 0) : 0;

  const openBusiness = async (business: Business) => {
    setSelectedBusiness(business); setCatalogueLoading(true); setError('');
    try { setCatalogue(await getCatalogueItems(business.id)); }
    catch (err) { setFailure(err); }
    finally { setCatalogueLoading(false); }
  };

  const addToCart = (item: CatalogueItem) => {
    if (!selectedBusiness) return;
    const existing = cart.find((line) => line.id === item.id);
    setCart(existing
      ? cart.map((line) => line.id === item.id ? { ...line, cartQuantity: line.cartQuantity + 1 } : line)
      : [...cart, { ...item, cartQuantity: 1 }]);
    setNotice(`${item.item_name} added to cart.`);
  };

  const changeCartQuantity = (id: string, quantity: number) => {
    setCart(quantity <= 0 ? cart.filter((item) => item.id !== id) : cart.map((item) => item.id === id ? { ...item, cartQuantity: quantity } : item));
  };

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBusiness || !cart.length) return;
    setCheckoutSaving(true); setError(''); setNotice('');
    try {
      await createOrder({
        business_id: selectedBusiness.id,
        fulfillment_type: fulfillment,
        customer_name: checkout.name.trim(),
        customer_phone: checkout.phone.trim(),
        pickup_time: fulfillment === 'PICKUP' ? checkout.pickupTime.trim() : undefined,
        delivery_address: fulfillment === 'DELIVERY' ? checkout.address.trim() : undefined,
        delivery_landmark: fulfillment === 'DELIVERY' ? checkout.landmark.trim() : undefined,
        delivery_instructions: fulfillment === 'DELIVERY' ? checkout.instructions.trim() : undefined,
        delivery_fee: fulfillment === 'DELIVERY' ? deliveryFee : 0,
        notes: checkout.notes.trim(),
        items: cart.map((item) => ({ catalogue_item_id: item.id, item_name: item.item_name, unit_price: Number(item.price || 0), quantity: item.cartQuantity })),
      });
      setCart([]); setShowCheckout(false); setNotice('Order placed successfully.'); await loadOrders();
    } catch (err) { setFailure(err); }
    finally { setCheckoutSaving(false); }
  };

  const submitNewBusiness = async (event: React.FormEvent) => {
    event.preventDefault(); setSavingBusiness(true); setError(''); setNotice('');
    try {
      let imageUrl = businessForm.image_url?.trim() || '';
      if (businessImageFile) imageUrl = await uploadMarketplaceImage(businessImageFile, 'businesses');
      await submitBusiness({ ...businessForm, image_url: imageUrl });
      setBusinessForm(emptyBusinessForm); setBusinessImageFile(null); setShowBusinessForm(false);
      setNotice('Business submitted. It will appear after admin approval.'); await loadBusinesses(); await loadOwner();
    } catch (err) { setFailure(err); }
    finally { setSavingBusiness(false); }
  };

  const saveOwnerBusiness = async (event: React.FormEvent) => {
    event.preventDefault(); if (!ownerBusiness) return;
    setSavingBusiness(true); setError(''); setNotice('');
    try {
      let imageUrl = businessForm.image_url?.trim() || ownerBusiness.image_url || '';
      if (businessImageFile) imageUrl = await uploadMarketplaceImage(businessImageFile, `businesses/${ownerBusiness.id}`);
      const updated = await updateMyBusiness(ownerBusiness.id, { ...businessForm, image_url: imageUrl });
      setOwnerBusiness(updated); setBusinessForm({ ...emptyBusinessForm, ...updated }); setBusinessImageFile(null); setNotice('Business details updated.'); await loadBusinesses();
    } catch (err) { setFailure(err); }
    finally { setSavingBusiness(false); }
  };

  const startEditBusiness = () => {
    if (!ownerBusiness) return;
    setBusinessForm({
      business_name: ownerBusiness.business_name, category: ownerBusiness.category, description: ownerBusiness.description || '',
      location: ownerBusiness.location || '', maps_url: ownerBusiness.maps_url || '', phone: ownerBusiness.phone || '',
      whatsapp: ownerBusiness.whatsapp || '', opening_hours: ownerBusiness.opening_hours || '', image_url: ownerBusiness.image_url || '',
    });
  };

  const saveItem = async (event: React.FormEvent) => {
    event.preventDefault(); if (!ownerBusiness) return;
    setSavingItem(true); setError('');
    try {
      let imageUrl = itemForm.image_url || '';
      if (itemImageFile) imageUrl = await uploadMarketplaceImage(itemImageFile, `businesses/${ownerBusiness.id}/catalogue`);
      const payload = { ...itemForm, image_url: imageUrl };
      if (editingItemId) await updateCatalogueItem(editingItemId, payload);
      else await createCatalogueItem(ownerBusiness.id, payload);
      setItemForm(emptyItemForm); setEditingItemId(null); setItemImageFile(null);
      setOwnerCatalogue(await getCatalogueItems(ownerBusiness.id, true)); setNotice('Catalogue saved.');
    } catch (err) { setFailure(err); }
    finally { setSavingItem(false); }
  };

  const editItem = (item: CatalogueItem) => {
    setEditingItemId(item.id);
    setItemForm({ item_name: item.item_name, description: item.description || '', price: item.price, image_url: item.image_url || '', item_type: item.item_type, category: item.category || '', stock_status: item.stock_status, quantity: item.quantity, is_new: item.is_new, available_today: item.available_today, active: item.active });
  };

  const removeItem = async (item: CatalogueItem) => {
    if (!window.confirm(`Hide ${item.item_name} from the catalogue?`)) return;
    try { await deleteCatalogueItem(item.id); if (ownerBusiness) setOwnerCatalogue(await getCatalogueItems(ownerBusiness.id, true)); setNotice('Catalogue item hidden.'); }
    catch (err) { setFailure(err); }
  };

  const receiveOrder = async (order: MarketplaceOrder) => {
    try { await markOrderReceived(order.id); if (ownerBusiness) setOwnerOrders(await getBusinessOrders(ownerBusiness.id, true)); setNotice(`${orderLabel(order.id)} marked as received.`); }
    catch (err) { setFailure(err); }
  };

  const openOwner = async () => { setView('OWNER'); await loadOwner(); };
  const openOrders = async () => { setView('ORDERS'); await loadOrders(); };

  return (
    <div className="arena-page">
      <div className="arena-page-heading">
        <div>
          <span className="arena-kicker">CHUKA MARKETPLACE</span>
          <h1>{view === 'OWNER' ? 'My Marketplace Business' : view === 'ORDERS' ? 'My Orders' : 'Discover businesses around Chuka'}</h1>
          <p>{view === 'OWNER' ? 'Manage your approved business, catalogue and incoming orders.' : view === 'ORDERS' ? 'Track orders you have placed.' : 'Discover shops, laundry, hotels and services. Approved businesses can manage their own catalogues.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {view !== 'DISCOVER' && <button className="arena-btn arena-btn-ghost" onClick={() => setView('DISCOVER')}><ArrowLeft size={16} /> Marketplace</button>}
          <button className="arena-btn arena-btn-ghost" onClick={() => void openOrders()}><Package size={16} /> Orders{myOrders.length ? ` (${myOrders.length})` : ''}</button>
          <button className="arena-btn arena-btn-ghost" onClick={() => void openOwner()}><Store size={16} /> My Business</button>
          <button className="arena-btn arena-btn-primary" onClick={() => setShowBusinessForm(true)}><Plus size={17} /> Add Business</button>
        </div>
      </div>

      {notice && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{notice}</div>}
      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {view === 'DISCOVER' && (
        <>
          <div className="mb-5 flex flex-col gap-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search businesses, services or locations..." className="arena-input w-full" />
            <div className="flex gap-2 overflow-x-auto pb-1">{CATEGORIES.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${category === item ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-300'}`}>{item}</button>)}</div>
          </div>
          {loading ? <div className="arena-loading"><RefreshCw size={22} className="animate-spin" /> Loading Marketplace...</div> : filtered.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center"><Store size={38} className="mx-auto mb-3 text-gray-500" /><h3 className="text-lg font-semibold text-white">No businesses found</h3></div> :
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((business) => <article key={business.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {business.image_url ? <img src={business.image_url} alt={business.business_name} className="h-44 w-full object-cover" /> : <div className="flex h-44 items-center justify-center bg-gradient-to-br from-emerald-500/20 to-blue-500/10"><Store size={48} className="text-emerald-300/70" /></div>}
              <div className="p-4"><div className="mb-2 flex items-start justify-between gap-3"><div><span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">{business.category}</span><h2 className="mt-1 text-lg font-bold text-white">{business.business_name}</h2></div>{business.featured && <span className="rounded-full bg-yellow-400/15 px-2 py-1 text-xs text-yellow-300">Featured</span>}</div>
                {business.description && <p className="mb-3 line-clamp-3 text-sm text-gray-400">{business.description}</p>}
                {business.location && <div className="mb-2 flex gap-2 text-sm text-gray-400"><MapPin size={16} /> {business.location}</div>}
                <div className="mt-4 flex flex-wrap gap-2"><button className="arena-btn arena-btn-primary" onClick={() => void openBusiness(business)}><ShoppingCart size={15} /> View Catalogue</button>{business.whatsapp && <a href={whatsappUrl(business.whatsapp)} target="_blank" rel="noreferrer" className="arena-btn arena-btn-ghost"><MessageCircle size={15} /> WhatsApp</a>}{business.phone && <a href={`tel:${business.phone}`} className="arena-btn arena-btn-ghost"><Phone size={15} /> Call</a>}</div>
              </div>
            </article>)}</div>}
        </>
      )}

      {view === 'ORDERS' && <div className="space-y-4">{myOrders.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-gray-400">You have no Marketplace orders yet.</div> : myOrders.map((order) => <article key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs text-gray-500">{orderLabel(order.id)}</div><h3 className="text-lg font-bold text-white">{order.business?.business_name || 'Marketplace business'}</h3></div><span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">{order.status}</span></div><div className="mt-4 space-y-2">{order.items?.map((item) => <div key={item.id} className="flex justify-between text-sm text-gray-300"><span>{item.quantity} × {item.item_name}</span><span>{money(item.unit_price * item.quantity)}</span></div>)}</div><div className="mt-4 grid gap-2 text-sm text-gray-400 md:grid-cols-3"><div>{order.fulfillment_type === 'DELIVERY' ? <Truck size={15} className="inline mr-1" /> : <Package size={15} className="inline mr-1" />}{order.fulfillment_type}</div><div>Total: <strong className="text-white">{money(order.total)}</strong></div><div>{new Date(order.created_at).toLocaleString()}</div></div></article>)}</div>}

      {view === 'OWNER' && <div className="space-y-6">
        {!ownerBusiness ? <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"><Store size={38} className="mx-auto mb-3 text-gray-500" /><h3 className="text-xl font-semibold text-white">You don't have a business yet</h3><p className="mt-2 text-gray-400">Submit your business for admin approval, then manage your catalogue here.</p><button className="arena-btn arena-btn-primary mt-5" onClick={() => setShowBusinessForm(true)}><Plus size={16} /> Add Business</button></div> : <>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="text-xs uppercase tracking-wide text-emerald-400">{ownerBusiness.category}</span><h2 className="text-2xl font-bold text-white">{ownerBusiness.business_name}</h2><p className="mt-1 text-sm text-gray-400">Status: {ownerBusiness.status}</p></div><button className="arena-btn arena-btn-ghost" onClick={startEditBusiness}><Pencil size={15} /> Edit Business</button></div>{ownerBusiness.image_url && <img src={ownerBusiness.image_url} alt="" className="mt-4 h-40 w-full rounded-xl object-cover" />}</section>
          <section className="grid gap-6 lg:grid-cols-[1fr_1.3fr]"><form onSubmit={saveItem} className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold text-white">{editingItemId ? 'Edit Catalogue Item' : 'Add Catalogue Item'}</h3>{editingItemId && <button type="button" onClick={() => { setEditingItemId(null); setItemForm(emptyItemForm); }} className="text-sm text-gray-400">Cancel</button>}</div><div className="space-y-3"><input required value={itemForm.item_name} onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })} placeholder="Item/service name *" className="arena-input w-full" /><select value={itemForm.item_type} onChange={(e) => setItemForm({ ...itemForm, item_type: e.target.value as CatalogueItemInput['item_type'] })} className="arena-input w-full">{ITEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select><textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Description" rows={3} className="arena-input w-full" /><div className="grid gap-3 md:grid-cols-2"><input type="number" min="0" value={itemForm.price ?? ''} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Price (KSh)" className="arena-input w-full" /><input value={itemForm.category || ''} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} placeholder="Catalogue category" className="arena-input w-full" /></div><input type="number" min="0" value={itemForm.quantity ?? ''} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Quantity (optional)" className="arena-input w-full" /><input type="file" accept="image/*" onChange={(e) => setItemImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400" /><input value={itemForm.image_url || ''} onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })} placeholder="Or image URL" className="arena-input w-full" /><label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={itemForm.available_today ?? true} onChange={(e) => setItemForm({ ...itemForm, available_today: e.target.checked })} /> Available today</label><label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={itemForm.active ?? true} onChange={(e) => setItemForm({ ...itemForm, active: e.target.checked })} /> Visible in catalogue</label><button disabled={savingItem} className="arena-btn arena-btn-primary w-full">{savingItem ? 'Saving...' : editingItemId ? 'Save Changes' : 'Add to Catalogue'}</button></div></form>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><h3 className="mb-4 text-lg font-bold text-white">Catalogue</h3>{ownerCatalogue.length === 0 ? <p className="text-sm text-gray-400">No catalogue items yet.</p> : <div className="grid gap-3 sm:grid-cols-2">{ownerCatalogue.map((item) => <article key={item.id} className={`rounded-xl border border-white/10 bg-black/10 p-3 ${!item.active ? 'opacity-50' : ''}`}>{item.image_url && <img src={item.image_url} alt={item.item_name} className="mb-3 h-28 w-full rounded-lg object-cover" />}<div className="flex items-start justify-between gap-2"><div><span className="text-[11px] uppercase text-emerald-400">{item.item_type}</span><h4 className="font-semibold text-white">{item.item_name}</h4></div><strong className="text-white">{money(item.price)}</strong></div><p className="mt-1 text-xs text-gray-400">{item.description || 'No description'}</p><div className="mt-3 flex gap-2"><button className="arena-btn arena-btn-ghost" onClick={() => editItem(item)}><Pencil size={14} /> Edit</button><button className="arena-btn arena-btn-ghost" onClick={() => void removeItem(item)}><Trash2 size={14} /> Hide</button></div></article>)}</div>}</div></section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold text-white">Active Orders</h3><span className="text-sm text-gray-400">{ownerOrders.length}</span></div>{ownerOrders.length === 0 ? <p className="text-sm text-gray-400">No active orders.</p> : <div className="space-y-3">{ownerOrders.map((order) => <article key={order.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-3"><div><strong className="text-white">{orderLabel(order.id)}</strong><div className="mt-1 text-sm text-gray-300"><UserRound size={14} className="inline mr-1" />{order.customer_name || 'Customer'} · {order.customer_phone || 'No phone'}</div></div><span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">{order.fulfillment_type}</span></div><div className="mt-3 space-y-1 text-sm text-gray-400">{order.items?.map((item) => <div key={item.id}>{item.quantity} × {item.item_name} — {money(item.unit_price * item.quantity)}</div>)}</div>{order.fulfillment_type === 'DELIVERY' && <div className="mt-3 text-sm text-gray-400"><MapPin size={14} className="inline mr-1" />{order.delivery_address}{order.delivery_landmark ? ` · ${order.delivery_landmark}` : ''}</div>}<div className="mt-4 flex items-center justify-between"><strong className="text-white">Total {money(order.total)}</strong><button className="arena-btn arena-btn-primary" onClick={() => void receiveOrder(order)}><CheckCircle2 size={15} /> Mark as Received</button></div></article>)}</div>}</section>
        </>}
      </div>}

      {selectedBusiness && <div className="arena-modal-backdrop"><div className="arena-modal max-w-5xl max-h-[90vh] overflow-y-auto"><div className="mb-5 flex items-start justify-between"><div><span className="arena-kicker">{selectedBusiness.category}</span><h2 className="text-2xl font-bold text-white">{selectedBusiness.business_name}</h2><p className="text-sm text-gray-400">{selectedBusiness.location || 'Chuka'}</p></div><button onClick={() => setSelectedBusiness(null)} className="rounded-lg p-2 text-gray-400 hover:bg-white/10"><X size={20} /></button></div>{catalogueLoading ? <div className="arena-loading"><RefreshCw size={20} className="animate-spin" /> Loading catalogue...</div> : catalogue.length === 0 ? <div className="rounded-xl bg-white/5 p-8 text-center text-gray-400">This business has no active catalogue items yet.</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{catalogue.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">{item.image_url ? <img src={item.image_url} alt={item.item_name} className="h-36 w-full object-cover" /> : <div className="flex h-36 items-center justify-center bg-white/5"><Package size={38} className="text-gray-500" /></div>}<div className="p-4"><span className="text-[11px] uppercase text-emerald-400">{item.item_type}</span><h3 className="mt-1 font-bold text-white">{item.item_name}</h3><p className="mt-1 line-clamp-2 text-sm text-gray-400">{item.description}</p><div className="mt-3 flex items-center justify-between"><strong className="text-white">{money(item.price)}</strong><button disabled={!item.available_today || item.stock_status === 'OUT_OF_STOCK' || item.stock_status === 'SOLD_OUT'} className="arena-btn arena-btn-primary" onClick={() => addToCart(item)}>{item.available_today ? 'Add' : 'Unavailable'}</button></div></div></article>)}</div>}</div></div>}

      {cart.length > 0 && selectedBusiness && <button onClick={() => setShowCheckout(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 font-bold text-black shadow-xl"><ShoppingCart size={18} /> Cart ({cart.reduce((sum, item) => sum + item.cartQuantity, 0)}) · {money(cartTotal)}</button>}

      {showCheckout && selectedBusiness && <div className="arena-modal-backdrop"><div className="arena-modal max-w-2xl max-h-[90vh] overflow-y-auto"><div className="mb-5 flex items-start justify-between"><div><span className="arena-kicker">CHECKOUT</span><h2 className="text-xl font-bold text-white">Order from {selectedBusiness.business_name}</h2></div><button onClick={() => setShowCheckout(false)} className="rounded-lg p-2 text-gray-400"><X size={20} /></button></div><div className="mb-5 space-y-2 rounded-xl bg-white/5 p-4">{cart.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 text-sm"><span className="text-gray-300">{item.item_name}</span><div className="flex items-center gap-2"><button onClick={() => changeCartQuantity(item.id, item.cartQuantity - 1)} className="rounded bg-white/10 px-2">−</button><span className="text-white">{item.cartQuantity}</span><button onClick={() => changeCartQuantity(item.id, item.cartQuantity + 1)} className="rounded bg-white/10 px-2">+</button><strong className="ml-2 text-white">{money(Number(item.price || 0) * item.cartQuantity)}</strong></div></div>)}<div className="border-t border-white/10 pt-2 text-right font-bold text-white">Subtotal: {money(cartTotal)}</div></div><form onSubmit={submitOrder} className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><input required value={checkout.name} onChange={(e) => setCheckout({ ...checkout, name: e.target.value })} placeholder="Your name *" className="arena-input" /><input required value={checkout.phone} onChange={(e) => setCheckout({ ...checkout, phone: e.target.value })} placeholder="Phone number *" className="arena-input" /></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setFulfillment('PICKUP')} className={`rounded-xl border p-4 text-left ${fulfillment === 'PICKUP' ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/10 bg-white/5'}`}><Package size={18} /><strong className="mt-2 block text-white">Pickup</strong><span className="text-xs text-gray-400">Collect from the business</span></button><button type="button" onClick={() => setFulfillment('DELIVERY')} className={`rounded-xl border p-4 text-left ${fulfillment === 'DELIVERY' ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/10 bg-white/5'}`}><Truck size={18} /><strong className="mt-2 block text-white">Delivery</strong><span className="text-xs text-gray-400">Have it delivered</span></button></div>{fulfillment === 'PICKUP' ? <input value={checkout.pickupTime} onChange={(e) => setCheckout({ ...checkout, pickupTime: e.target.value })} placeholder="Preferred pickup time" className="arena-input w-full" /> : <><input required value={checkout.address} onChange={(e) => setCheckout({ ...checkout, address: e.target.value })} placeholder="Delivery address *" className="arena-input w-full" /><div className="grid gap-3 md:grid-cols-2"><input value={checkout.landmark} onChange={(e) => setCheckout({ ...checkout, landmark: e.target.value })} placeholder="Landmark" className="arena-input" /><input type="number" min="0" value={checkout.deliveryFee} onChange={(e) => setCheckout({ ...checkout, deliveryFee: e.target.value })} placeholder="Delivery fee" className="arena-input" /></div><textarea value={checkout.instructions} onChange={(e) => setCheckout({ ...checkout, instructions: e.target.value })} placeholder="Delivery instructions" rows={2} className="arena-input w-full" /></>}<textarea value={checkout.notes} onChange={(e) => setCheckout({ ...checkout, notes: e.target.value })} placeholder="Order notes" rows={2} className="arena-input w-full" /><div className="flex items-center justify-between border-t border-white/10 pt-4"><strong className="text-lg text-white">Total {money(cartTotal + deliveryFee)}</strong><button disabled={checkoutSaving} className="arena-btn arena-btn-primary">{checkoutSaving ? 'Placing...' : 'Place Order'}</button></div></form></div></div>}

      {showBusinessForm && <div className="arena-modal-backdrop"><div className="arena-modal max-w-2xl max-h-[90vh] overflow-y-auto"><div className="mb-5 flex items-start justify-between"><div><span className="arena-kicker">MARKETPLACE</span><h2 className="text-xl font-bold text-white">Add your business</h2><p className="mt-1 text-sm text-gray-400">Your listing will remain pending until an administrator approves it.</p></div><button onClick={() => setShowBusinessForm(false)} className="rounded-lg p-2 text-gray-400"><X size={20} /></button></div><form onSubmit={submitNewBusiness} className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><input required value={businessForm.business_name} onChange={(e) => setBusinessForm({ ...businessForm, business_name: e.target.value })} placeholder="Business name *" className="arena-input" /><select value={businessForm.category} onChange={(e) => setBusinessForm({ ...businessForm, category: e.target.value })} className="arena-input">{CATEGORIES.filter((x) => x !== 'All').map((x) => <option key={x}>{x}</option>)}</select></div><textarea value={businessForm.description} onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })} placeholder="Business description" rows={3} className="arena-input w-full" /><div className="grid gap-3 md:grid-cols-2"><input value={businessForm.location} onChange={(e) => setBusinessForm({ ...businessForm, location: e.target.value })} placeholder="Location" className="arena-input" /><input value={businessForm.maps_url} onChange={(e) => setBusinessForm({ ...businessForm, maps_url: e.target.value })} placeholder="Google Maps link" className="arena-input" /><input value={businessForm.phone} onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })} placeholder="Phone" className="arena-input" /><input value={businessForm.whatsapp} onChange={(e) => setBusinessForm({ ...businessForm, whatsapp: e.target.value })} placeholder="WhatsApp" className="arena-input" /><input value={businessForm.opening_hours} onChange={(e) => setBusinessForm({ ...businessForm, opening_hours: e.target.value })} placeholder="Opening hours" className="arena-input" /></div><input type="file" accept="image/*" onChange={(e) => setBusinessImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400" /><input value={businessForm.image_url} onChange={(e) => setBusinessForm({ ...businessForm, image_url: e.target.value })} placeholder="Or business image URL" className="arena-input w-full" /><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowBusinessForm(false)} className="arena-btn arena-btn-ghost">Cancel</button><button disabled={savingBusiness} className="arena-btn arena-btn-primary">{savingBusiness ? 'Submitting...' : 'Submit Business'}</button></div></form></div></div>}
    </div>
  );
};
