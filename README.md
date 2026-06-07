# Warehouse Management System (WMS)

Aplikacion full-stack për menaxhimin e proceseve të magazinës — produkte, inventar, porosi, dërgesa, paleta dhe rafte, me njoftime në kohë reale.

**Repository:** https://github.com/triumfahmeti/warehouse

---

## 6.1 Përshkrimi i Projektit

**Warehouse Management System** është një aplikacion web i zhvilluar për automatizimin e proceseve të magazinimit. Sistemi mundëson:

- Menaxhimin e produkteve, furnitorëve dhe klientëve
- Kontrollin e stokut dhe inventarit në rafte (rafs)
- Procesin e plotë të porosive: Blerje → Shitje → Paleta → Packing List → Dërgesë
- Gjurmimin e aktiviteteve përmes Audit Log
- Njoftime live për ngjarje të rëndësishme (SignalR + MongoDB)

**Qëllimi kryesor:** përmirësimi i kontrollit të stokut, reduktimi i gabimeve manuale dhe ofrimi i një paneli të centralizuar për administratorët, menaxherët dhe klientët.

---

## 6.2 Teknologjitë e Përdorura

| Shtresa | Teknologji |
|---------|------------|
| **Frontend** | React 19, Vite 8, React Router 7, Tailwind CSS 4, SignalR Client |
| **Backend** | ASP.NET Core 9 Web API, Entity Framework Core 9, ASP.NET Identity, JWT, SignalR |
| **DB SQL** | Microsoft SQL Server |
| **DB NoSQL** | MongoDB (njoftimet) |
| **Mjete** | Visual Studio / VS Code, Git & GitHub, Swagger/OpenAPI |

Stack-i përputhet me **Microsoft Stack** (Lab Course 2 — Kombinimi #4).

---

## 6.3 Arkitektura e Sistemit

Aplikacioni ndjek **Layered Architecture**:

```
Frontend (React)  →  HTTP/SignalR  →  Backend (ASP.NET Core)
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              Controllers            Services              Repositories
              (HTTP, DTO)         (Business Logic)         (Data Access)
                    │                     │                     │
                    └─────────────────────┴─────────────────────┘
                                          │
                              ┌───────────┴───────────┐
                              ▼                       ▼
                        SQL Server               MongoDB
```

| Shtresë | Përshkrim | Lokacioni |
|---------|-----------|-----------|
| **Controllers** | Pranojnë kërkesat HTTP, kthejnë përgjigje | `Controllers/` |
| **Services** | Logjika e biznesit dhe validimet | `Services/Implementations/` |
| **Repositories** | Komunikimi me databazën (CRUD) | `Repositories/Implementations/` |
| **DTOs** | Transferimi i të dhënave ndërmjet shtresave | `DTOs/` |
| **Models** | Entitetet e domenit | `Models/` |

---

## 6.4 Siguria e Sistemit

| Mekanizëm | Implementimi |
|-----------|--------------|
| **Autentifikimi** | JWT access token (15 min) + refresh token (7 ditë) |
| **Autorizimi** | Role-based: `Admin`, `Manager`, `Client` |
| **Password hashing** | ASP.NET Identity (kurrë plain text) |
| **Validimi** | Validime në Services; EF Core mbrojtje nga SQL Injection |
| **CORS** | Vetëm `http://localhost:5173` (frontend) |
| **Permissions** | Entitetet `Permission` / `RolePermission` (fine-grained) |

**Përdoruesi default (krijohet në nisjen e parë):**

| Email | Password | Rol |
|-------|----------|-----|
| `admin@warehouse.com` | `Admin123!` | Admin |

---

## 6.5 Funksionalitetet Kryesore

| Modul | Përshkrim |
|-------|-----------|
| Përdorues & Role | Regjistrim, login, menaxhim përdoruesish, caktim rolesh |
| Magazina & Rafte | CRUD për warehouses dhe storage rafts |
| Produkte | CRUD, kërkim sipas SKU |
| Inventar | Shtim/heqje stoku, transfer, rezervim, cycle count |
| Furnitorë & Klientë | CRUD, import CSV |
| Porosi Blerjeje | Krijim, pranim stoku, anulim |
| Porosi Shitjeje | Krijim (Client), çmime, konfirmim, anulim |
| Paleta & Packing List | Krijim paletash nga porosi, packing lists |
| Dërgesa | Lifecycle: Ready → Shipped → Delivered |
| Audit Log | Gjurmim i veprimeve kritike |
| Njoftime | Real-time përmes SignalR + MongoDB |
| Settings | Konfigurime globale të sistemit |
| Raporte | Inventory, sales orders, shipments (JSON/CSV/Excel) |
| Export/Import | CSV, Excel, JSON për lista të ndryshme |

---

## 6.6 Komunikimi në Kohë Reale

Përdoret **SignalR** (`/notificationHub`):

- Njoftime live për porosi të reja, ndryshime statusi, dërgesa
- Përditësim automatik i tabelave në frontend (`ResourceChanged` event)
- Sinkronizim pa rifreskuar faqen

**Frontend:** `WarehouseFront/src/realtime/RealtimeContext.jsx`

---

## 6.7 API Dokumentimi

Swagger është i disponueshëm kur backend-i është duke u ekzekutuar:

**URL:** http://localhost:5138/swagger

### Controller-at kryesorë

| Controller | Rruga | Funksioni |
|------------|-------|-----------|
| `AuthController` | `/api/auth` | Login, register, refresh, logout |
| `WarehousesController` | `/api/warehouses` | Magazina |
| `RaftsController` | `/api/rafts` | Rafte |
| `ProductController` | `/api/product` | Produkte |
| `InventoryController` | `/api/inventory` | Stoku |
| `SalesOrderController` | `/api/salesorder` | Porosi shitjeje |
| `PurchaseOrdersController` | `/api/purchaseorders` | Porosi blerjeje |
| `ShipmentController` | `/api/shipment` | Dërgesa |
| `NotificationController` | `/api/notification` | Njoftime |
| `ReportController` | `/api/report` | Raporte |
| `ExportImportController` | `/api/exportimport` | Export/Import |

---

## 6.8 Menaxhimi i Versioneve

- **Git & GitHub:** https://github.com/triumfahmeti/warehouse
- Çdo anëtar kontribuon me commits individuale
- Integrimi bëhet përmes Pull Request-eve në degën `main`
- Profesori i ftuar: `elton.boshnjaku@ubt-uni.net`

---

## Database Diagram

Diagrami i plotë ERD: **[docs/DATABASE.md](docs/DATABASE.md)**

**SQL Server:** 29 tabela (10 të detyrueshme + 19 të domenit)  
**MongoDB:** koleksioni `Notifications`

---

## Kërkesat e Instalimit

| Softuer | Versioni |
|---------|----------|
| .NET SDK | 9.0+ |
| Node.js | 20.19+ (rekomandohet) |
| SQL Server | Local ose remote |
| MongoDB | Atlas ose lokal |
| Git | Çdo version i fundit |

---

## Konfigurimi

### Backend — `appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=warehouse;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "WarehouseAPI",
    "Audience": "WarehouseAPIUsers"
  },
  "MongoDb": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "warehouse_notifications",
    "NotificationsCollectionName": "Notifications"
  }
}
```

### Frontend — `WarehouseFront/.env` (opsionale)

```env
VITE_API_BASE=http://localhost:5138/api
```

---

## Ekzekutimi i Projektit

```powershell
# 1. Databaza
dotnet ef database update

# 2. Backend
dotnet run
# → http://localhost:5138/swagger

# 3. Frontend
cd WarehouseFront
npm install
npm run dev
# → http://localhost:5173
```

**Login:** `admin@warehouse.com` / `Admin123!`

---

## Additional Features (Lab Course 2)

| # | Feature | Status |
|---|---------|--------|
| 1 | Advanced Search — filtra në 10+ lista | ✅ |
| 4 | Data Export/Import — CSV, Excel, JSON | ✅ |
| 5 | Dynamic Report Generation | ✅ |

---

## Ekipi

| Anëtari | GitHub |
|---------|--------|
| Viola Olloni | Violaollonii |
| Triumf Ahmeti | triumfahmeti |
| Era Hema | erahema70368 |
| Donjeta Jashari | donjetajashari05 |
| Lina Demiri | linademiri |
| Andi Gashi | — |

---

## Licenca

Projekt akademik — UBT, Lab Course 2, Viti Akademik 2025/2026.
