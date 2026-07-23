/**
 * Admin Frontend - Login Page Integration Example
 * 
 * Shows how to use the adminAPI to authenticate
 */

import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/adminAPI'
import { useAdminData } from '@/hooks/useAdminData'

export function LoginExample() {
  const [email, setEmail] = useState('admin@puli.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { handleLogin, isLoggedIn } = useAdminData({ autoLoad: false })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await handleLogin(email, password)
      if (success) {
        // Redirect to dashboard or load data
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (isLoggedIn) {
    return <div>Already logged in!</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  )
}

/**
 * Example: Load all menu data into the store
 */
export function DashboardExample() {
  const { loading, error, loadAllData, isLoggedIn } = useAdminData()

  useEffect(() => {
    if (isLoggedIn && !loading) {
      loadAllData()
    }
  }, [isLoggedIn])

  if (loading) return <div>Loading menu data...</div>
  if (error) return <div>Error: {error}</div>
  if (!isLoggedIn) return <div>Not logged in</div>

  return <div>Menu data loaded! Check your store for data.</div>
}

/**
 * Example: Create a new menu item
 */
export function CreateMenuItemExample() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name || !price) {
      setError('Please fill all fields')
      return
    }

    setLoading(true)
    try {
      await adminAPI.createMenuItem({
        name_en: name,
        name_ar: name,
        description_en: 'Description',
        description_ar: 'الوصف',
        price,
        category_id: 'some-category-id',
        subcategory_id: null,
        classification_id: 'some-classification-id',
        country_id: null,
        image: '',
        visible: true,
        order: 0,
        calories: 0,
        allergens: [],
        tags: [],
        chef_special: false,
        popular: false,
        recommended: false,
        available_from: '10:00',
        available_to: '22:00',
        available_days: [0, 1, 2, 3, 4, 5, 6], // 0=Sunday through 6=Saturday
      })

      setName('')
      setPrice(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name"
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        placeholder="Price"
      />
      <button onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating...' : 'Create Item'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

/**
 * Example: Update a menu item
 */
export function UpdateMenuItemExample({ itemId }: { itemId: string }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await adminAPI.updateMenuItem(itemId, {
        name_en: name,
        price,
      })
    } catch (err) {
      console.error('Update failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New name"
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        placeholder="New price"
      />
      <button onClick={handleUpdate} disabled={loading}>
        {loading ? 'Updating...' : 'Update'}
      </button>
    </div>
  )
}

/**
 * Example: Delete a menu item
 */
export function DeleteMenuItemExample({ itemId }: { itemId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return

    setLoading(true)
    try {
      await adminAPI.deleteMenuItem(itemId)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading}>
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  )
}
