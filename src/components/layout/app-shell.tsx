'use client'

import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Sidebar, MobileBottomNav } from './sidebar'
import { Topbar } from './topbar'
import { usePageHeader } from '@/store/use-page-header'
import { useZoom, NIVEIS_ZOOM } from '@/store/use-zoom'

export function AppShell({ children }: { children: ReactNode }) {
  const { title, statusIndicator } = usePageHeader()
  const pathname = usePathname()
  const escala = NIVEIS_ZOOM[useZoom((s) => s.indice)]

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
              {/* Zoom "de verdade": reduz a largura antes de ampliar, então o
                  conteúdo primeiro reflui como se a tela fosse menor (cards
                  empilham, grids reduzem colunas) e depois é escalado de volta
                  para caber na largura real — cresce fonte, borda, barra,
                  tudo junto, na mesma proporção. @container faz os grids que
                  usam variantes @sm/@md/@xl reagirem a essa largura reduzida
                  (não à largura real da tela), então eles também empilham. */}
              <div
                className="@container"
                style={
                  escala === 1
                    ? undefined
                    : {
                        width: `${100 / escala}%`,
                        transform: `scale(${escala})`,
                        transformOrigin: 'top left',
                      }
                }
              >
                {children}
              </div>
            </motion.main>
          </AnimatePresence>
        </div>

        <MobileBottomNav />
      </div>
    </div>
  )
}