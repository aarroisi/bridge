import { clsx } from "clsx";
import { useIsMobile } from "@/hooks/useIsMobile";
import { OuterSidebar } from "./OuterSidebar";
import { InnerSidebar } from "./InnerSidebar";
import { MobileTabBar } from "./MobileTabBar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-svh w-screen overflow-hidden bg-dark-bg">
      {!isMobile && <OuterSidebar />}
      {!isMobile && <InnerSidebar />}
      <main
        className={clsx(
          "flex-1 overflow-hidden flex flex-col",
          isMobile && "pb-[calc(3.5rem+env(safe-area-inset-bottom))]",
        )}
      >
        {children}
      </main>
      {isMobile && <MobileTabBar />}
    </div>
  );
}
