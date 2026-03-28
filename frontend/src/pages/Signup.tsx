import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import heroImage from "@/assets/hero-salon.jpg";
import logo from "@/assets/logo.png";

const Signup = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim()) return;
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), phone: phone.trim() },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Save phone to profile table as well
    if (data.user && phone.trim()) {
      await supabase
        .from('profiles')
        .update({ phone: phone.trim() })
        .eq('user_id', data.user.id);
    }

    setLoading(false);
    toast.success("Account created! You can now book appointments.");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex">
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
              <p className="text-cream/70 font-body">Create an account to book your appointments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-10 text-center">
            <Link to="/" className="inline-block active:scale-95 transition-transform mb-6">
              <img src={logo} alt="Logo" className="h-20 w-auto" />
            </Link>
            <h1 className="font-display text-3xl mb-2">Create Account</h1>
            <p className="text-muted-foreground font-body text-sm">Fill in your information below</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block font-body text-sm mb-1.5 text-muted-foreground">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-border bg-background font-body text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Your full name"
                required
              />
            </div>

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
              <label className="block font-body text-sm mb-1.5 text-muted-foreground">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-border bg-background font-body text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. 0612345678"
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
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
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
              Sign up
            </button>
          </form>

          <p className="mt-6 text-center font-body text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
