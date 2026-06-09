import { useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { colors } from '../theme/colors';
import { settingsApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Sun, Moon } from 'lucide-react';
// const GROUPS = {
//   General: ['company_name', 'company_address', 'company_email', 'currency'],
//   Inventory: ['low_stock_threshold', 'critical_stock_threshold', 'auto_reserve_on_confirm'],
//   Shipment: ['max_pallets_per_shipment', 'shipment_number_prefix', 'packing_list_number_prefix'],
//   Notifications: ['low_stock_alerts', 'order_created_notify', 'shipment_delivered_notify'],
// };
const GROUPS = {
  General: ['company_name', 'company_address', 'company_email', 'currency'],
  Inventory: ['low_stock_threshold', 'critical_stock_threshold'],
  Shipment: ['max_pallets_per_shipment'],
  
};

const BOOLEAN_KEYS = ['auto_reserve_on_confirm'];
const NUMBER_KEYS = ['low_stock_threshold', 'critical_stock_threshold', 'max_pallets_per_shipment'];
export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [descriptions, setDescriptions] = useState({});
  const [ids, setIds] = useState({});
  const { isDark, toggle } = useTheme();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('Settings.Edit');
  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  };

  useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getAll();
      const map = {};
      const idMap = {};
      const descMap = {};  // ← shto këtë
      data.forEach(s => {
        map[s.key] = s.value;
        idMap[s.key] = s.id;
        descMap[s.key] = s.description;
      });
      setSettings(map);
      setOriginal(map);
      setIds(idMap);
      setDescriptions(descMap);  // ← shto këtë
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);

  const handleSave = async () => {
  setSaving(true);
  try {
    const changed = Object.keys(settings).filter(k => settings[k] !== original[k]);
    await Promise.all(
      changed.map(key =>
        settingsApi.update(ids[key], {
          key,
          value: settings[key],
          description: descriptions[key] ?? '',  // ← shto këtë
        })
      )
    );
    setOriginal({ ...settings });
    showFeedback('Settings saved successfully.');
  } catch (err) {
    showFeedback(err.message, false);
  } finally {
    setSaving(false);
  }
};

  const handleReset = () => {
    setSettings({ ...original });
  };

  const hasChanges = Object.keys(settings).some(k => settings[k] !== original[k]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
      Loading...
    </div>
  );

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: colors.text, fontFamily: 'var(--font-sans)' }}>
            System Settings
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>
            Configure global system parameters
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canEdit && hasChanges && (
            <button onClick={handleReset} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, border: `1px solid ${colors.border}`,
              background: 'none', cursor: 'pointer', fontSize: 13,
              fontFamily: 'var(--font-sans)', color: colors.textMuted,
            }}>
              <RotateCcw size={14} /> Reset
            </button>
          )}
          {canEdit && (
            <button onClick={handleSave} disabled={!hasChanges || saving} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: hasChanges ? colors.text : colors.border,
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontSize: 13, fontFamily: 'var(--font-sans)',
              color: hasChanges ? colors.surface : colors.textMuted,
              fontWeight: 500,
            }}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Object.entries(GROUPS).map(([group, keys]) => (
          <div key={group} style={{
            background: colors.surface, border: `1px solid ${colors.border}`,
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 20px', borderBottom: `1px solid ${colors.border}`,
              fontSize: 12, fontWeight: 500, color: colors.textMuted,
              fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {group}
            </div>
            <div style={{ padding: '8px 0' }}>
              {keys.map(key => (
                <SettingRow
                  key={key}
                  settingKey={key}
                  value={settings[key] ?? ''}
                  isBoolean={BOOLEAN_KEYS.includes(key)}
                  isNumber={NUMBER_KEYS.includes(key)}
                  changed={settings[key] !== original[key]}
                  onChange={val => setSettings(s => ({ ...s, [key]: val }))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Appearance */}
<div style={{
  background: colors.surface, border: `1px solid ${colors.border}`,
  borderRadius: 12, overflow: 'hidden',
}}>
  <div style={{
    padding: '14px 20px', borderBottom: `1px solid ${colors.border}`,
    fontSize: 12, fontWeight: 500, color: colors.textMuted,
    fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
  }}>
    Appearance
  </div>
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px',
  }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: colors.text, fontFamily: 'var(--font-sans)' }}>
        Theme
      </div>
      <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-sans)', marginTop: 2 }}>
        {isDark ? 'Dark mode is on' : 'Light mode is on'}
      </div>
    </div>
    <button onClick={toggle} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 8,
      border: `1px solid ${colors.border}`,
      background: colors.bg, color: colors.text,
      cursor: 'pointer', fontSize: 13,
      fontFamily: 'var(--font-sans)', fontWeight: 500,
    }}>
      {isDark ? <><Sun size={14} /> Light Mode</> : <><Moon size={14} /> Dark Mode</>}
    </button>
  </div>
</div>

      {feedback && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1100,
          background: feedback.ok ? colors.text : colors.danger, color: colors.surface,
          padding: '12px 18px', borderRadius: 10, fontSize: 13,
          fontFamily: 'var(--font-sans)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

function SettingRow({ settingKey, value, isBoolean, isNumber, changed, onChange }) {
  const label = settingKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px', borderBottom: `1px solid ${colors.border}`,
      background: changed ? colors.accentSoft : 'transparent',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: colors.text, fontFamily: 'var(--font-sans)' }}>
          {label}
          {changed && <span style={{ marginLeft: 8, fontSize: 11, color: colors.accent, fontFamily: 'var(--font-mono)' }}>modified</span>}
        </div>
        <div style={{ fontSize: 11, color: colors.textDim, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          {settingKey}
        </div>
      </div>

      {isBoolean ? (
        <label style={{ position: 'relative', width: 36, height: 20, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={e => onChange(e.target.checked ? 'true' : 'false')}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 999,
            background: value === 'true' ? colors.accent : colors.border,
            transition: 'background 0.2s',
          }} />
          <div style={{
            position: 'absolute', top: 2, left: value === 'true' ? 18 : 2,
            width: 16, height: 16, borderRadius: 999,
            background: 'white', transition: 'left 0.2s',
          }} />
        </label>
      ) : (
        <input
          type={isNumber ? 'number' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            padding: '6px 10px', borderRadius: 7, fontSize: 13,
            border: `1px solid ${changed ? colors.accent : colors.border}`,
            background: colors.bg, color: colors.text,
            fontFamily: 'var(--font-mono)', outline: 'none',
            width: isNumber ? 80 : 200, textAlign: isNumber ? 'right' : 'left',
          }}
        />
      )}
    </div>
  );
}