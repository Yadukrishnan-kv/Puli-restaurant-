import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAdminData } from '@/hooks/useAdminData'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  const { loading, error } = useAdminData()

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-[var(--content-bg)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Data</h1>
          <p className="text-[var(--color-text-secondary)]">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--content-bg)]">
      <Sidebar />
      <main className="pl-64">
        <div className="min-h-screen px-6 py-8">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
                <p className="mt-4 text-[var(--color-text-secondary)]">Loading data...</p>
              </div>
            </div>
          )}
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-7xl"
            >
              <Outlet />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
