import { useProjectStore } from '@/stores/projectStore'
import { useListStore } from '@/stores/listStore'
import { useDocStore } from '@/stores/docStore'
import { useChatStore } from '@/stores/chatStore'
import { FileText, ListTodo, MessageSquare } from 'lucide-react'

export function HomePage() {
  const { projects } = useProjectStore()
  const { lists } = useListStore()
  const { docs } = useDocStore()
  const { channels } = useChatStore()

  const starredItems = [
    ...projects.filter((p) => p.starred).map((p) => ({ ...p, type: 'project' })),
    ...lists.filter((l) => l.starred).map((l) => ({ ...l, type: 'list' })),
    ...docs.filter((d) => d.starred).map((d) => ({ ...d, type: 'doc' })),
    ...channels.filter((c) => c.starred).map((c) => ({ ...c, type: 'channel' })),
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-3xl font-bold text-dark-text mb-8">Home</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-dark-text mb-4">Starred Items</h2>
        {starredItems.length === 0 ? (
          <p className="text-dark-text-muted">No starred items yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {starredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-dark-surface border border-dark-border rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  {item.type === 'list' && <ListTodo size={16} className="text-blue-400" />}
                  {item.type === 'doc' && <FileText size={16} className="text-green-400" />}
                  {item.type === 'channel' && <MessageSquare size={16} className="text-purple-400" />}
                  <span className="text-xs text-dark-text-muted uppercase">{item.type}</span>
                </div>
                <h3 className="font-medium text-dark-text">{item.name || (item as any).title}</h3>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-dark-text mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-dark-surface border border-dark-border rounded-lg">
            <div className="text-2xl font-bold text-blue-400 mb-1">{projects.length}</div>
            <div className="text-sm text-dark-text-muted">Projects</div>
          </div>
          <div className="p-4 bg-dark-surface border border-dark-border rounded-lg">
            <div className="text-2xl font-bold text-green-400 mb-1">{lists.length}</div>
            <div className="text-sm text-dark-text-muted">Lists</div>
          </div>
          <div className="p-4 bg-dark-surface border border-dark-border rounded-lg">
            <div className="text-2xl font-bold text-purple-400 mb-1">{docs.length}</div>
            <div className="text-sm text-dark-text-muted">Docs</div>
          </div>
          <div className="p-4 bg-dark-surface border border-dark-border rounded-lg">
            <div className="text-2xl font-bold text-orange-400 mb-1">{channels.length}</div>
            <div className="text-sm text-dark-text-muted">Channels</div>
          </div>
        </div>
      </div>
    </div>
  )
}
