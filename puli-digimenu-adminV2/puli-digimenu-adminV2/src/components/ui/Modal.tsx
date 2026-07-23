import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'flex max-h-[90vh] w-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--card-bg)] shadow-[var(--shadow-lg)]',
                size === 'sm' && 'max-w-sm',
                size === 'md' && 'max-w-md',
                size === 'lg' && 'max-w-lg',
                size === 'xl' && 'max-w-2xl'
              )}
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
                <Button variant="ghost" size="sm" onClick={onClose} className="-mr-2">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="overflow-y-auto px-6 py-4">{children}</div>
              {footer && (
                <div className="border-t border-[var(--color-border)] px-6 py-4">{footer}</div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
