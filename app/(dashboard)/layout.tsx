'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, LayoutDashboard, Users, ArrowLeftRight,
  Settings, LogOut, Sun, Moon, Menu, X, TrendingUp,
} from 'lucide-react'
import { useTheme } from '@/lib/context/ThemeContext'
import { toast } from 'sonner'

interface NavItem { href: string; icon: React.ReactNode; label: string }

const NAV: NavItem[] = [
  { href: '/dashboard',     icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { href: '/customers',     icon: <Users size={18} />,            label: 'Customers' },
  { href: '/transactions',  icon: <ArrowLeftRight size={18} />,   label: 'Transactions' },
  { href: '/reports',       icon: <TrendingUp size={18} />,       label: 'Reports' },
  { href: '/settings',      icon: <Settings size={18} />,         label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; currency: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUser(d.user))
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Logged out')
    router.push('/login')
    router.refresh()
  }

  const initials = user?.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>Digital Khata</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Finance Tracker</div>
          </div>
        </div>

        <nav className="nav-section">
          <div className="nav-label">Main Menu</div>
          {NAV.slice(0, 3).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${pathname === item.href ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <div className="nav-label" style={{ marginTop: 16 }}>More</div>
          {NAV.slice(3).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${pathname === item.href ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)' }}>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Loading…'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.currency || 'PKR'}</div>
            </div>
            <button onClick={logout} className="btn btn-ghost btn-icon btn-sm" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                {NAV.find(n => n.href === pathname)?.label || 'Digital Khata'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
