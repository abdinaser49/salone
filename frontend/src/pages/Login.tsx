import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import heroImage from "@/assets/hero-salon.jpg";
import logo from "@/assets/logo.png";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      const isAdmin = ADMIN_EMAILS.includes(data.user?.email?.toLowerCase() || "");
      if (isAdmin) {
        toast.success("Welcome back, Admin!");
        navigate("/dashboard");
      } else {
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={heroImage} alt="Salon" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/40" />
        <div className="absolute inset-0 flex items-end p-12">
          <div className="flex flex-col gap-6">
            <Link to="/" className="self-start active:scale-95 transition-transform">
              <img src={logo} alt="Qurux Dumar Logo" className="h-24 w-auto" />
            </Link>
            <div>
              <h2 className="font-display text-4xl text-cream mb-2">Qurux Dumar Beauty Salon</h2>
              <p className="text-cream/70 font-body">Dashboard Management System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block active:scale-95 transition-transform mb-6">
              <img src={logo} alt="Logo" className="h-20 w-auto" />
            </Link>
            <h1 className="font-display text-3xl mb-2">Welcome back</h1>
            <p className="text-muted-foreground font-body text-sm">Enter your email and password to login</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-body text-sm mb-1.5 text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-border bg-background font-body text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block font-body text-sm mb-1.5 text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-border bg-background font-body text-sm focus:outline-none focus:border-primary transition-colors pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 font-body text-sm tracking-[0.15em] uppercase disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Login
            </button>
          </form>

          <p className="mt-6 text-center font-body text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
