import { Navigation } from '@/components/Navigation'
import { SearchBar } from '@/components/SearchBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navigation />
      {/* Offset for desktop sidebar */}
      <div className="md:ml-[220px]">
        {/* Sticky header with search */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: 'rgba(10,10,10,0.88)',
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
  )
}
