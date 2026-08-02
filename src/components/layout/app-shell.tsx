'use client'

import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Sidebar, MobileBottomNav } from './sidebar'
import { Topbar } from './topbar'
import { usePageHeader } from '@/store/use-page-header'

export function AppShell({ children }: { children: ReactNode }) {
  const { title, statusIndicator } = usePageHeader()
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col tablet-h:pl-[76px]">
          <Topbar title={title} statusIndicator={statusIndicator} />

          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="flex-1 p-4 pb-24 sm:p-6 md:p-8 tablet-h:pb-8"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>

        <MobileBottomNav />
      </div>
    </div>
  )
}