import { Navigation } from '@/components/Navigation'
import { SearchBar } from '@/components/SearchBar'
import { SWRProvider } from '@/components/SWRProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
    <div>
      <Navigation />
      {/* Offset for desktop sidebar */}
      <div className="app-content">
        {/* Sticky header with search */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: 'var(--bg-header)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--line)',
          padding: '10px 22px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <SearchBar />
        </header>
        <main style={{ minHeight: '100vh' }}>
          {children}
        </main>
      </div>
    </div>
    </SWRProvider>
  )
}
