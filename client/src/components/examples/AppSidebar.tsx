import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from '../AppSidebar';

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          userRole="company"
          currentPlan="ESSENTIEL"
          companyName="TechCorp"
          userName="Jean Dupont"
        />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-semibold">Main Content Area</h1>
          <p className="text-muted-foreground mt-2">The sidebar is shown on the left</p>
        </main>
      </div>
    </SidebarProvider>
  );
}
