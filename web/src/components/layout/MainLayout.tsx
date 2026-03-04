import { clsx } from "clsx";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import { OuterSidebar } from "./OuterSidebar";
import { InnerSidebar } from "./InnerSidebar";
import { MobileTabBar } from "./MobileTabBar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";

  const isMobileRootPage = [
    "/dashboard",
    "/updates",
    "/projects",
    "/boards",
    "/channels",
    "/doc-folders",
    "/dms",
  ].includes(pathname);

  const showMobileTabBar = isMobile && isMobileRootPage;

  return (
    <div className="flex h-svh w-screen overflow-hidden bg-dark-bg">
      {!isMobile && <OuterSidebar />}
      {!isMobile && <InnerSidebar />}
      <main
        className={clsx(
          "flex-1 overflow-hidden flex flex-col",
          showMobileTabBar && "pb-[calc(3.5rem+env(safe-area-inset-bottom))]",
        )}
      >
        {children}
      </main>
      {showMobileTabBar && <MobileTabBar />}
    </div>
  );
}
