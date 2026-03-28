import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldX } from "lucide-react";

// Admin emails from environment variable (comma-separated)
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but NOT an admin → show Access Denied
  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center">
              <ShieldX className="w-10 h-10 text-rose-500" />
            </div>
          </div>
          <h1 className="font-display text-3xl mb-3 text-foreground">Access Denied</h1>
          <p className="text-muted-foreground font-body text-sm mb-8">
            You do not have permission to access this page. This area is restricted to administrators only.
          </p>
          <a
            href="/"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full font-body text-sm tracking-[0.15em] uppercase hover:bg-primary/90 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
