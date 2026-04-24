import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Settings, User, Calendar, Wallet, Bell, Trash2, RotateCcw, LogOut,
  Save, AlertCircle, Check, Loader2, Shield, X, ChevronRight, Clock, Eye, EyeOff
} from 'lucide-react';

// ============ SETTINGS PAGE ============
export default function SettingsPage({ data, updateData, showToast }) {
  const [section, setSection] = useState('profile');
  const { user, signOut, updatePassword } = useAuth();

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'wedding', label: 'Wedding Settings', icon: Calendar },
    { id: 'trash', label: 'Trash Bin', icon: Trash2 },
    { id: 'account', label: 'Account & Security', icon: Shield },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold" style={{ color: '#8B1A3A' }}>
          Settings
        </h2>
        <p className="text-sm font-body" style={{ color: '#6B5050' }}>
          Manage your profile, preferences, and data
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {sections.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium font-body whitespace-nowrap transition-all"
              style={{
                background: active ? '#8B1A3A' : 'white',
                color: active ? 'white' : '#2B1810',
                border: `1px solid ${active ? '#8B1A3A' : 'rgba(201, 169, 97, 0.3)'}`,
              }}>
              <Icon size={14} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <div className="fade-up">
        {section === 'profile' && <ProfileSection user={user} showToast={showToast} />}
        {section === 'wedding' && <WeddingSection data={data} updateData={updateData} showToast={showToast} />}
        {section === 'trash' && <TrashSection user={user} data={data} updateData={updateData} showToast={showToast} />}
        {section === 'account' && <AccountSection user={user} signOut={signOut} updatePassword={updatePassword} showToast={showToast} />}
      </div>
    </div>
  );
}

// ============ PROFILE SECTION ============
function ProfileSection({ user, showToast }) {
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setDisplayName(data.display_name || '');
        });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      showToast('Update failed: ' + error.message, 'error');
    } else {
      showToast('Profile updated!');
    }
  };

  return (
    <div className="rounded-2xl p-5 gold-border card-shadow" style={{ background: 'white' }}>
      <h3 className="font-display text-xl font-semibold mb-4" style={{ color: '#8B1A3A' }}>
        Profile Info
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold font-body mb-1 uppercase tracking-wider" style={{ color: '#6B5050' }}>
            Email (read-only)
          </label>
          <input
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2.5 rounded-lg gold-border text-sm font-body opacity-60"
            style={{ background: '#F5F0E8' }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold font-body mb-1 uppercase tracking-wider" style={{ color: '#6B5050' }}>
            Display Name
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Priya & Rohan"
            className="w-full px-3 py-2.5 rounded-lg gold-border text-sm font-body"
            style={{ background: 'white' }}
          />
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2.5 rounded-lg text-white font-semibold text-sm font-body flex items-center gap-2"
          style={{ background: saving ? '#6B5050' : '#8B1A3A' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Profile
        </button>
      </div>
    </div>
  );
}

// ============ WEDDING SETTINGS ============
function WeddingSection({ data, updateData, showToast }) {
  const [form, setForm] = useState(data.settings);

  const save = () => {
    updateData(d => ({
      ...d,
      settings: { ...d.settings, ...form, totalBudget: Number(form.totalBudget) || 0 }
    }));
    showToast('Settings saved!');
  };

  return (
    <div className="rounded-2xl p-5 gold-border card-shadow" style={{ background: 'white' }}>
      <h3 className="font-display text-xl font-semibold mb-4" style={{ color: '#8B1A3A' }}>
        Wedding Details
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold font-body mb-1 uppercase tracking-wider" style={{ color: '#6B5050' }}>
            Couple Name
          </label>
          <input value={form.coupleName || ''} onChange={e => setForm({ ...form, coupleName: e.target.value })}
            placeholder="Priya & Rohan"
            className="w-full px-3 py-2.5 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold font-body mb-1 uppercase tracking-wider" style={{ color: '#6B5050' }}>
              Wedding Date
            </label>
            <input type="date" value={form.weddingDate || ''} onChange={e => setForm({ ...form, weddingDate: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold font-body mb-1 uppercase tracking-wider" style={{ color: '#6B5050' }}>
              Total Budget (₹)
            </label>
            <input type="number" value={form.totalBudget || ''} onChange={e => setForm({ ...form, totalBudget: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg gold-border text-sm font-body" style={{ background: 'white' }} />
          </div>
        </div>
        <button onClick={save}
          className="px-4 py-2.5 rounded-lg text-white font-semibold text-sm font-body flex items-center gap-2"
          style={{ background: '#8B1A3A' }}>
          <Save size={14} /> Save Settings
        </button>
      </div>
    </div>
  );
}

// ============ TRASH BIN ============
function TrashSection({ user, data, updateData, showToast }) {
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTrash = async () => {
    if (!user) return;
    setLoading(true);
    const { data: items, error } = await supabase
      .from('deleted_items')
      .select('*')
      .eq('user_id', user.id)
      .order('deleted_at', { ascending: false });
    if (!error && items) setTrashItems(items);
    setLoading(false);
  };

  useEffect(() => { loadTrash(); }, [user]);

  const restore = async (item) => {
    // Add back to main data
    const typeMap = {
      'expense': 'expenses',
      'shagun': 'shagun',
      'lena': 'lena',
      'dena': 'dena',
      'vendor': 'vendors',
      'guest': 'guests'
    };
    const key = typeMap[item.item_type];
    if (key) {
      updateData(d => ({
        ...d,
        [key]: [...(d[key] || []), item.item_data]
      }));
    }

    // Remove from trash
    await supabase.from('deleted_items').delete().eq('id', item.id);
    showToast(`${item.item_type} restored!`);
    loadTrash();
  };

  const permanentDelete = async (item) => {
    if (!confirm('Permanently delete? Ye wapas nahi aayega!')) return;
    await supabase.from('deleted_items').delete().eq('id', item.id);
    showToast('Permanently deleted');
    loadTrash();
  };

  const clearAllTrash = async () => {
    if (!confirm('Saara trash clear karna hai? Kuch bhi recover nahi hoga!')) return;
    await supabase.from('deleted_items').delete().eq('user_id', user.id);
    showToast('Trash cleared');
    setTrashItems([]);
  };

  const typeLabels = {
    expense: { label: 'Kharcha', color: '#8B1A3A', emoji: '💸' },
    shagun: { label: 'Shagun', color: '#C9A961', emoji: '🎁' },
    lena: { label: 'Lena', color: '#4A7C59', emoji: '📥' },
    dena: { label: 'Dena', color: '#C43E3E', emoji: '📤' },
    vendor: { label: 'Vendor', color: '#6B5050', emoji: '🏪' },
    guest: { label: 'Guest', color: '#5B7FA6', emoji: '👤' },
  };

  return (
    <div className="rounded-2xl p-5 gold-border card-shadow" style={{ background: 'white' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-xl font-semibold" style={{ color: '#8B1A3A' }}>
            Trash Bin
          </h3>
          <p className="text-xs font-body mt-0.5" style={{ color: '#6B5050' }}>
            Recently deleted items — restore or delete permanently
          </p>
        </div>
        {trashItems.length > 0 && (
          <button onClick={clearAllTrash}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold font-body flex items-center gap-1"
            style={{ background: 'rgba(196, 62, 62, 0.1)', color: '#C43E3E' }}>
            <Trash2 size={12} /> Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: '#8B1A3A' }} />
          <p className="text-sm font-body mt-2" style={{ color: '#6B5050' }}>Loading...</p>
        </div>
      ) : trashItems.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 size={40} className="mx-auto mb-3 opacity-30" style={{ color: '#C9A961' }} />
          <p className="text-sm font-body" style={{ color: '#6B5050' }}>Trash empty hai — koi deleted item nahi!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trashItems.map((item) => {
            const meta = typeLabels[item.item_type] || { label: item.item_type, color: '#696969', emoji: '📄' };
            const itemData = item.item_data || {};
            const name = itemData.description || itemData.giverName || itemData.person || itemData.name || itemData.guestName || 'Unnamed';
            const amount = itemData.amount ? `₹${Number(itemData.amount).toLocaleString('en-IN')}` : '';
            const deletedDate = new Date(item.deleted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                   style={{ background: 'rgba(253, 248, 238, 0.8)', border: '1px solid rgba(201, 169, 97, 0.15)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                     style={{ background: `${meta.color}15` }}>
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold font-body"
                          style={{ background: `${meta.color}15`, color: meta.color }}>
                      {meta.label}
                    </span>
                    <p className="text-sm font-semibold font-body truncate" style={{ color: '#2B1810' }}>{name}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {amount && <span className="text-xs font-body font-semibold" style={{ color: meta.color }}>{amount}</span>}
                    <span className="text-[10px] font-body flex items-center gap-1" style={{ color: '#6B5050' }}>
                      <Clock size={10} /> {deletedDate}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => restore(item)} title="Restore"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(74, 124, 89, 0.1)' }}>
                    <RotateCcw size={14} style={{ color: '#4A7C59' }} />
                  </button>
                  <button onClick={() => permanentDelete(item)} title="Delete Permanently"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(196, 62, 62, 0.1)' }}>
                    <X size={14} style={{ color: '#C43E3E' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ ACCOUNT & SECURITY ============
function AccountSection({ user, signOut, updatePassword, showToast }) {
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (newPw.length < 8) {
      showToast('Password minimum 8 characters!', 'error');
      return;
    }
    setSaving(true);
    const { error } = await updatePassword(newPw);
    setSaving(false);
    if (error) {
      showToast('Error: ' + error.message, 'error');
    } else {
      showToast('Password changed!');
      setNewPw('');
    }
  };

  const handleLogout = async () => {
    if (confirm('Logout karna hai?')) {
      await signOut();
    }
  };

  return (
    <div className="space-y-4">
      {/* Change Password */}
      <div className="rounded-2xl p-5 gold-border card-shadow" style={{ background: 'white' }}>
        <h3 className="font-display text-xl font-semibold mb-4" style={{ color: '#8B1A3A' }}>
          Change Password
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold font-body mb-1 uppercase tracking-wider" style={{ color: '#6B5050' }}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-3 pr-10 py-2.5 rounded-lg gold-border text-sm font-body"
                style={{ background: 'white' }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5050' }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button onClick={handleChangePassword} disabled={saving || !newPw}
            className="px-4 py-2.5 rounded-lg text-white font-semibold text-sm font-body flex items-center gap-2"
            style={{ background: saving ? '#6B5050' : '#8B1A3A', opacity: !newPw ? 0.5 : 1 }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
            Update Password
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl p-5 gold-border card-shadow" style={{ background: 'white' }}>
        <h3 className="font-display text-xl font-semibold mb-3" style={{ color: '#8B1A3A' }}>
          Account Info
        </h3>
        <div className="space-y-2 text-sm font-body" style={{ color: '#6B5050' }}>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'rgba(201, 169, 97, 0.2)' }}>
            <span>Email</span>
            <span className="font-semibold" style={{ color: '#2B1810' }}>{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'rgba(201, 169, 97, 0.2)' }}>
            <span>Member since</span>
            <span className="font-semibold" style={{ color: '#2B1810' }}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full py-3 rounded-xl text-sm font-semibold font-body flex items-center justify-center gap-2"
        style={{ background: 'rgba(196, 62, 62, 0.1)', color: '#C43E3E', border: '1px solid rgba(196, 62, 62, 0.2)' }}>
        <LogOut size={16} /> Logout
      </button>
    </div>
  );
}
