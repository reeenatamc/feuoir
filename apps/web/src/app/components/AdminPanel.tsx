import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Flame, Layers, Shirt, LogOut, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase, settingsToDb, settingsFromDb } from '../lib/supabase';
import type { Product, CartItem, Settings } from '../types';

const categoryLabels: Record<string, string> = {
  griptape: 'Grip Tape',
  lighter:  'Lighter',
  hoodie:   'Hoodie',
  custom:   'Custom',
};

const categoryIcons: Record<string, typeof Flame> = {
  griptape: Layers,
  lighter:  Flame,
  hoodie:   Shirt,
  custom:   Flame,
};

const statusStyle: Record<string, string> = {
  active:   'bg-emerald-50 text-emerald-700',
  draft:    'bg-black/5 text-black/50',
  archived: 'bg-red-50 text-red-600',
};

const settingsFields = [
  { key: 'businessName', tKey: 'admin.config.businessName', type: 'text',   placeholder: 'Feuoir' },
  { key: 'whatsapp',     tKey: 'admin.config.whatsapp',     type: 'tel',    placeholder: '+54 9 11 1234 5678' },
  { key: 'currency',     tKey: 'admin.config.currency',     type: 'text',   placeholder: 'USD' },
  { key: 'shippingCost', tKey: 'admin.config.shippingCost', type: 'number', placeholder: '10' },
  { key: 'taxRate',      tKey: 'admin.config.taxRate',      type: 'number', placeholder: '0' },
] as const;

export function AdminPanel({
  orders,
  settings,
  onUpdateSettings,
  onLogout,
}: {
  orders:            CartItem[];
  settings:          Settings;
  onUpdateSettings:  (updates: Partial<Settings>) => void;
  onLogout:          () => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab]             = useState<'products' | 'orders' | 'config'>('products');
  const [products, setProducts]   = useState<Product[]>([]);
  const [loadingP, setLoadingP]   = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});
  const [saving, setSaving]       = useState(false);

  // Local copy of settings for the config form
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .order('id')
      .then(({ data }) => {
        setProducts((data as Product[]) ?? []);
        setLoadingP(false);
      });
  }, []);

  // Sync settings prop → local form
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  /* ── Product edit ── */
  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditValues({ name: p.name, price: p.price, description: p.description });
  };

  const cancelEdit = () => { setEditingId(null); setEditValues({}); };

  const saveEdit = async () => {
    if (editingId === null) return;
    setSaving(true);
    await supabase.from('products').update(editValues).eq('id', editingId);
    setProducts((prev) =>
      prev.map((p) => (p.id === editingId ? { ...p, ...editValues } : p))
    );
    setSaving(false);
    setEditingId(null);
    setEditValues({});
  };

  const toggleStatus = async (product: Product) => {
    const next: Record<string, Product['status']> = {
      active: 'draft', draft: 'active', archived: 'active',
    };
    const newStatus = next[product.status];
    await supabase.from('products').update({ status: newStatus }).eq('id', product.id);
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
    );
  };

  /* ── Settings save ── */
  const saveSettings = async () => {
    setSavingSettings(true);
    await supabase.from('settings').update(settingsToDb(localSettings)).eq('id', 1);
    onUpdateSettings(localSettings);
    setSettingsDirty(false);
    setSavingSettings(false);
  };

  const updateLocal = (updates: Partial<Settings>) => {
    setLocalSettings((prev) => ({ ...prev, ...updates }));
    setSettingsDirty(true);
  };

  const total       = orders.reduce((s, i) => s + i.product.price, 0);
  const activeCount = products.filter((p) => p.status === 'active').length;

  return (
    <section className="min-h-screen bg-[#fafafa] pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="py-8 md:py-12 border-b border-black/8 mb-8 md:mb-10 flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-black/30 mb-1.5">Feuoir</p>
            <h1 className="text-2xl md:text-4xl tracking-tight">{t('admin.title')}</h1>
          </div>
          <div className="flex items-center gap-4 pb-1">
            <button
              onClick={() => navigate('/')}
              className="text-[10px] tracking-[0.25em] uppercase text-black/30 hover:text-black/60 transition-colors hidden sm:block"
            >
              {t('admin.viewSite')}
            </button>
            <button
              onClick={() => { onLogout(); navigate('/admin/login', { replace: true }); }}
              className="flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase text-black/30 hover:text-black/60 transition-colors"
            >
              <LogOut size={12} />
              {t('admin.logout')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
          {[
            { label: t('admin.stats.products'), value: products.length },
            { label: t('admin.stats.active'),   value: activeCount },
            { label: t('admin.stats.orders'),   value: orders.length },
            { label: t('admin.stats.revenue'),  value: `${settings.currency} ${total}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-black/5 p-4 md:p-6">
              <p className="text-[10px] tracking-[0.3em] uppercase text-black/30 mb-2">{label}</p>
              <p className="text-xl md:text-2xl tracking-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-black/8 mb-8">
          {([
            { id: 'products', label: t('admin.tabs.products') },
            { id: 'orders',   label: t('admin.tabs.orders') },
            { id: 'config',   label: t('admin.tabs.config') },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-5 py-3 text-sm tracking-wide border-b-2 -mb-[2px] transition-colors ${
                tab === id
                  ? 'border-black text-black'
                  : 'border-transparent text-black/35 hover:text-black/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Products ── */}
        {tab === 'products' && (
          <div className="overflow-x-auto -mx-6 md:mx-0 px-6 md:px-0">
            {loadingP ? (
              <div className="space-y-4 py-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-white animate-pulse" />
                ))}
              </div>
            ) : (
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-black/8">
                    {[t('admin.table.product'), t('admin.table.category'), t('admin.table.price'), t('admin.table.status'), ''].map((h) => (
                      <th key={h} className="pb-3 text-[10px] tracking-[0.3em] uppercase text-black/30 font-normal text-left pr-6 last:pr-0 last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const Icon = categoryIcons[product.category] ?? Flame;
                    const isEditing = editingId === product.id;
                    return (
                      <tr key={product.id} className="border-b border-black/5 group">
                        <td className="py-4 pr-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#fafafa] flex items-center justify-center shrink-0">
                              <Icon size={14} className="opacity-30" strokeWidth={1.5} />
                            </div>
                            {isEditing ? (
                              <input
                                value={editValues.name ?? product.name}
                                onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                className="border-b border-black/20 bg-transparent focus:border-black focus:outline-none text-sm py-0.5 w-40 md:w-52"
                                autoFocus
                              />
                            ) : (
                              <span className="text-sm tracking-wide leading-tight">{product.name}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 pr-6">
                          <span className="text-xs text-black/40 tracking-wide">
                            {categoryLabels[product.category] ?? product.category}
                          </span>
                        </td>
                        <td className="py-4 pr-6">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-black/40">$</span>
                              <input
                                type="number"
                                value={editValues.price ?? product.price}
                                onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                                className="w-16 border-b border-black/20 bg-transparent focus:border-black focus:outline-none text-sm py-0.5"
                              />
                            </div>
                          ) : (
                            <span className="text-sm tracking-wide">${product.price}</span>
                          )}
                        </td>
                        <td className="py-4 pr-6">
                          <button
                            onClick={() => toggleStatus(product)}
                            className={`px-2.5 py-1 text-[10px] tracking-widest uppercase rounded-sm transition-colors ${statusStyle[product.status]}`}
                          >
                            {product.status}
                          </button>
                        </td>
                        <td className="py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center gap-3 justify-end">
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="text-xs tracking-wide text-black hover:opacity-60 transition-opacity disabled:opacity-40"
                              >
                                {saving ? t('admin.table.saving') : t('admin.table.save')}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-xs tracking-wide text-black/30 hover:text-black/60 transition-colors"
                              >
                                {t('admin.table.cancel')}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(product)}
                              className="text-xs tracking-wide text-black/25 hover:text-black/60 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              {t('admin.table.edit')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Orders ── */}
        {tab === 'orders' && (
          <div className="overflow-x-auto -mx-6 md:mx-0 px-6 md:px-0">
            {orders.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm tracking-wide text-black/30">{t('admin.table.noOrders')}</p>
              </div>
            ) : (
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-black/8">
                    {['#', 'Producto', 'Precio', 'Estado'].map((h) => (
                      <th key={h} className="pb-3 text-[10px] tracking-[0.3em] uppercase text-black/30 font-normal text-left pr-6 last:pr-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((item, i) => (
                    <tr key={i} className="border-b border-black/5">
                      <td className="py-4 pr-6 text-xs text-black/25 tracking-widest">
                        #{String(i + 1).padStart(3, '0')}
                      </td>
                      <td className="py-4 pr-6 text-sm tracking-wide">{item.product.name}</td>
                      <td className="py-4 pr-6 text-sm tracking-wide">
                        {settings.currency} {item.product.price}
                      </td>
                      <td className="py-4">
                        <span className="px-2.5 py-1 text-[10px] tracking-widest uppercase bg-amber-50 text-amber-700 rounded-sm">
                          {t('admin.table.pendingWA')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black">
                    <td colSpan={2} className="pt-5 text-xs tracking-[0.3em] uppercase text-black/40">{t('admin.table.total')}</td>
                    <td className="pt-5 text-sm font-medium">{settings.currency} {total}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Config ── */}
        {tab === 'config' && (
          <div className="max-w-lg space-y-8">
            <p className="text-xs tracking-wide text-black/40 leading-relaxed">{t('admin.config.description')}</p>

            {settingsFields.map(({ key, tKey, type, placeholder }) => (
              <div key={key} className="space-y-2">
                <label className="block text-[10px] tracking-[0.3em] uppercase text-black/40">
                  {t(tKey)}
                </label>
                <input
                  type={type}
                  value={localSettings[key]}
                  placeholder={placeholder}
                  onChange={(e) =>
                    updateLocal({ [key]: type === 'number' ? Number(e.target.value) : e.target.value })
                  }
                  className="w-full py-3 bg-transparent border-b border-black/15 focus:border-black focus:outline-none text-sm tracking-wide transition-colors placeholder:text-black/20"
                />
              </div>
            ))}

            <button
              onClick={saveSettings}
              disabled={!settingsDirty || savingSettings}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white text-[11px] tracking-[0.25em] uppercase hover:bg-black/80 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <Save size={13} />
              {savingSettings ? t('admin.config.saving') : t('admin.config.save')}
            </button>

            {localSettings.whatsapp && (
              <div className="border border-black/8 p-4 space-y-1">
                <p className="text-[10px] tracking-[0.3em] uppercase text-black/30">
                  {t('admin.config.checkoutPreview')}
                </p>
                <p className="text-xs text-black/50 font-mono break-all">
                  wa.me/{localSettings.whatsapp.replace(/\D/g, '')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
