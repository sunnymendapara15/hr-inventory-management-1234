namespace HrInventoryManagementBackend.Models;

public class InventoryItem
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public required string Department { get; set; }
    public required string SerialNumber { get; set; }
    public DateTime PurchaseDate { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? AssignedTo { get; set; }
    public DateTime CreatedAt { get; set; }
}
