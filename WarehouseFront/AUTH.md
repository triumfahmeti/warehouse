# Autentifikimi — si funksionon

## File-at e shtuar

```
src/auth/
├── tokenStorage.js     ← lexon/shkruan token-et në localStorage (vendi i vetëm)
├── AuthContext.jsx     ← state global: user, login(), logout(), isAuthenticated
└── ProtectedRoute.jsx  ← mbron route-et, ridrejton te /login

src/pages/
└── LoginPage.jsx       ← faqja /login
```

Plus ndryshime te: `api/client.js` (auto-refresh), `api/index.js` (authApi),
`routes/AppRoutes.jsx` (login + protection), `App.jsx` (AuthProvider),
`components/layout/Topbar.jsx` (user real + logout).

## Rrjedha e login

1. User-i shkruan email/password te `/login`
2. `useAuth().login()` thërret `POST /auth/login`
3. Backend kthen `AuthResponseDto` (accessToken, refreshToken, email, userId, roles)
4. Ruhen te localStorage dhe te state-i global
5. Redirect te faqja ku donte të shkonte (ose `/`)

## Auto-refresh (transparent)

Te `api/client.js`, kur një request kthen **401**:

1. Provohet `POST /auth/refresh-token` me refresh token-in
2. Nëse del mirë → ruhet access token-i i ri → **request-i origjinal përsëritet**
3. Nëse dështon → pastrohet sesioni → hidhet `AuthError` → redirect te /login

Nëse disa requests dështojnë njëkohësisht, bëhet **vetëm një** refresh
(falë `refreshPromise`), jo disa paralele.

## Route protection

Te `AppRoutes.jsx`, çdo route përveç `/login` është brenda `<ProtectedRoute>`.
Pa token → `<Navigate to="/login">`. Ruhet edhe destinacioni origjinal që
pas login-it user-i kthehet aty ku donte.

## Çfarë pret nga backend-i

Sigurohu që këto endpoints ekzistojnë dhe kthejnë formatin e duhur:

| Endpoint | Body | Përgjigje |
|----------|------|-----------|
| `POST /auth/login` | `{ email, password }` | `AuthResponseDto` |
| `POST /auth/refresh-token` | `{ refreshToken }` | `AuthResponseDto` |
| `POST /auth/logout` | `{ refreshToken }` | bool / 200 |

`AuthResponseDto` duhet të ketë: `accessToken`, `refreshToken`, `email`,
`userId`, `roles`.

## CORS

Te `Program.cs` lejo origin-in e front-it:

```csharp
policy.WithOrigins("http://localhost:5173")
      .AllowAnyHeader()
      .AllowAnyMethod();
```

## Test i shpejtë

1. `npm install && npm run dev`
2. Hap `http://localhost:5173` → duhet të ridrejtojë te `/login`
3. Login me admin-in default (nga seeding: admin@warehouse.com)
4. Pas login → Dashboard; avatari lart djathtas tregon email + role + Log out
5. Provo refresh të faqes → mbetesh i loguar (token në localStorage)
