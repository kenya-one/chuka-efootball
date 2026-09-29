import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Store,
  MapPin,
  Phone,
  MessageCircle,
  Plus,
  Clock,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  getApprovedBusinesses,
  submitBusiness,
  type Business,
  type CreateBusinessInput,
} from '../services/marketplaceService';

const CATEGORIES = [
  'All',
  'Food',
  'Clothing',
  'Electronics',
  'Beauty',
  'Printing',
  'Stationery',
  'Services',
  'General',
];

const emptyForm: CreateBusinessInput = {
  business_name: '',
  category: 'General',
  description: '',
  location: '',
  maps_url: '',
  phone: '',
  whatsapp: '',
  opening_hours: '',
  image_url: '',
};

function whatsappUrl(number: string) {
  const cleaned = number.replace(/[^\d]/g, '');
  return `https://wa.me/${cleaned}`;
}

export const MarketplaceView: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<CreateBusinessInput>(emptyForm);

  const loadBusinesses = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getApprovedBusinesses();
      setBusinesses(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Marketplace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBusinesses();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return businesses.filter((business) => {
      const matchesCategory =
        category === 'All' || business.category === category;

      const searchable = [
        business.business_name,
        business.category,
        business.description,
        business.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesCategory && (!q || searchable.includes(q));
    });
  }, [businesses, category, query]);

  const updateField = (
    field: keyof CreateBusinessInput,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await submitBusiness({
        ...form,
        business_name: form.business_name.trim(),
        description: form.description?.trim(),
        location: form.location?.trim(),
        maps_url: form.maps_url?.trim(),
        phone: form.phone?.trim(),
        whatsapp: form.whatsapp?.trim(),
        opening_hours: form.opening_hours?.trim(),
        image_url: form.image_url?.trim(),
      });

      setForm(emptyForm);
      setShowForm(false);
      setSuccess(
        'Business submitted successfully. It will appear in Marketplace after admin approval.'
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to submit business.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="arena-page">
      <div className="arena-page-heading">
        <div>
          <span className="arena-kicker">CHUKA MARKETPLACE</span>
          <h1>Discover businesses around Chuka</h1>
          <p>
            Find shops, services and student-friendly businesses. Businesses
            are reviewed before they appear publicly.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="arena-btn arena-btn-ghost"
            onClick={() => void loadBusinesses()}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            className="arena-btn arena-btn-primary"
            onClick={() => {
              setError('');
              setSuccess('');
              setShowForm(true);
            }}
          >
            <Plus size={17} />
            Add Business
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search businesses, services or locations..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white outline-none focus:border-emerald-400/50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                category === item
                  ? 'bg-emerald-500 text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="arena-loading">
          <RefreshCw size={22} className="animate-spin" />
          Loading Marketplace...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          <Store size={38} className="mx-auto mb-3 text-gray-500" />
          <h3 className="text-lg font-semibold text-white">
            No businesses found
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Try another search or category, or add a business to Marketplace.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((business) => (
            <article
              key={business.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              {business.image_url ? (
                <img
                  src={business.image_url}
                  alt={business.business_name}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="flex h-44 items-center justify-center bg-gradient-to-br from-emerald-500/20 to-blue-500/10">
                  <Store size={48} className="text-emerald-300/70" />
                </div>
              )}

              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                      {business.category}
                    </span>
                    <h2 className="mt-1 text-lg font-bold text-white">
                      {business.business_name}
                    </h2>
                  </div>

                  {business.featured && (
                    <span className="rounded-full bg-yellow-400/15 px-2 py-1 text-xs text-yellow-300">
                      Featured
                    </span>
                  )}
                </div>

                {business.description && (
                  <p className="mb-3 line-clamp-3 text-sm text-gray-400">
                    {business.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-400">
                  {business.location && (
                    <div className="flex gap-2">
                      <MapPin size={16} className="mt-0.5 shrink-0" />
                      <span>{business.location}</span>
                    </div>
                  )}

                  {business.opening_hours && (
                    <div className="flex gap-2">
                      <Clock size={16} className="mt-0.5 shrink-0" />
                      <span>{business.opening_hours}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {business.whatsapp && (
                    <a
                      href={whatsappUrl(business.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="arena-btn arena-btn-primary"
                    >
                      <MessageCircle size={15} />
                      WhatsApp
                    </a>
                  )}

                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="arena-btn arena-btn-ghost"
                    >
                      <Phone size={15} />
                      Call
                    </a>
                  )}

                  {business.maps_url && (
                    <a
                      href={business.maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="arena-btn arena-btn-ghost"
                    >
                      <MapPin size={15} />
                      Map
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div className="arena-modal-backdrop">
          <div className="arena-modal max-w-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <span className="arena-kicker">MARKETPLACE</span>
                <h2 className="text-xl font-bold text-white">
                  Add your business
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Your listing will remain pending until an administrator
                  approves it.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  required
                  value={form.business_name}
                  onChange={(e) =>
                    updateField('business_name', e.target.value)
                  }
                  placeholder="Business name *"
                  className="arena-input"
                />

                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="arena-input"
                >
                  {CATEGORIES.filter((item) => item !== 'All').map(
                    (item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Business description"
                rows={3}
                className="arena-input"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="Location e.g. Ndagani"
                  className="arena-input"
                />

                <input
                  value={form.maps_url}
                  onChange={(e) => updateField('maps_url', e.target.value)}
                  placeholder="Google Maps link"
                  className="arena-input"
                />

                <input
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="Phone number"
                  className="arena-input"
                />

                <input
                  value={form.whatsapp}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                  placeholder="WhatsApp number"
                  className="arena-input"
                />

                <input
                  value={form.opening_hours}
                  onChange={(e) =>
                    updateField('opening_hours', e.target.value)
                  }
                  placeholder="Opening hours"
                  className="arena-input"
                />

                <input
                  value={form.image_url}
                  onChange={(e) => updateField('image_url', e.target.value)}
                  placeholder="Business image URL"
                  className="arena-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="arena-btn arena-btn-ghost"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="arena-btn arena-btn-primary"
                >
                  {saving ? 'Submitting...' : 'Submit Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};