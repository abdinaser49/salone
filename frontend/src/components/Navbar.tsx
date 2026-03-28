import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

interface NavbarProps {
  onBookNow: () => void;
}

const Navbar = ({ onBookNow }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email?.toLowerCase() || "") : false;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    setMobileOpen(false);
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-top",
      scrolled ? "bg-background/95 backdrop-blur-md shadow-md h-16 sm:h-20" : "bg-transparent h-20 sm:h-24"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logo} alt="Qurux Dumar Logo" className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-110" />
          <span className={cn(
            "font-display text-lg sm:text-2xl transition-colors drop-shadow-sm",
            scrolled ? "text-primary" : "text-[#112232]"
          )}>Qurux Dumar</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-7 lg:gap-8 font-body text-sm">
            <button onClick={() => navigate("/rentals")} className={cn(
               "transition-colors font-medium text-[15px]",
               scrolled ? "text-foreground hover:text-primary" : "text-[#112232] hover:text-[#E87A5D]"
            )}>Rentals</button>

            <button onClick={() => scrollTo("services")} className={cn(
               "transition-colors font-medium text-[15px]",
               scrolled ? "text-foreground hover:text-primary" : "text-[#112232] hover:text-[#E87A5D]"
            )}>Services</button>

            <button onClick={() => scrollTo("about")} className={cn(
               "transition-colors font-medium text-[15px]",
               scrolled ? "text-foreground hover:text-primary" : "text-[#112232] hover:text-[#E87A5D]"
            )}>About Us</button>

            <button onClick={() => navigate("/team")} className={cn(
               "transition-colors font-medium text-[15px]",
               scrolled ? "text-foreground hover:text-primary" : "text-[#112232] hover:text-[#E87A5D]"
            )}>Team</button>

            <button onClick={() => navigate("/contact")} className={cn(
               "transition-colors font-medium text-[15px]",
               scrolled ? "text-foreground hover:text-primary" : "text-[#112232] hover:text-[#E87A5D]"
            )}>Contact</button>

            {/* Added a vertical divider for auth links if needed */}
            <div className="w-px h-4 bg-gray-300 mx-2 hidden lg:block" />
            {isAdmin ? (
              <Link
                to="/dashboard"
                className={cn(
                  "flex items-center gap-2 transition-colors font-semibold",
                  scrolled ? "text-primary" : "text-gray-800 hover:text-[#E87A5D]"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className={cn(
                  "flex items-center gap-2 transition-colors font-semibold",
                  scrolled ? "text-foreground hover:text-primary" : "text-gray-800 hover:text-[#E87A5D]"
                )}
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>

          <button
            onClick={onBookNow}
            className={cn(
              "px-5 sm:px-8 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] uppercase transition-all shadow-md active:scale-95 font-bold",
              scrolled 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-[#E87A5D] text-white hover:bg-[#d66a4f]"
            )}
          >
            Book Now
          </button>

          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className={cn(
              "md:hidden p-2 rounded-full transition-colors",
              scrolled ? "text-primary hover:bg-primary/10" : "text-[#112232] hover:bg-black/5"
            )}
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile-only visible quick-nav (Horizontal Scrolling) */}
      <div className="md:hidden bg-background/80 backdrop-blur-md border-b border-border/50 h-14 flex items-center overflow-x-auto no-scrollbar px-6 gap-8 sticky top-0 shadow-sm">
          <button onClick={() => navigate("/rentals")} className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.15em] text-charcoal opacity-80 active:text-primary">Rentals</button>
          <button onClick={() => scrollTo("services")} className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.15em] text-charcoal opacity-80 active:text-primary">Services</button>
          <button onClick={() => scrollTo("about")} className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.15em] text-charcoal opacity-80 active:text-primary">About</button>
          <button onClick={() => navigate("/team")} className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.15em] text-charcoal opacity-80 active:text-primary">Team</button>
          <button onClick={() => navigate("/contact")} className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.15em] text-charcoal opacity-80 active:text-primary">Contact</button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-6 py-8 space-y-6">
              <div className="space-y-4">
                <button onClick={() => { navigate("/rentals"); setMobileOpen(false); }} className="flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-lg">Rentals</button>
                <button onClick={() => { scrollTo("services"); setMobileOpen(false); }} className="flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-lg">Services</button>
                <button onClick={() => { scrollTo("about"); setMobileOpen(false); }} className="flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-lg">About Us</button>
                <button onClick={() => { navigate("/team"); setMobileOpen(false); }} className="flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-lg">Team</button>
                <button onClick={() => { navigate("/contact"); setMobileOpen(false); }} className="flex items-center gap-4 w-full text-left py-3 px-4 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-lg">Contact</button>
              </div>
              
              <div className="pt-6 border-t border-border">
                {isAdmin ? (
                  <Link 
                    to="/dashboard" 
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 w-full py-4 text-primary font-black uppercase tracking-widest text-xs"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/login" 
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 w-full py-4 text-charcoal font-black uppercase tracking-widest text-xs"
                  >
                    <LogIn className="w-5 h-5" />
                    Login Account
                  </Link>
                )}

                <button
                  onClick={() => { onBookNow(); setMobileOpen(false); }}
                  className="w-full mt-4 bg-primary text-primary-foreground py-5 rounded-[1.5rem] text-[10px] tracking-[0.2em] uppercase font-black shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  Book Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
