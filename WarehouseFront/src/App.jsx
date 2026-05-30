import { AuthProvider } from './auth/AuthContext';
import AppRoutes from './routes/AppRoutes';

// AuthProvider mbështjell gjithçka që useAuth() të jetë i disponueshëm
// kudo (LoginPage, ProtectedRoute, Topbar, etj.).
export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </>
  );
}
