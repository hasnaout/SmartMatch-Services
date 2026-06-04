import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import TopBar  from "../components/navigation/Topbar";
import useUIStore from "../store/useUIStore";
import styles from "./DashboardLayout.module.css";
import { cn } from "../utils/cn";

export default function DashboardLayout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className={cn(styles.layout, !sidebarOpen && styles.collapsed)}>
      <Sidebar />
      <div className={styles.body}>
        <TopBar />
        <main className={styles.main}>
          <div className={styles.content}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
