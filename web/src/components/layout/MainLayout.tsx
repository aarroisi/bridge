import { OuterSidebar } from './OuterSidebar'
import { InnerSidebar } from './InnerSidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-bg">
      <OuterSidebar />
      <InnerSidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  )
}
