import { Home, FolderKanban, ListTodo, FileText, Hash, MessageSquare } from 'lucide-react'
import { clsx } from 'clsx'
import { useUIStore } from '@/stores/uiStore'
import { Category } from '@/types'

const categories: { id: Category; icon: any; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'projects', icon: FolderKanban, label: 'Projects' },
  { id: 'lists', icon: ListTodo, label: 'Lists' },
  { id: 'docs', icon: FileText, label: 'Docs' },
  { id: 'channels', icon: Hash, label: 'Channels' },
  { id: 'dms', icon: MessageSquare, label: 'Direct Messages' },
]

export function OuterSidebar() {
  const { activeCategory, setActiveCategory, setSidebarOpen } = useUIStore()

  const handleCategoryClick = (category: Category) => {
    setActiveCategory(category)
    setSidebarOpen(true)
  }

  return (
    <div className="w-14 bg-dark-bg border-r border-dark-border flex flex-col items-center py-4 gap-2">
      {categories.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => handleCategoryClick(id)}
          className={clsx(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
            activeCategory === id
              ? 'bg-blue-600 text-white'
              : 'text-dark-text-muted hover:bg-dark-surface hover:text-dark-text'
          )}
          title={label}
        >
          <Icon size={20} />
        </button>
      ))}
    </div>
  )
}
