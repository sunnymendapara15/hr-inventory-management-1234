# HR Inventory Management System

Simple HR-managed inventory system for IT assets with a React front end and a .NET 8 minimal API backed by SQLite.

## Backend (ASP.NET Core)

1. Make sure you have [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) installed.
2. From this repository root run:
   ```bash
   cd backend
   dotnet restore
   dotnet run
   ```
3. The API listens on `http://localhost:5120` and persists data to `inventory.db` via Entity Framework Core with SQLite.

### Key endpoints

| Endpoint | Method | Description |
| --- | --- | --- |
| `/inventory` | GET | List all items (sorted by creation time). |
| `/inventory/{id}` | GET | Get a single inventory item by ID. |
| `/inventory` | POST | Add a new inventory item. Required fields: `name`, `description`, `quantity`, `department`, `serialNumber`, `purchaseDate`, `location`. Optional: `assignedTo`. |
| `/inventory/{id}/quantity` | PATCH | Update the `quantity` for an existing item. |
| `/inventory/{id}` | PUT | Replace an existing inventory item with refreshed metadata. |

Fields on `InventoryItem`:
- `Id`, `Name`, `Description`, `Quantity`, `Department`, `SerialNumber`, `PurchaseDate`, `Location`, `AssignedTo`, `CreatedAt`.

## Frontend (React + Vite)

1. Ensure Node 20+ and npm are installed.
2. Start the UI with:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. The Vite dev server runs on `http://localhost:5173` and proxies against the backend via `VITE_API_BASE_URL`.

The interface exposes:
- Inventory creation form capturing serial number, department, location, purchase date, and assignment.
- A table view of all items including in-table quantity updates that patch the backend.
- Simple summary stats for total catalog entries and total quantity on hand.

## Development Notes

- Backend migrations are not tracked here; EF Core calls `EnsureCreated()` on startup so the SQLite file is automatically created the first time the API runs.
- Frontend form inputs are wired to the same fields that the backend persists (purchase date, department, etc.) to keep HR accountability reflected in the database.
