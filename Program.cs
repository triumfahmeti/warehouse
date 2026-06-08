using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Warehouse;
using Warehouse.Models;
using Warehouse.Repositories.Implementations;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Implementations;
using Warehouse.Services.Interfaces;
using Warehouse.Hubs;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using MongoDB.Driver;
using Microsoft.AspNetCore.Http.Features;

// Ngarko .env (nga rrënja e projektit) në environment variables PARA se të ndërtohet
// konfigurimi. .NET-i (AddEnvironmentVariables, default) i lexon dhe override-on
// appsettings. Variablat përdorin konventën hierarkike me '__' (p.sh.
// JwtSettings__SecretKey → JwtSettings:SecretKey). Sekretet/connection strings rrinë
// vetëm te .env (i gitignore-uar), jo te appsettings.
DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(option =>
{
    option.CustomSchemaIds(type => type.FullName!.Replace("+", ".", StringComparison.Ordinal));
    option.SwaggerDoc("v1", new OpenApiInfo { Title = "Warehouse API", Version = "v1" });
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Enter token in format: Bearer {token}",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[]{}
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
                 .AllowCredentials();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration["MongoDb:ConnectionString"];
    return new MongoClient(connectionString);
});

builder.Services.AddSingleton(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(configuration["MongoDb:DatabaseName"]);
});

var mongoClient = new MongoClient(builder.Configuration["MongoDb:ConnectionString"]);
try
{
    var databases = mongoClient.ListDatabaseNames().ToList();
    Console.WriteLine("MongoDB Connected!");
}
catch (Exception ex)
{
    Console.WriteLine("Mongo Error:");
    Console.WriteLine(ex.Message);
}

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException("Missing configuration: JwtSettings:SecretKey");
var issuer = jwtSettings["Issuer"]
    ?? throw new InvalidOperationException("Missing configuration: JwtSettings:Issuer");
var audience = jwtSettings["Audience"]
    ?? throw new InvalidOperationException("Missing configuration: JwtSettings:Audience");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

// Autorizimi i bazuar në leje: policy provider që zgjidh policy-t "PERMISSION_*" dhe
// handler-i që kontrollon claim-in "permission" te JWT-ja (shih [HasPermission]).
builder.Services.AddAuthorization();
builder.Services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationPolicyProvider, Warehouse.Authorization.PermissionPolicyProvider>();
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, Warehouse.Authorization.PermissionAuthorizationHandler>();

builder.Services.AddScoped<IExportImportService, ExportImportService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IWarehouseRepository, WarehouseRepository>();
builder.Services.AddScoped<IWarehouseService, WarehouseService>();
builder.Services.AddScoped<IRaftRepository, RaftRepository>();
builder.Services.AddScoped<IRaftService, RaftService>();
builder.Services.AddScoped<ISalesOrderRepository, SalesOrderRepository>();
builder.Services.AddScoped<ISalesOrderService, SalesOrderService>();
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IPurchaseOrderRepository, PurchaseOrderRepository>();
builder.Services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IFileRepository, FileRepository>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<ISettingRepository, SettingRepository>();
builder.Services.AddScoped<ISettingService, SettingService>();
builder.Services.AddScoped<IPalletRepository, PalletRepository>();
builder.Services.AddScoped<IPalletItemRepository, PalletItemRepository>();
builder.Services.AddScoped<IPackingListRepository, PackingListRepository>();
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDb"));
builder.Services.AddSingleton<INotificationService, NotificationService>();
builder.Services.AddSingleton<IRealtimeNotifier, RealtimeNotifier>();
builder.Services.AddScoped<IPalletService, PalletService>();
builder.Services.AddScoped<IPalletItemService, PalletItemService>();
builder.Services.AddScoped<IPackingListService, PackingListService>();
builder.Services.AddScoped<IShipmentRepository, ShipmentRepository>();
builder.Services.AddScoped<IShipmentService, ShipmentService>();
builder.Services.AddScoped<IReportService, ReportService>();


builder.Services.AddSignalR();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

// Trajtuesi global i gabimeve — herët në pipeline që të kapë gabimet e endpoint-eve
// dhe t'i kthejë si { message } miqësore (p.sh. guard-et e pallet/packing list/shipment).
app.UseMiddleware<Warehouse.Middleware.ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Smis API v1");
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapHub<NotificationHub>("/notificationHub");
app.MapControllers();

// Seed i plotë: migrime + leje + role (përfshirë Worker) + caktime leje/rol + admin.
// Pa këtë, lejet e reja s'do mbilleshin dhe çdo endpoint i mbrojtur do jepte 403.
using (var scope = app.Services.CreateScope())
{
    await Warehouse.Data.DataSeeder.SeedAsync(scope.ServiceProvider);
}

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var defaultSettings = new List<(string Key, string Value, string Description)>
    {
        // General
        ("company_name", "Warehouse Co.", "Company name"),
        ("company_address", "Prishtine, Kosovo", "Company address"),
        ("company_email", "info@warehouse.com", "Company email"),
        ("currency", "EUR", "Default currency"),

        // Inventory
        ("low_stock_threshold", "10", "Notify when stock falls below this value"),
        ("critical_stock_threshold", "5", "Critical stock alert threshold"),
        ("auto_reserve_on_confirm", "true", "Automatically reserve stock when order is confirmed"),

        // Shipment
        ("max_pallets_per_shipment", "20", "Maximum pallets allowed per shipment"),
        ("shipment_number_prefix", "SHP", "Prefix for shipment numbers"),
        ("packing_list_number_prefix", "PL", "Prefix for packing list numbers"),

        // Notifications
        ("low_stock_alerts", "true", "Enable low stock notifications"),
        ("order_created_notify", "true", "Notify when order is created"),
        ("shipment_delivered_notify", "true", "Notify when shipment is delivered"),
    };

    foreach (var (key, value, description) in defaultSettings)
    {
        if (!context.Settings.Any(s => s.Key == key))
        {
            context.Settings.Add(new Setting
            {
                Key = key,
                Value = value,
                Description = description,
                UpdatedAt = DateTime.UtcNow
            });
        }
    }
    await context.SaveChangesAsync();
}

app.Run();