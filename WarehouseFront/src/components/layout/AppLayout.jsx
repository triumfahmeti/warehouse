import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { colors } from '../../theme/colors';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { pageTitles, defaultTitle } from './pageTitles';

export default function AppLayout() {
  const { pathname } = useLocation();
  const meta = pageTitles[pathname] || defaultTitle;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{
      '--font-sans': "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-mono': "'JetBrains Mono', 'SF Mono', Menlo, monospace",
      minHeight: '100vh', background: colors.bg, color: colors.text,
      fontFamily: 'var(--font-sans)',
      display: 'flex',
    }}>
      {/* Overlay për mbyllje të sidebar-it në mobile */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main style={{ flex: 1, minWidth: 0 }}>
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />
        <Outlet />
      </main>
    </div>
  );
}
