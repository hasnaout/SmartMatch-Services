import { useEffect } from "react";
import AppRouter     from "./router";
import useAuthStore  from "./store/useAuthStore";
import useSocketStore from "./store/useSocketStore";
import useNotificationStore from "./store/useNotificationStore";
import useMessageStore      from "./store/useMessageStore";
import PageLoader    from "./components/feedback/PageLoader";

export default function App() {
  const { fetchMe, user, isReady }  = useAuthStore();
  const { connect, disconnect }     = useSocketStore();
  const fetchNotifications          = useNotificationStore((s) => s.fetchNotifications);
  const fetchNonLus                 = useMessageStore((s) => s.fetchNonLus);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  useEffect(() => {
    if (user?._id) {
      connect(user._id);
      fetchNotifications();
      fetchNonLus();
    }
    return () => { if (!user?._id) disconnect(); };
  }, [user?._id, connect, disconnect, fetchNotifications, fetchNonLus]);

  if (!isReady) return <PageLoader />;

  return <AppRouter />;
}