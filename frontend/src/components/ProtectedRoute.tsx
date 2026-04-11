import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldX } from "lucide-react";

// Admin emails from environment variable (comma-separated)
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setIsAuthorized(false);
        return;
      }
      
      const email = user.email?.toLowerCase() || "";
      if (ADMIN_EMAILS.includes(email)) {
        setIsAuthorized(true);
        return;
      }

      const { data } = await supabase
        .from('staff')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      setIsAuthorized(!!data);
    };

    if (!authLoading) {
      checkAccess();
    }
  }, [user, authLoading]);

  if (authLoading || (user && isAuthorized === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in or not authorized → redirect to home
  if (!user || !isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
