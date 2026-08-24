'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users,
  Trophy,
  Calendar,
  CalendarDays,
  BarChart3,
  LineChart,
  Menu,
  X,
  Plus,
  Swords,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/language-switcher'
import API from '@/lib/api'
import { isEventToday } from '@/lib/ongoing-date'
import type { OngoingEventListItem } from '@/lib/types'

const allNavItems = [
  { href: '/', labelKey: 'nav.overview', icon: BarChart3 },
  { href: '/players', labelKey: 'nav.players', icon: Users },
  { href: '/events', labelKey: 'nav.events', icon: Calendar },
  { href: '/ongoing', labelKey: 'nav.ongoing', icon: Swords },
  { href: '/calendar', labelKey: 'nav.calendar', icon: CalendarDays },
  { href: '/add-results', labelKey: 'nav.addResults', icon: Plus },
  // { href: '/games', labelKey: 'nav.games', icon: Trophy },
  // { href: '/rankings', labelKey: 'nav.rankings', icon: BarChart3 },
  // { href: '/analytics', labelKey: 'nav.analytics', icon: LineChart },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const hasAccess = [process.env.NEXT_PUBLIC_ADMIN_PASSWORD, process.env.NEXT_PUBLIC_MODERATOR_PASSWORD]
      .includes(localStorage.getItem('ADMIN_PASSWORD') || '')
    setIsAdmin(hasAccess)
  }, [])

  // Non-admins only need this tab on a day a tournament is actually happening; admins always see
  // it (config/roster work happens well before or after the day itself). Shares its cache with the
  // /ongoing list page's identical query, so this costs nothing extra there.
  const { data: ongoingEvents = [] } = useQuery<OngoingEventListItem[]>({
    queryKey: ['ongoing-events'],
    queryFn: async () => {
      const response = await fetch(API.GET_ONGOING_EVENTS)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return response.json()
    },
  })
  const hasTournamentToday = ongoingEvents.some((event) => isEventToday(event.date))

  // Filter nav items based on admin status
  const navItems = allNavItems.filter((item) => {
    // Always show overview
    if (item.href === '/') return true
    // Show add-results only if admin
    if (item.href === '/add-results') return isAdmin
    // Ongoing tournaments: admins always, everyone else only on the day one is happening
    if (item.href === '/ongoing') return isAdmin || hasTournamentToday
    // Show other items (when uncommented)
    return true
  })

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SandStats</span>
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span suppressHydrationWarning>{t(item.labelKey)}</span>
                </Link>
              )
            })}
            <LanguageSwitcher />
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-border py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span suppressHydrationWarning>{t(item.labelKey)}</span>
                  </Link>
                )
              })}
              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
