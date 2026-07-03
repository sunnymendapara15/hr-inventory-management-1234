using HrInventoryManagementBackend.Data;
using HrInventoryManagementBackend.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://localhost:5120");

builder.Services.AddDbContext<InventoryContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("InventoryDatabase") ?? "Data Source=inventory.db"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://localhost:4173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<InventoryContext>();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowLocalhost");

app.MapGet("/", () => Results.Redirect("/inventory"));

app.MapGet("/inventory", async (InventoryContext db) =>
    await db.InventoryItems.AsNoTracking().OrderByDescending(i => i.CreatedAt).ToListAsync());

app.MapGet("/inventory/{id:guid}", async (Guid id, InventoryContext db) =>
    await db.InventoryItems.FindAsync(id) is InventoryItem item ? Results.Ok(item) : Results.NotFound());

app.MapPost("/inventory", async (InventoryCreateDto dto, InventoryContext db) =>
{
    var item = new InventoryItem
    {
        Name = dto.Name,
        Description = dto.Description,
        Quantity = dto.Quantity,
        Department = dto.Department,
        SerialNumber = dto.SerialNumber,
        PurchaseDate = dto.PurchaseDate,
        Location = dto.Location,
        AssignedTo = string.IsNullOrWhiteSpace(dto.AssignedTo) ? null : dto.AssignedTo,
        CreatedAt = DateTime.UtcNow
    };

    db.InventoryItems.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/inventory/{item.Id}", item);
});

app.MapPatch("/inventory/{id:guid}/quantity", async (Guid id, InventoryQuantityUpdateDto dto, InventoryContext db) =>
{
    if (dto.Quantity < 0)
    {
        return Results.BadRequest(new { error = "Quantity must be zero or greater." });
    }

    var existing = await db.InventoryItems.FindAsync(id);
    if (existing is null)
    {
        return Results.NotFound();
    }

    existing.Quantity = dto.Quantity;
    await db.SaveChangesAsync();
    return Results.Ok(existing);
});

app.MapPut("/inventory/{id:guid}", async (Guid id, InventoryCreateDto dto, InventoryContext db) =>
{
    var existing = await db.InventoryItems.FindAsync(id);
    if (existing is null)
    {
        return Results.NotFound();
    }

    existing.Name = dto.Name;
    existing.Description = dto.Description;
    existing.Quantity = dto.Quantity;
    existing.Department = dto.Department;
    existing.SerialNumber = dto.SerialNumber;
    existing.Location = dto.Location;
    existing.AssignedTo = string.IsNullOrWhiteSpace(dto.AssignedTo) ? null : dto.AssignedTo;
    existing.PurchaseDate = dto.PurchaseDate;

    await db.SaveChangesAsync();
    return Results.Ok(existing);
});

app.Run();

record InventoryCreateDto(string Name, string Description, int Quantity, string Department, string SerialNumber, DateTime PurchaseDate, string Location, string? AssignedTo);

record InventoryQuantityUpdateDto(int Quantity);
