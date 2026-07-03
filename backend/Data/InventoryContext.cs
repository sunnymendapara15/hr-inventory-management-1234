using HrInventoryManagementBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace HrInventoryManagementBackend.Data;

public class InventoryContext : DbContext
{
    public InventoryContext(DbContextOptions<InventoryContext> options)
        : base(options)
    {
    }

    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
}
