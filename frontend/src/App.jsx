import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5120'

const createEmptyForm = () => ({
  name: '',
  description: '',
  quantity: '1',
  department: '',
  serialNumber: '',
  location: '',
  assignedTo: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
})

function App() {
  const [inventory, setInventory] = useState([])
  const [formData, setFormData] = useState(createEmptyForm)
  const [quantityInputs, setQuantityInputs] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const summary = useMemo(() => ({
    totalItems: inventory.length,
    totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
  }), [inventory])

  const fetchInventory = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/inventory`)
      if (!response.ok) {
        throw new Error('Unable to fetch inventory data')
      }
      const data = await response.json()
      setInventory(data)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddItem = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    setStatusMessage('')

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      quantity: Number(formData.quantity) || 0,
      department: formData.department.trim(),
      serialNumber: formData.serialNumber.trim(),
      purchaseDate: formData.purchaseDate || new Date().toISOString().slice(0, 10),
      location: formData.location.trim(),
      assignedTo: formData.assignedTo.trim() || null,
    }

    try {
      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Unable to save inventory entry')
      }

      const created = await response.json()
      setInventory((prev) => [created, ...prev])
      setFormData(createEmptyForm)
      setStatusMessage('Inventory item added successfully')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleQuantityChange = (id, value) => {
    setQuantityInputs((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleQuantityUpdate = async (id) => {
    const rawValue = quantityInputs[id]
    const quantity = Number(rawValue)
    if (!Number.isFinite(quantity) || quantity < 0) {
      setErrorMessage('Quantity must be a non-negative number')
      return
    }

    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${id}/quantity`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Unable to update quantity')
      }

      const updated = await response.json()
      setInventory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setQuantityInputs((prev) => ({ ...prev, [id]: String(updated.quantity) }))
      setStatusMessage('Quantity updated')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update quantity')
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  useEffect(() => {
    setQuantityInputs((prev) => {
      const copy = { ...prev }
      inventory.forEach((item) => {
        if (copy[item.id] === undefined) {
          copy[item.id] = String(item.quantity)
        }
      })
      return copy
    })
  }, [inventory])

  const formatDate = (value) => {
    if (!value) return '—'
    try {
      const date = new Date(value)
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return value
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">HR-only inventory</p>
          <h1>Track IT assets, quantities, and assignments</h1>
          <p className="subtitle">
            Simple React UI backed by a .NET 8 minimal API storing metadata in SQLite. Add new
            assignments, monitor quantities, and keep departments accountable.
          </p>
        </div>
        <div className="hero-stats">
          <div>
            <span className="stat-label">Items cataloged</span>
            <strong>{summary.totalItems}</strong>
          </div>
          <div>
            <span className="stat-label">Total quantity</span>
            <strong>{summary.totalQuantity}</strong>
          </div>
        </div>
      </header>

      <section className="form-card">
        <div className="form-card__header">
          <div>
            <h2>Add new inventory</h2>
            <p>Populate asset details, serial number, department, and purchase metadata.</p>
          </div>
          <span className="pill">Realtime SQLite storage</span>
        </div>

        {errorMessage && <div className="flash flash--error">{errorMessage}</div>}
        {statusMessage && <div className="flash flash--success">{statusMessage}</div>}

        <form className="inventory-form" onSubmit={handleAddItem}>
          <div className="form-row">
            <label htmlFor="name">Asset name</label>
            <input
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleFormChange}
            />
          </div>
          <div className="form-row">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleFormChange}
            />
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-row">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                required
                value={formData.department}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-row">
              <label htmlFor="serialNumber">Serial / asset tag</label>
              <input
                id="serialNumber"
                name="serialNumber"
                required
                value={formData.serialNumber}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-row">
              <label htmlFor="purchaseDate">Purchase date</label>
              <input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-row">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-row">
              <label htmlFor="assignedTo">Assigned to</label>
              <input
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleFormChange}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Add to inventory'}
            </button>
          </div>
        </form>
      </section>

      <section className="inventory-card">
        <div className="inventory-card__header">
          <div>
            <h2>Current stock</h2>
            <p>Update quantities directly or reference the full catalog.</p>
          </div>
          <button onClick={fetchInventory} disabled={isLoading}>
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <div className="inventory-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Department</th>
                <th>Serial / Tag</th>
                <th>Purchase Date</th>
                <th>Location / Owner</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="muted">{item.description}</div>
                  </td>
                  <td>{item.department}</td>
                  <td>{item.serialNumber}</td>
                  <td>{formatDate(item.purchaseDate)}</td>
                  <td>
                    <div>{item.location || '—'}</div>
                    <div className="muted">{item.assignedTo || 'Unassigned'}</div>
                  </td>
                  <td className="quantity-cell">
                    <input
                      type="number"
                      min="0"
                      value={quantityInputs[item.id] ?? item.quantity}
                      onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                    />
                    <button onClick={() => handleQuantityUpdate(item.id)}>Update</button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">
                    {isLoading ? 'Loading items…' : 'No inventory added yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default App
