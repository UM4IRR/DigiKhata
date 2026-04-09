'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, LayoutDashboard, Users, ArrowLeftRight,
  Settings, LogOut, Sun, Moon, Menu, X, TrendingUp, Languages
} from 'lucide-react'
import { useTheme } from '@/lib/context/ThemeContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

interface NavItem { href: string; icon: React.ReactNode; labelKey: string }

const NAV: NavItem[] = [
  { href: '/dashboard',     icon: <LayoutDashboard size={18} />, labelKey: 'dashboard' },
  { href: '/customers',     icon: <Users size={18} />,            labelKey: 'customers' },
  { href: '/transactions',  icon: <ArrowLeftRight size={18} />,   labelKey: 'transactions' },
  { href: '/reports',       icon: <TrendingUp size={18} />,       labelKey: 'reports' },
  { href: '/settings',      icon: <Settings size={18} />,         labelKey: 'settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, dir } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; currency: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUser(d.user))
  }, [])

  if (!mounted) {
    return <div style={{ background: 'var(--surface-1)', minHeight: '100vh' }} />
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success(t('logout_success', { defaultValue: 'Logged out' }))
    router.push('/login')
    router.refresh()
  }

  const toggleLanguage = () => {
    const next = language === 'en' ? 'ur' : 'en'
    setLanguage(next)
    toast.success(next === 'ur' ? 'اردو زبان منتخب کر لی گئی ہے' : 'Language changed to English')
  }

  const initials = user?.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  const isRtl = dir === 'rtl'

  return (
    <div className={`app-layout ${isRtl ? 'rtl' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} style={{ 
        left: isRtl ? 'auto' : 0, 
        right: isRtl ? 0 : 'auto',
        borderRight: isRtl ? 'none' : '1px solid var(--border-2)',
        borderLeft: isRtl ? '1px solid var(--border-2)' : 'none'
      }}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{t('brand', { defaultValue: 'Digital Khata' })}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('finance_tracker', { defaultValue: 'Finance Tracker' })}</div>
          </div>
        </div>

        <nav className="nav-section">
          <div className="nav-label">{t('main_menu', { defaultValue: 'Main Menu' })}</div>
          {NAV.slice(0, 3).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${pathname === item.href ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}
            >
              {item.icon}
              <span style={{ marginInlineStart: isRtl ? 0 : 0, marginInlineEnd: 0 }}>{t(item.labelKey)}</span>
            </Link>
          ))}

          <div className="nav-label" style={{ marginTop: 16 }}>{t('more', { defaultValue: 'More' })}</div>
          {NAV.slice(3).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${pathname === item.href ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}
            >
              {item.icon}
              <span style={{ marginInlineStart: isRtl ? 0 : 0 }}>{t(item.labelKey)}</span>
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0, textAlign: isRtl ? 'right' : 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || t('loading', { defaultValue: 'Loading…' })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.currency || 'PKR'}</div>
            </div>
            <button onClick={logout} className="btn btn-ghost btn-icon btn-sm" title={t('logout')}>
              <LogOut size={14} style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content" style={{ 
        marginLeft: isRtl ? 0 : 'var(--sidebar-w)', 
        marginRight: isRtl ? 'var(--sidebar-w)' : 0 
      }}>
        {/* Top Bar */}
        <header className="top-bar" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
              id="sidebar-toggle"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <style>{`@media(max-width:768px){#sidebar-toggle{display:flex!important}}`}</style>
            <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                {t(NAV.find(n => n.href === pathname)?.labelKey || 'brand', { defaultValue: 'Digital Khata' })}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            {/* Language Toggle */}
            <button 
              onClick={toggleLanguage}
              className="btn btn-ghost"
              style={{ fontSize: 13, fontWeight: 600, padding: '4px 10px', background: 'var(--surface-2)' }}
            >
              <Languages size={14} />
              <span>{language === 'en' ? 'اردو' : 'English'}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="theme-toggle"
              style={{ outline: 'none' }}
              aria-label="Toggle theme"
            >
              <span className="theme-toggle-thumb" />
            </button>
            {theme === 'dark'
              ? <Moon size={14} style={{ color: 'var(--primary-light)' }} />
              : <Sun size={14} style={{ color: 'var(--warning)' }} />
            }
            <div className="avatar" style={{ cursor: 'default' }}>{initials}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
