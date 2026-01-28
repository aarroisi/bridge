import { Star, Plus, ChevronDown, ChevronRight, ListTodo, FileText, Hash } from 'lucide-react'
import { clsx } from 'clsx'
import { useUIStore } from '@/stores/uiStore'
import { useProjectStore } from '@/stores/projectStore'
import { useListStore } from '@/stores/listStore'
import { useDocStore } from '@/stores/docStore'
import { useChatStore } from '@/stores/chatStore'
import { Avatar } from '@/components/ui/Avatar'

export function InnerSidebar() {
  const { activeCategory, sidebarOpen, activeItem, setActiveItem, collapsedSections, toggleSection } =
    useUIStore()
  const { projects } = useProjectStore()
  const { lists } = useListStore()
  const { docs } = useDocStore()
  const { channels, directMessages } = useChatStore()

  if (!sidebarOpen) return null

  const renderStarred = (items: any[], type: string) => {
    const starred = items.filter((item) => item.starred)
    if (starred.length === 0) return null

    return (
      <div className="mb-4">
        <button
          onClick={() => toggleSection('starred')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider w-full hover:text-dark-text"
        >
          {collapsedSections['starred'] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <Star size={14} />
          Starred
        </button>
        {!collapsedSections['starred'] && (
          <div className="mt-1">
            {starred.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveItem({ type: type as any, id: item.id })}
                className={clsx(
                  'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors',
                  activeItem?.id === item.id && 'bg-dark-surface text-blue-400'
                )}
              >
                {getItemIcon(type)}
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'lists':
        return <ListTodo size={16} />
      case 'docs':
        return <FileText size={16} />
      case 'channels':
        return <Hash size={16} />
      default:
        return null
    }
  }

  const renderContent = () => {
    switch (activeCategory) {
      case 'home':
        return (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-dark-text-muted mb-2">Recent</h3>
            <p className="text-sm text-dark-text-muted">No recent items</p>
          </div>
        )

      case 'projects':
        return (
          <div>
            {renderStarred(projects, 'projects')}
            <div className="px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider flex items-center justify-between">
              All Projects
              <button className="hover:text-dark-text">
                <Plus size={14} />
              </button>
            </div>
            <div className="mt-1">
              {projects.map((project) => (
                <div key={project.id}>
                  <button
                    onClick={() => toggleSection(`project-${project.id}`)}
                    className={clsx(
                      'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors',
                      activeItem?.id === project.id && 'bg-dark-surface text-blue-400'
                    )}
                  >
                    {collapsedSections[`project-${project.id}`] ? (
                      <ChevronRight size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                    <span className="truncate flex-1">{project.name}</span>
                  </button>
                  {!collapsedSections[`project-${project.id}`] && project.items && (
                    <div className="ml-4">
                      {project.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveItem({ type: item.type as any, id: item.id })}
                          className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors text-dark-text-muted"
                        >
                          {getItemIcon(item.type)}
                          <span className="truncate">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case 'lists':
        return (
          <div>
            {renderStarred(lists, 'lists')}
            <div className="px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider flex items-center justify-between">
              All Lists
              <button className="hover:text-dark-text">
                <Plus size={14} />
              </button>
            </div>
            <div className="mt-1">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setActiveItem({ type: 'lists', id: list.id })}
                  className={clsx(
                    'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors',
                    activeItem?.id === list.id && 'bg-dark-surface text-blue-400'
                  )}
                >
                  <ListTodo size={16} />
                  <span className="truncate">{list.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 'docs':
        return (
          <div>
            {renderStarred(docs, 'docs')}
            <div className="px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider flex items-center justify-between">
              All Docs
              <button className="hover:text-dark-text">
                <Plus size={14} />
              </button>
            </div>
            <div className="mt-1">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveItem({ type: 'docs', id: doc.id })}
                  className={clsx(
                    'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors',
                    activeItem?.id === doc.id && 'bg-dark-surface text-blue-400'
                  )}
                >
                  <FileText size={16} />
                  <span className="truncate">{doc.title}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 'channels':
        return (
          <div>
            {renderStarred(channels, 'channels')}
            <div className="px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider flex items-center justify-between">
              All Channels
              <button className="hover:text-dark-text">
                <Plus size={14} />
              </button>
            </div>
            <div className="mt-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveItem({ type: 'channels', id: channel.id })}
                  className={clsx(
                    'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors',
                    activeItem?.id === channel.id && 'bg-dark-surface text-blue-400'
                  )}
                >
                  <Hash size={16} />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 'dms':
        return (
          <div>
            {renderStarred(directMessages, 'dms')}
            <div className="px-3 py-1.5 text-xs font-semibold text-dark-text-muted uppercase tracking-wider flex items-center justify-between">
              Direct Messages
              <button className="hover:text-dark-text">
                <Plus size={14} />
              </button>
            </div>
            <div className="mt-1">
              {directMessages.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => setActiveItem({ type: 'dms', id: dm.id })}
                  className={clsx(
                    'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-surface transition-colors',
                    activeItem?.id === dm.id && 'bg-dark-surface text-blue-400'
                  )}
                >
                  <Avatar name={dm.name} size="xs" online={dm.online} />
                  <span className="truncate">{dm.name}</span>
                </button>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-52 bg-dark-surface border-r border-dark-border overflow-y-auto flex-shrink-0">
      {renderContent()}
    </div>
  )
}
