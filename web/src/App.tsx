import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { HomePage } from "./pages/HomePage";
import { EmptyState } from "./pages/EmptyState";
import { ProjectPage } from "./pages/ProjectPage";
import { BoardView } from "./pages/BoardView";
import { DocView } from "./pages/DocView";
import { ChatView } from "./pages/ChatView";
import { WorkspaceMembersPage } from "./pages/WorkspaceMembersPage";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { ToastContainer } from "./components/ui/Toast";
import { useAuthStore } from "./stores/authStore";
import { useProjectStore } from "./stores/projectStore";
import { useBoardStore } from "./stores/boardStore";
import { useDocStore } from "./stores/docStore";
import { useChatStore } from "./stores/chatStore";

function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const { fetchProjects } = useProjectStore();
  const { fetchBoards } = useBoardStore();
  const { fetchDocs } = useDocStore();
  const { fetchChannels, fetchDirectMessages } = useChatStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      fetchBoards();
      fetchDocs();
      fetchChannels();
      fetchDirectMessages();
    }
  }, [
    isAuthenticated,
    fetchProjects,
    fetchBoards,
    fetchDocs,
    fetchChannels,
    fetchDirectMessages,
  ]);

  if (isLoading) {
    return (
      <>
        <div className="flex h-screen w-screen items-center justify-center bg-dark-bg">
          <div className="text-dark-text">Loading...</div>
        </div>
        <ToastContainer />
      </>
    );
  }

  // Show auth pages without layout
  if (!isAuthenticated) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />
        <Route
          path="/projects"
          element={
            <MainLayout>
              <EmptyState />
            </MainLayout>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <MainLayout>
              <ProjectPage />
            </MainLayout>
          }
        />
        {/* Nested routes for project items */}
        <Route
          path="/projects/:projectId/boards/:id"
          element={
            <MainLayout>
              <BoardView />
            </MainLayout>
          }
        />
        <Route
          path="/projects/:projectId/docs/:id"
          element={
            <MainLayout>
              <DocView />
            </MainLayout>
          }
        />
        <Route
          path="/projects/:projectId/channels/:id"
          element={
            <MainLayout>
              <ChatView />
            </MainLayout>
          }
        />
        <Route
          path="/boards"
          element={
            <MainLayout>
              <EmptyState />
            </MainLayout>
          }
        />
        <Route
          path="/boards/:id"
          element={
            <MainLayout>
              <BoardView />
            </MainLayout>
          }
        />
        <Route
          path="/docs"
          element={
            <MainLayout>
              <EmptyState />
            </MainLayout>
          }
        />
        <Route
          path="/docs/:id"
          element={
            <MainLayout>
              <DocView />
            </MainLayout>
          }
        />
        <Route
          path="/channels"
          element={
            <MainLayout>
              <EmptyState />
            </MainLayout>
          }
        />
        <Route
          path="/channels/:id"
          element={
            <MainLayout>
              <ChatView />
            </MainLayout>
          }
        />
        <Route
          path="/dms"
          element={
            <MainLayout>
              <EmptyState />
            </MainLayout>
          }
        />
        <Route
          path="/dms/:id"
          element={
            <MainLayout>
              <ChatView />
            </MainLayout>
          }
        />
        <Route
          path="/members"
          element={
            <MainLayout>
              <WorkspaceMembersPage />
            </MainLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
