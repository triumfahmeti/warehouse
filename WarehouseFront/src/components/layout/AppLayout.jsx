import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { colors } from '../../theme/colors';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { pageTitles, defaultTitle } from './pageTitles';
import { RealtimeProvider } from '../../realtime/RealtimeContext';
import { settingsApi } from '../../api';

export default function AppLayout() {
  const { pathname } = useLocation();
  const meta = pageTitles[pathname] || defaultTitle;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Warehouse OS');

  useEffect(() => {
    settingsApi.getAll()
      .then(data => {
        const s = data.find(s => s.key === 'company_name');
        if (s?.value) setCompanyName(s.value);
      })
      .catch(() => {});
  }, []);

  return (
    <RealtimeProvider>
      <div style={{
        '--font-sans': "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
        '--font-mono': "'JetBrains Mono', 'SF Mono', Menlo, monospace",
        minHeight: '100vh',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
      }}>
        <div
          className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} companyName={companyName} />

        <main style={{ flex: 1, minWidth: 0 }}>
          <Topbar
            title={meta.title}
            subtitle={meta.subtitle}
            onMenuToggle={() => setSidebarOpen(o => !o)}
          />
          <Outlet />
        </main>
      </div>
    </RealtimeProvider>
  );
}