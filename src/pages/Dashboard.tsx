import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, X,
  ChevronDown, Bell, Search, Plus, MoreHorizontal, Edit, Trash2,
  Phone, CheckCircle2, Check, Clock, DollarSign, Briefcase, TrendingUp,
  ArrowUpRight, ArrowDownRight, CreditCard, Sparkles, Scissors, Box, UserPlus
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, PieChart, Pie
} from 'recharts';

// Static charts data removed. Replaced with dynamic data linked to DB.

const statusColors: Record<string, string> = {
  "Confirmed": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Pending Confirmation": "bg-amber-100 text-amber-800 border-amber-200",
  "Cancelled": "bg-rose-100 text-rose-800 border-rose-200",
  "Pending": "bg-sky-100 text-sky-800 border-sky-200",
};

type Tab = "overview" | "appointments" | "finance" | "jobs" | "clients" | "settings" | "rentals";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"appointment" | "client" | "service" | "staff" | "payment" | "rental" | null>(null);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "",
    date: "",
    time: "",
    amount: "",
    description: "",
    duration: "",
    image: ""
  });

  useEffect(() => {
    fetchBookings();
    fetchServices();
    
    // Real-time subscription — instantly shows new bookings without page refresh
    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          // Add new booking to top of list immediately
          setBookings(prev => [payload.new as any, ...prev]);
          toast.success("🔔 New booking received!", {
            description: `${(payload.new as any).name} — ${(payload.new as any).service}`,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        (payload) => {
          setBookings(prev => prev.map(b => b.id === (payload.new as any).id ? payload.new as any : b));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'bookings' },
        (payload) => {
          setBookings(prev => prev.filter(b => b.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('services-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => fetchServices()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(servicesChannel);
    };
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDbServices(data || []);
    } catch (error: any) {
      console.error("Error loading services:", error.message);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast.error("Error loading appointments: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setBookings(prev => prev.filter(b => b.id !== id));
      toast.success("Appointment deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete appointment: " + error.message);
    }
  };
  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDbServices(prev => prev.filter(s => s.id !== id));
      toast.success("Service deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete service: " + error.message);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Status updated: ${status}`);
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  // Handle Modal Form Submission
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'appointment' || modalType === 'payment') {
        const { error } = await supabase
          .from('bookings')
          .insert([{
            name: formData.name,
            phone: formData.phone,
            service: modalType === 'payment' ? "Payment Entry" : formData.service,
            booking_date: formData.date || new Date().toISOString().split('T')[0],
            booking_time: formData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            amount: parseFloat(formData.amount) || 0,
            status: "Confirmed"
          }]);

        if (error) throw error;
        toast.success(`${modalType === 'appointment' ? 'Appointment' : 'Payment'} added successfully!`);
      } else if (modalType === 'service') {
        const { error } = await supabase
          .from('services')
          .insert([{
            name: formData.service || formData.name,
            description: formData.description,
            price: parseFloat(formData.amount) || 0,
            duration: formData.duration,
            category: "General"
          }]);

        if (error) throw error;
        toast.success("Service added successfully!");
      } else if (modalType === 'rental') {
        const { error } = await supabase
          .from('services')
          .insert([{
            name: formData.name,
            description: "Wedding Dress / Suit Rental",
            price: parseFloat(formData.amount) || 0,
            image_url: formData.image,
            duration: "1 day",
            category: "Dress"
          }]);

        if (error) throw error;
        toast.success("Dress added to rentals list!");
      } else {
        // Mock success for other types until tables exist
        toast.success(`${modalType} added successfully (Preview)`);
      }
      setModalType(null);
      setFormData({ name: "", phone: "", service: "", date: "", time: "", amount: "", description: "", duration: "", image: "" });
      fetchBookings(); // Refresh list
      fetchServices();
    } catch (error: any) {
      toast.error("Correction failed: " + error.message);
    }
  };

  // Only show real data — no fake/fallback data
  const allBookings = bookings;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Modern UI colors matching the brand
  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "clients", label: "Customers", icon: Users },
    { id: "jobs", label: "Services", icon: Scissors },
    { id: "rentals", label: "Dress Rentals", icon: Box },
    { id: "settings", label: "Staff", icon: UserPlus },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "finance", label: "Payments", icon: CreditCard },
  ];

  const sidebarStyles = "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#6D1B4B] to-[#4A0E32] text-white transform transition-transform duration-500 ease-in-out lg:translate-x-0 shadow-2xl overflow-hidden";
  const cardStyles = "bg-white border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden relative transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1";

  // Unified Local Date Helper (YYYY-MM-DD)
  const getLocalDateString = (date = new Date()) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const todayStr = getLocalDateString();
  
  // Stats calculation
  let todayRevenue = 0;
  let weekRevenue = 0;
  let monthRevenue = 0;
  let totalRevenue = 0;
  let todaysAptCount = 0;

  const revenueByDay: Record<string, number> = {};
  const serviceCount: Record<string, number> = {};

  // For weekly/monthly ranges
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0,0,0,0);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  allBookings.forEach(b => {
    const amt = Number(b.amount) || 0;
    const dateStr = b.booking_date; // YYYY-MM-DD
    const createdAt = b.created_at ? b.created_at.split('T')[0] : null;
    const bookingDate = new Date(dateStr);
    
    totalRevenue += amt;
    
    // Revenue is counted for "Today" if either it's scheduled for today OR was created/paid today
    if (dateStr === todayStr || createdAt === todayStr) {
      todayRevenue += amt;
    }

    if (dateStr === todayStr) {
      todaysAptCount++;
    }
    
    if (bookingDate >= startOfWeek) weekRevenue += amt;
    if (bookingDate >= startOfMonth) monthRevenue += amt;

    revenueByDay[dateStr] = (revenueByDay[dateStr] || 0) + amt;
    
    const srv = b.service || "Other";
    serviceCount[srv] = (serviceCount[srv] || 0) + 1;
  });

  const financeStats = [todayRevenue, weekRevenue, monthRevenue, totalRevenue];

  const revenueData = Object.entries(revenueByDay)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-7)
    .map(([date, val]) => ({
      name: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      value: val
    }));

  const pastelColors = ['#C66C7A', '#DEAB20', '#449D71', '#5792BC', '#9A63D4', '#E67E22'];
  const serviceData = Object.entries(serviceCount).map(([name, val], idx) => ({
    name,
    value: val,
    color: pastelColors[idx % pastelColors.length]
  }));

  const uniqueServices = Array.from(new Set(allBookings.map((b: any) => b.service))).map(srv => {
    const srvBookings = allBookings.filter(b => b.service === srv);
    return {
      name: srv,
      category: "Online",
      duration: "-",
      price: srvBookings[0]?.amount || 0
    };
  });

  const allClients = Array.from(new Set(allBookings.filter(b => b.name).map(b => b.name))).map((name, i) => {
    const userBookings = allBookings.filter(b => b.name === name);
    const lastBooking = userBookings[0];
    return {
      id: i + 1,
      name: name,
      email: lastBooking?.email || `${name.toLowerCase().replace(/\s/g, '')}@example.com`,
      phone: lastBooking?.phone || "061XXXXXXX",
      visits: userBookings.length,
      spent: userBookings.reduce((acc, b) => acc + (Number(b.amount) || 0), 0)
    };
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-body">
      {/* Sidebar */}
      <aside className={cn(sidebarStyles, sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="h-full flex flex-col">
          <div className="p-8 pb-4 mb-2 flex items-center gap-4">
            <Link to="/" className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden border border-white/20 shadow-md active:scale-95 transition-transform shrink-0">
              <img src={logo} alt="Logo" className="w-full h-full object-contain p-1.5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl font-bold tracking-tight text-white leading-none mb-1 truncate">Qurux Dumar</h2>
              <p className="font-body text-xs text-white/70 tracking-wider">Beauty Salon</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-5 space-y-2 mt-8 overflow-y-auto custom-scrollbar-light">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 font-body text-sm rounded-2xl transition-all duration-500 group relative",
                  activeTab === item.id
                    ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] font-bold backdrop-blur-md"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full"
                  />
                )}
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", activeTab === item.id ? "text-primary opacity-100" : "opacity-60")} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto p-6 border-t border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center font-bold font-body text-sm shadow-sm ring-1 ring-white/30">
                {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"}U
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-body text-sm font-semibold text-white truncate">{user?.user_metadata?.full_name || "Admin User"}</p>
                <p className="font-body text-xs text-white/70 truncate">Admin</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10 p-2 -ml-2 rounded-xl transition-colors text-sm font-body w-full">
              <LogOut className="w-4 h-4 ml-1" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col max-h-screen overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#FAFAFA]/90 backdrop-blur-2xl px-10 py-8 flex items-center justify-between">
          <div className="flex items-center gap-8 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-primary transition-all p-2 bg-white rounded-xl shadow-sm">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative max-w-xl w-full hidden sm:block group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search appointments, clients or services..."
                className="w-full pl-14 pr-6 py-4 bg-white border border-zinc-100 shadow-sm font-body text-sm rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all placeholder:text-zinc-300 text-zinc-700"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-zinc-400 hover:text-primary transition-all hover:bg-white p-3 rounded-2xl shadow-sm bg-white/50 border border-zinc-50">
              <Bell className="w-6 h-6" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-zinc-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-zinc-900 leading-none mb-1">{user?.user_metadata?.full_name || "Admin"}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Salon Manager</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-primary/60 p-[2px] cursor-pointer shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="h-full w-full bg-white rounded-[0.9rem] flex items-center justify-center text-primary font-display font-extrabold text-lg">
                  {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 pt-2 flex-1 relative">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-12 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 px-4">
                  <div className="space-y-3">
                    <h1 className="font-display text-5xl font-black tracking-tighter text-zinc-900 leading-none">Dashboard</h1>
                    <p className="font-body text-zinc-400 font-medium tracking-wide">Welcome back! Here's your salon performance overview.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 rounded-[2rem] px-6 py-4 shadow-sm hover:shadow-md transition-all">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">System Live</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
                  {[
                    { label: 'Total Clients', value: allClients.length, icon: Users, tag: 'CLIENTS', color: 'from-pink-400 to-rose-600', shadow: 'shadow-rose-500/10' },
                    { label: 'Today Appointments', value: todaysAptCount, icon: Calendar, tag: 'SCHEDULE', color: 'from-amber-400 to-orange-600', shadow: 'shadow-orange-500/10' },
                    { label: 'Today Revenue', value: '$' + todayRevenue.toLocaleString(), icon: DollarSign, tag: 'INCOME', color: 'from-emerald-400 to-teal-600', shadow: 'shadow-emerald-500/10' },
                    { label: 'Active Services', value: dbServices.length, icon: Sparkles, tag: 'SERVICES', color: 'from-violet-500 to-purple-600', shadow: 'shadow-purple-500/10' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={cn(
                        "bg-white p-8 rounded-[3.5rem] border border-zinc-50 relative overflow-hidden group transition-all duration-700 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)]",
                        stat.shadow
                      )}
                    >
                      <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className={cn("w-16 h-16 rounded-[1.8rem] flex items-center justify-center bg-gradient-to-br text-white shadow-2xl transform group-hover:rotate-12 transition-all duration-700", stat.color)}>
                          <stat.icon className="w-8 h-8 stroke-[2.5px]" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 group-hover:text-primary transition-colors">{stat.tag}</span>
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-display text-5xl font-black text-zinc-900 tracking-tighter mb-2">{stat.value}</h3>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                      </div>
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-zinc-50 rounded-full group-hover:scale-150 transition-transform duration-1000 pointer-events-none opacity-40 group-hover:bg-primary/5" />
                    </motion.div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-8 px-2">
                  <div className="lg:col-span-8 bg-white p-8 sm:p-12 rounded-[3.5rem] border border-zinc-100 shadow-2xl shadow-zinc-200/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/2 rounded-full blur-3xl -mr-48 -mt-48" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-4 relative z-10">
                      <div>
                        <h2 className="font-display text-2xl font-black text-zinc-900 tracking-tight">Revenue Trend</h2>
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Growth progression over 7 days</p>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Growing</span>
                      </div>
                    </div>
                    
                    <div className="h-[400px] w-full mt-4 relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="rgba(0,0,0,0.03)" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                            dy={15}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                            dx={-10}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '24px', 
                              border: 'none', 
                              boxShadow: '0 30px 60px -15px rgba(0,0,0,0.15)', 
                              padding: '20px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={6}
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                            animationDuration={3000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-zinc-950 text-white p-8 sm:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[120px] -mr-40 -mt-40" />
                    <h2 className="font-display text-2xl font-black w-full mb-10 text-left tracking-tight relative z-10">Service Hub</h2>
                    <div className="h-[300px] w-full relative z-10 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          {serviceData.length > 0 ? (
                            <Pie
                              data={serviceData}
                              cx="50%" cy="50%" innerRadius={85} outerRadius={110}
                              paddingAngle={8}
                              dataKey="value"
                              stroke="none"
                              animationBegin={500}
                              animationDuration={2000}
                            >
                              {serviceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          ) : (
                             <Pie data={[{value: 1, color: '#333'}]} cx="50%" cy="50%" innerRadius={85} outerRadius={110} dataKey="value" stroke="none">
                                <Cell fill="#333" />
                             </Pie>
                          )}
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-white tracking-tighter leading-none">{dbServices.length}</span>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">Active</span>
                      </div>
                    </div>
                    
                    <div className="mt-12 space-y-4 relative z-10">
                      {serviceData.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{item.name}</span>
                          </div>
                          <span className="font-display font-bold text-white">{Math.round((item.value / serviceData.reduce((a, b) => a + b.value, 0)) * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appointments */}
            {activeTab === "appointments" && (
              <div className="space-y-8 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                  <div>
                    <h1 className="font-display text-3xl tracking-tight text-charcoal mb-2">Appointments</h1>
                    <p className="text-primary font-body text-sm">Manage all customer bookings</p>
                  </div>
                  <button
                    onClick={() => setModalType("appointment")}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-body text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add Appointment
                  </button>
                </div>

                <div className={cardStyles}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Client</th>
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Service</th>
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Choice</th>
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Date / Time</th>
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Amount</th>
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allBookings.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-20 text-center text-primary/60 font-body">
                              <div className="flex flex-col items-center justify-center gap-4">
                                <div className="p-6 bg-primary/5 rounded-full">
                                  <Calendar className="w-10 h-10 text-primary/40" />
                                </div>
                                <p className="text-lg text-charcoal font-medium font-display">No bookings yet</p>
                                <p className="text-sm">When customers book, they will appear here.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          allBookings.map((apt) => (
                            <tr key={apt.id} className="border-b border-gray-50 last:border-0 hover:bg-primary/[0.02] transition-colors group">
                              <td className="p-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                    {apt.name?.[0]}
                                  </div>
                                  <div>
                                    <div className="font-body text-sm font-semibold text-charcoal">{apt.name}</div>
                                    <div className="text-xs text-primary/60">{apt.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-6 font-body text-sm text-charcoal/70">{apt.service}</td>
                              <td className="p-6">
                                {apt.image_url ? (
                                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                    <img src={apt.image_url} className="w-full h-full object-cover" alt="Choice" />
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-300">-</span>
                                )}
                              </td>
                              <td className="p-6">
                                <div className="font-body text-sm text-charcoal font-medium">{apt.booking_date}</div>
                                <div className="text-xs text-primary/60 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" /> {apt.booking_time}
                                </div>
                              </td>
                              <td className="p-6 font-body text-base font-bold text-primary">${apt.amount || 0}</td>
                              <td className="p-6 flex items-center gap-2">
                                <div className="flex bg-[#FAFAFA] rounded-xl p-1 border border-gray-100">
                                  <button 
                                    onClick={() => updateStatus(apt.id, "Confirmed")}
                                    className={cn(
                                      "p-2 rounded-lg transition-colors",
                                      apt.status === "Confirmed" ? "bg-emerald-500 text-white shadow-sm" : "text-emerald-600 hover:bg-emerald-50"
                                    )}
                                    title="Confirm"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => updateStatus(apt.id, "Pending Confirmation")}
                                    className={cn(
                                      "p-2 rounded-lg transition-colors",
                                      apt.status === "Pending Confirmation" ? "bg-amber-500 text-white shadow-sm" : "text-amber-600 hover:bg-amber-50"
                                    )}
                                    title="Wait"
                                  >
                                    <Clock className="w-4 h-4" />
                                  </button>
                                </div>
                                <button 
                                  onClick={() => deleteBooking(apt.id)}
                                  className="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Finance Section */}
            {activeTab === "finance" && (
              <div className="space-y-12 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 px-4">
                  <div className="space-y-3">
                    <h1 className="font-display text-5xl font-black tracking-tighter text-zinc-900 leading-none">Payments</h1>
                    <p className="font-body text-zinc-400 font-medium tracking-wide">Manage income and financial performance</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setModalType('payment')} className="bg-primary hover:bg-black text-white px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 transition-all shadow-2xl shadow-primary/30 active:scale-95">
                       <Plus className="w-5 h-5 stroke-[3px]" /> Add Payment
                    </button>
                    <button className="bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-100 px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 transition-all shadow-xl shadow-zinc-200/50 active:scale-95">
                       <TrendingUp className="w-5 h-5 stroke-[2.5px]" /> Report
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
                  {[
                    { label: 'Revenue Today', value: financeStats[0], icon: Clock, tag: 'TODAY', color: 'from-emerald-400 to-teal-600', shadow: 'shadow-emerald-500/10' },
                    { label: 'Weekly Income', value: financeStats[1], icon: TrendingUp, tag: 'WEEKLY', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/10' },
                    { label: 'Monthly Earnings', value: financeStats[2], icon: Calendar, tag: 'MONTHLY', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/10' },
                    { label: 'Net Revenue', value: financeStats[3], icon: DollarSign, tag: 'REVENUE', color: 'from-zinc-800 to-black', shadow: 'shadow-black/10' }
                  ].map((period, i) => (
                    <motion.div 
                      key={period.label}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={cn(
                        "bg-white p-8 rounded-[3.5rem] border border-zinc-50 relative overflow-hidden group transition-all duration-700 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)]",
                        period.shadow
                      )}
                    >
                      <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className={cn("w-16 h-16 rounded-[1.6rem] flex items-center justify-center bg-gradient-to-br text-white shadow-2xl transform group-hover:rotate-12 transition-all duration-700", period.color)}>
                          <period.icon className="w-7 h-7 stroke-[2.5px]" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 group-hover:text-primary transition-colors">{period.tag}</span>
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-display text-5xl font-black text-zinc-900 tracking-tighter mb-2">${period.value.toLocaleString()}</h3>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{period.label}</p>
                      </div>
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-zinc-50 rounded-full group-hover:scale-150 transition-transform duration-1000 pointer-events-none opacity-40 group-hover:bg-primary/5" />
                    </motion.div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-8 bg-white p-8 sm:p-10 rounded-[3rem] border border-zinc-100 shadow-xl shadow-zinc-200/20 relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                      <div>
                        <h2 className="font-display text-2xl font-bold text-zinc-900">Financial Growth</h2>
                        <p className="text-xs text-zinc-400 font-medium tracking-wide mt-1">Daily revenue performance tracking</p>
                      </div>
                      <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-full ring-4 ring-zinc-100">
                         <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                         <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live View</span>
                      </div>
                    </div>
                    
                    <div className="h-[400px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="rgba(0,0,0,0.03)" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                            dy={15}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                            dx={-10}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '24px', 
                              border: 'none', 
                              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.1)', 
                              fontFamily: 'Inter, sans-serif',
                              padding: '15px 20px'
                            }}
                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={5}
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                            animationDuration={2000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-zinc-950 text-white p-8 sm:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[120px] -mr-40 -mt-40 transition-transform group-hover:scale-125 duration-1000" />
                    
                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-10">
                        <div>
                          <h2 className="font-display text-2xl font-bold tracking-tight">Recent Sales</h2>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1">Real-time updates</p>
                        </div>
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                          <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                      </div>

                      <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar-light max-h-[450px]">
                        {allBookings.slice(0, 10).map((b, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={i} 
                            className="bg-white/5 border border-white/5 p-4 rounded-3xl hover:bg-white/10 hover:border-white/10 transition-all duration-300 group/item"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-2xl flex items-center justify-center font-bold text-white shadow-lg group-hover/item:scale-110 transition-transform">
                                  {(b.name || "User")[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold truncate pr-2">{b.name}</p>
                                  <p className="text-[10px] text-primary/80 font-black uppercase tracking-wider">{b.service}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xl font-display font-black text-white tracking-tighter">${b.amount || 0}</p>
                                <div className="flex items-center justify-end gap-1.5 mt-1">
                                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                  <span className="text-[8px] text-emerald-400 font-black uppercase tracking-widest">Paid</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {allBookings.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 opacity-20">
                             <Box className="w-16 h-16 mb-4" />
                             <p className="text-xs font-bold uppercase tracking-widest">No Sales Found</p>
                          </div>
                        )}
                      </div>
                      
                      <button className="w-full mt-8 bg-white hover:bg-primary hover:text-white text-zinc-950 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-500 shadow-xl shadow-black/20 active:scale-95">
                        Download Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Jobs */}
            {activeTab === "jobs" && (
              <div className="space-y-8 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                  <div>
                    <h1 className="font-display text-3xl tracking-tight text-charcoal mb-2">Services</h1>
                    <p className="text-primary font-body text-sm">Ongoing services and queue</p>
                  </div>
                  <button onClick={() => setModalType('service')} className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-body text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                     <Plus className="w-4 h-4" /> Add Service
                  </button>
                </div>

                <div className={cardStyles}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Service Name</th>
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Category</th>
                          <th className="text-center p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Duration</th>
                          <th className="text-right p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Price</th>
                          <th className="text-center p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueServices.length === 0 ? (
                           <tr>
                              <td colSpan={5} className="p-20 text-center text-primary/60 font-body">
                                <div className="flex flex-col items-center justify-center gap-4">
                                  <div className="p-6 bg-primary/5 rounded-full"><Scissors className="w-10 h-10 text-primary/40" /></div>
                                  <p className="text-lg text-charcoal font-medium font-display">No services yet</p>
                                  <p className="text-sm">Once clients book from the website, services will appear here.</p>
                                </div>
                              </td>
                           </tr>
                        ) : uniqueServices.map((serv, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-primary/[0.02] transition-colors group">
                            <td className="p-6 font-body text-sm font-semibold text-charcoal">{serv.name}</td>
                            <td className="p-6 font-body text-sm text-primary/70">{serv.category}</td>
                            <td className="p-6 text-center font-body text-sm text-charcoal/70">
                              <span className="flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary/40"/> {serv.duration}</span>
                            </td>
                            <td className="p-6 text-right font-bold text-primary text-base">${serv.price}</td>
                            <td className="p-6 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-xl"><Edit className="w-4 h-4" /></button>
                                <button className="p-2 text-zinc-400 hover:text-rose-500 transition-colors hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Rentals */}
            {activeTab === "rentals" && (
              <div className="space-y-8 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                  <div>
                    <h1 className="font-display text-3xl tracking-tight text-charcoal mb-2">Dress Rentals</h1>
                    <p className="text-primary font-body text-sm">Manage available dresses and suits</p>
                  </div>
                  <button onClick={() => setModalType('rental')} className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-body text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                     <Plus className="w-4 h-4" /> Add Dress
                  </button>
                </div>

                <div className={cardStyles}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Image</th>
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Dress Name</th>
                          <th className="text-center p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Daily Price</th>
                          <th className="text-center p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbServices.filter(s => s.category === 'Dress').length === 0 ? (
                           <tr>
                              <td colSpan={4} className="p-20 text-center text-primary/60 font-body">
                                <div className="flex flex-col items-center justify-center gap-4">
                                  <div className="p-6 bg-primary/5 rounded-full"><Box className="w-10 h-10 text-primary/40" /></div>
                                  <p className="text-lg text-charcoal font-medium font-display">No dresses yet</p>
                                  <p className="text-sm">Add a dress to display it to your users.</p>
                                </div>
                              </td>
                           </tr>
                        ) : dbServices.filter(s => s.category === 'Dress').map((dress, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-primary/[0.02] transition-colors group">
                            <td className="p-6">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                                {dress.image_url ? <img src={dress.image_url} className="w-full h-full object-cover" alt="Dress" /> : <Box className="w-full h-full p-3 text-gray-300" />}
                              </div>
                            </td>
                            <td className="p-6 font-body text-sm font-semibold text-charcoal">{dress.name}</td>
                            <td className="p-6 text-center font-bold text-primary text-base">${dress.price}</td>
                            <td className="p-6 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => deleteService(dress.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
             {/* Clients */}
            {activeTab === "clients" && (
              <div className="space-y-8 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                  <div>
                    <h1 className="font-display text-3xl tracking-tight text-charcoal mb-2">Clients</h1>
                    <p className="text-primary font-body text-sm">List of your clients and their information</p>
                  </div>
                  <button
                    onClick={() => setModalType("client")}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-body text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add Client
                  </button>
                </div>

                <div className={cardStyles}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Client</th>
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Contact</th>
                          <th className="text-center p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Visits</th>
                          <th className="text-right p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Revenue</th>
                          <th className="text-center p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allClients.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-20 text-center text-primary/60 font-body">
                              <div className="flex flex-col items-center justify-center gap-4">
                                <div className="p-6 bg-primary/5 rounded-full">
                                  <Users className="w-10 h-10 text-primary/40" />
                                </div>
                                <p className="text-lg text-charcoal font-medium font-display">No clients found</p>
                                <p className="text-sm">As clients book appointments, they will be listed here.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          allClients.map((client) => (
                            <tr key={client.id} className="border-b border-gray-50 last:border-0 hover:bg-primary/[0.02] transition-colors group">
                              <td className="p-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-4 ring-primary/10">
                                    {client.name[0]}
                                  </div>
                                  <div className="font-body text-sm font-semibold text-charcoal">{client.name}</div>
                                </div>
                              </td>
                              <td className="p-6 space-y-1">
                                <div className="font-body text-xs text-charcoal flex items-center gap-2">
                                  <Bell className="w-3.5 h-3.5 text-primary/40" /> {client.email}
                                </div>
                                <div className="font-body text-xs text-primary/60 flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-primary/40" /> {client.phone}
                                </div>
                              </td>
                              <td className="p-6 text-center">
                                <span className="bg-[#FAFAFA] border border-gray-100 px-4 py-1.5 rounded-full text-xs font-bold text-charcoal shadow-sm">{client.visits}</span>
                              </td>
                              <td className="p-6 text-right font-bold text-primary text-base">${client.spent || 0}</td>
                              <td className="p-6 text-center">
                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-xl">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button className="p-2 text-zinc-400 hover:text-rose-500 transition-colors hover:bg-rose-50 rounded-xl">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Settings */}
            {activeTab === "settings" && (
              <div className="space-y-8 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                  <div>
                    <h1 className="font-display text-3xl tracking-tight text-charcoal mb-2">Staff</h1>
                    <p className="text-primary font-body text-sm">Manage your staff settings and accounts</p>
                  </div>
                  <button onClick={() => setModalType('staff')} className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-body text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                     <Plus className="w-4 h-4" /> Add Staff
                  </button>
                </div>

                <div className={cardStyles}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Staff Member</th>
                          <th className="text-left p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Role</th>
                          <th className="text-center p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Status</th>
                          <th className="text-center p-6 font-body text-xs text-primary font-semibold uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[] /* Real staff data missing so we start empty */.map((staff: any, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-primary/[0.02] transition-colors group">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-sm ring-1 ring-primary/20">
                                  {staff.name.charAt(0)}
                                </div>
                                <div className="font-body text-sm font-semibold text-charcoal">{staff.name}</div>
                              </div>
                            </td>
                            <td className="p-6 font-body text-sm text-primary/70">{staff.role}</td>
                            <td className="p-6 text-center">
                              <span className={cn("px-3 py-1.5 rounded-full font-body text-[10px] font-bold tracking-wider uppercase shadow-sm", staff.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100')}>
                                {staff.status}
                              </span>
                            </td>
                            <td className="p-6 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-xl"><Edit className="w-4 h-4" /></button>
                                <button className="p-2 text-zinc-400 hover:text-rose-500 transition-colors hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={4} className="p-20 text-center text-primary/60 font-body">
                            <div className="flex flex-col items-center justify-center gap-4">
                              <div className="p-6 bg-primary/5 rounded-full"><UserPlus className="w-10 h-10 text-primary/40" /></div>
                              <p className="text-lg text-charcoal font-medium font-display">No staff configured</p>
                              <p className="text-sm">Click 'Add Staff' to start managing your team.</p>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Dynamic Modal */}
      <AnimatePresence>
        {modalType && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-2xl text-charcoal">
                    Add {modalType === 'appointment' ? 'Appointment' : modalType === 'client' ? 'Customer' : modalType === 'service' ? 'Service' : modalType === 'staff' ? 'Staff Member' : 'Payment'}
                </h3>
                <button onClick={() => setModalType(null)} className="text-primary/40 hover:text-primary transition-colors bg-primary/5 p-2 rounded-full">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleModalSubmit}>
                {modalType === 'appointment' && (
                  <>
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Client Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Phone Number" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Service (e.g., Haircut)" required value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})} />
                     <div className="grid grid-cols-2 gap-4">
                        <input type="date" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none text-charcoal/70" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                        <input type="time" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none text-charcoal/70" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                     </div>
                     <input type="number" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Expected Amount ($)" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                  </>
                )}
                {modalType === 'client' && (
                  <>
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Customer Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Phone Number" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Email Address (optional)" />
                  </>
                )}
                {modalType === 'service' && (
                  <>
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Service Name (e.g., Makeup)" required value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})} />
                     <input type="number" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Price ($)" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Duration (e.g., 60 mins)" />
                  </>
                )}
                {modalType === 'staff' && (
                  <>
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Staff Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Role (e.g., Hair Stylist)" />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </>
                )}
                {modalType === 'payment' && (
                  <>
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Client Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                     <input type="number" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Amount ($)" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Payment Method (e.g., Cash, Card)" />
                  </>
                )}
                {modalType === 'rental' && (
                  <>
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Dress or Suit Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                     <input type="number" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Price Per Day ($)" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Image URL (e.g., https://.../dress.jpg)" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} />
                  </>
                )}
                <button type="submit" className="w-full bg-primary text-white p-4 rounded-2xl font-bold font-body mt-2 hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20">
                  Save Details
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
