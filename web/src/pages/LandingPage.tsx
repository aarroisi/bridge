import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <span className="text-xl font-bold text-dark-text">Mission Space</span>
        <button
          onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {isAuthenticated ? "Dashboard" : "Log In"}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        <h1 className="text-5xl font-bold text-dark-text mb-4 text-center">
          Team collaboration,
          <br />
          simplified.
        </h1>
        <p className="text-lg text-dark-text-muted mb-8 text-center max-w-xl">
          Docs, boards, and chat in one place. Keep your team aligned without
          switching between tools.
        </p>
        <button
          onClick={() =>
            navigate(isAuthenticated ? "/dashboard" : "/register")
          }
          className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {isAuthenticated ? "Go to Dashboard" : "Get Started"}
        </button>
      </main>
    </div>
  );
}
