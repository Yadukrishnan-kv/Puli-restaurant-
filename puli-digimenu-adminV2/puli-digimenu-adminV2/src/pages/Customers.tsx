import { useEffect, useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'
import type { Customer } from '@/types'

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const toast = useToast()

  const loadCustomers = async (pageToLoad = 1) => {
    setIsLoading(true)
    try {
      const response = await adminAPI.getCustomers(pageToLoad, pageSize)
      setCustomers(response.data)
      setTotalPages(response.meta.totalPages)
      setPage(response.meta.page)
    } catch (error) {
      console.error('Load customers failed', error)
      toast('Failed to fetch customers', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers(page)
  }, [page])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Customers</h1>
      <p className="text-sm text-[var(--color-text-secondary)]">List of customers who submitted details from the public menu page.</p>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--card-bg)] p-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : customers.length === 0 ? (
          <p>No customer records found.</p>
        ) : (
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="text-[var(--color-text-secondary)] uppercase">
                <th className="px-3 py-2">Full Name</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Date of Birth</th>
                <th className="px-3 py-2">Anniversary</th>
                <th className="px-3 py-2">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-[var(--color-border)]">
                  <td className="px-3 py-2">{customer.fullName}</td>
                  <td className="px-3 py-2">{customer.contactNumber}</td>
                  <td className="px-3 py-2">{customer.email}</td>
                  <td className="px-3 py-2">{customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : '–'}</td>
                  <td className="px-3 py-2">{customer.anniversaryDate ? new Date(customer.anniversaryDate).toLocaleDateString() : '–'}</td>
                  <td className="px-3 py-2">{new Date(customer.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <small className="text-[var(--color-text-secondary)]">
          Page {page} of {totalPages} ({customers.length} records shown)
        </small>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded border px-3 py-1 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="rounded border px-3 py-1 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
