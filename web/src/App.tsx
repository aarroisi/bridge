import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { HomePage } from './pages/HomePage'
import { ListView } from './pages/ListView'
import { DocView } from './pages/DocView'
import { ChatView } from './pages/ChatView'
import { useAuthStore } from './stores/authStore'
import { useProjectStore } from './stores/projectStore'
import { useListStore } from './stores/listStore'
import { useDocStore } from './stores/docStore'
import { useChatStore } from './stores/chatStore'
import { useUIStore } from './stores/uiStore'

function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore()
  const { fetchProjects } = useProjectStore()
  const { fetchLists } = useListStore()
  const { fetchDocs } = useDocStore()
  const { fetchChannels, fetchDirectMessages } = useChatStore()
  const { activeCategory, activeItem } = useUIStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects()
      fetchLists()
      fetchDocs()
      fetchChannels()
      fetchDirectMessages()
    }
  }, [isAuthenticated, fetchProjects, fetchLists, fetchDocs, fetchChannels, fetchDirectMessages])

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-dark-bg">
        <div className="text-dark-text">Loading...</div>
      </div>
    )
  }

  // For now, skip auth - in production you'd redirect to login
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />
  // }

  const renderContent = () => {
    if (activeCategory === 'home' || !activeItem) {
      return <HomePage />
    }

    switch (activeCategory) {
      case 'lists':
        return <ListView />
      case 'docs':
        return <DocView />
      case 'channels':
      case 'dms':
        return <ChatView />
      default:
        return <HomePage />
    }
  }

  return (
    <MainLayout>
      {renderContent()}
    </MainLayout>
  )
}

export default App
