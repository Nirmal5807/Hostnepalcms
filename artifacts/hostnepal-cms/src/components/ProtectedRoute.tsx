import { useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { isAuthenticated } from "../lib/auth";
import { AppLayout } from "../components/layout/AppLayout";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const [location] = useLocation();
  const isAuth = isAuthenticated();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: isAuth,
      retry: false
    }
  });

  if (!isAuth) {
    return <Redirect to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return <Redirect to="/login" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}