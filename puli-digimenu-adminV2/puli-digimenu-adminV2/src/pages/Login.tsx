import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '@/lib/adminAPI'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!email.trim() || !password.trim()) {
        setError('Email and password are required')
        setLoading(false)
        return
      }

      const result = await adminAPI.login(email, password)
      toast(`Welcome, ${result.user.email}!`, 'success')
      navigate('/')
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Login failed'
      setError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)] p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">PULI Admin</h1>
          <p className="text-[var(--color-text-secondary)] mb-6">Sign in to manage your menu</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@puli.com"
                disabled={loading}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full py-2.5 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
