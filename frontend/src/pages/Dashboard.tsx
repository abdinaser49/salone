import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, X,
  ChevronDown, Bell, Search, Plus, MoreHorizontal, Edit, Trash2,
  Phone, CheckCircle2, Check, Clock, DollarSign, Briefcase, TrendingUp,
  ArrowUpRight, ArrowDownRight, CreditCard, Sparkles, Scissors, Box, UserPlus,
  Upload, Loader2, ImagePlus
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import hairImg from "@/assets/hair.jpg";
import nailImg from "@/assets/Nail Art1.jpg";
import facialImg from "@/assets/makeup.jpg";
import bodyImg from "@/assets/service-massage.png";
import aromaticHenna from "@/assets/henna.jpg";
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

type Tab = "overview" | "appointments" | "finance" | "jobs" | "clients" | "settings" | "rentals" | "reports";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const activeEmail = user?.email || "";
  const isAdmin = activeEmail && import.meta.env.VITE_ADMIN_EMAILS?.includes(activeEmail);
  const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? "overview" : "appointments");

  useEffect(() => {
    if (!isAdmin && ["overview", "jobs", "settings", "reports"].includes(activeTab)) {
      setActiveTab("appointments");
    }
  }, [isAdmin, activeTab]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"appointment" | "client" | "service" | "staff" | "payment" | "rental" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    fetchStaff();
    fetchCustomers();
    
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

    const staffChannel = supabase
      .channel('staff-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        () => fetchStaff()
      )
      .subscribe();

    const customersChannel = supabase
      .channel('customers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => fetchCustomers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(customersChannel);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `dress-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('services')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image: publicUrl });
      toast.success("Sawirka si fiican ayaa loo soo rartay!");
    } catch (error: any) {
      toast.error("Sawirka lama soo rari karo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error("Error loading staff:", error.message);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error("Error loading customers:", error.message);
    }
  };

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

  const deleteStaff = async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProfiles(prev => prev.filter(s => s.id !== id));
      toast.success("Staff member deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete staff: " + error.message);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success("Customer deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete customer: " + error.message);
    }
  };

  const openEditClient = (item: any) => {
    setEditingId(item.id);
    setFormData({ ...formData, name: item.name, phone: item.phone, description: item.email || "" });
    setModalType('client');
  };

  const openEditStaff = (item: any) => {
    setEditingId(item.id);
    setFormData({ ...formData, name: item.name || item.full_name || "", phone: item.phone || "", description: item.role || "" });
    setModalType('staff');
  };

  const openEditService = (item: any, isRental: boolean = false) => {
    setEditingId(item.id);
    setFormData({ ...formData, name: isRental ? item.name : "", service: isRental ? "" : item.name, description: item.description || "", amount: item.price.toString(), duration: item.duration || "", image: item.image_url || "" });
    setModalType(isRental ? 'rental' : 'service');
  };

  const openEditBooking = (item: any) => {
    setEditingId(item.id);
    setFormData({ ...formData, name: item.name, phone: item.phone, service: item.service, date: item.booking_date, time: item.booking_time, amount: item.amount.toString() });
    setModalType('appointment');
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
        const payload = {
          name: formData.name,
          phone: formData.phone,
          service: modalType === 'payment' ? "KIDMID (Payment)" : formData.service,
          booking_date: formData.date || new Date().toISOString().split('T')[0],
          booking_time: formData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          amount: parseFloat(formData.amount) || 0,
          status: "Confirmed"
        };
        const { error } = editingId
          ? await supabase.from('bookings').update(payload).eq('id', editingId)
          : await supabase.from('bookings').insert([payload]);

        if (error) throw error;
        toast.success(editingId ? "Ballanta waa la badalay." : "Hambalyo! Ballanta si fiican ayaa loo xareeyay.");
      } else if (modalType === 'service') {
        const payload = {
          name: formData.service || formData.name,
          description: formData.description,
          price: parseFloat(formData.amount) || 0,
          duration: formData.duration || "45 min",
          image_url: formData.image,
          category: "General Salon"
        };
        const { error } = editingId
          ? await supabase.from('services').update(payload).eq('id', editingId)
          : await supabase.from('services').insert([payload]);

        if (error) throw error;
        toast.success(editingId ? "Adeegga waa la badalay." : "Hambalyo! Adeeg qeybta Online-ka waa la xareeyay.");
      } else if (modalType === 'rental') {
        const payload = {
          name: formData.name,
          description: formData.description || "Wedding Dress Rental",
          price: parseFloat(formData.amount) || 0,
          image_url: formData.image,
          duration: "1 day",
          category: "Dress"
        };
        const { error } = editingId
          ? await supabase.from('services').update(payload).eq('id', editingId)
          : await supabase.from('services').insert([payload]);

        if (error) throw error;
        toast.success(editingId ? "Dharka Rental-ka waa la badalay." : "Hambalyo! Dharka Rental-ka si fiican ayaa loo xareeyay.");
      } else if (modalType === 'staff') {
        const payload = {
          name: formData.name,
          phone: formData.phone,
          role: formData.description || "Stylist"
        };
        const { error } = editingId
          ? await supabase.from('staff').update(payload).eq('id', editingId)
          : await supabase.from('staff').insert([payload]);
        
        if (error) throw error;
        toast.success(editingId ? "Shaqaalaha waa la badalay." : "Hambalyo! Shaqaale cusub ayaa la soo xareeyay.");
        fetchStaff();
      } else if (modalType === 'client') {
        const payload = {
          name: formData.name,
          phone: formData.phone,
          email: formData.description
        };
        const { error } = editingId
          ? await supabase.from('customers').update(payload).eq('id', editingId)
          : await supabase.from('customers').insert([payload]);
        
        if (error) throw error;
        toast.success(editingId ? "Macmiilka waa la badalay." : "Hambalyo! Macmiilka si fiican ayaa loo xareeyay.");
        fetchCustomers();
      }
      
      setModalType(null);
      setEditingId(null);
      setFormData({ name: "", phone: "", service: "", date: "", time: "", amount: "", description: "", duration: "", image: "" });
      fetchBookings();
      fetchServices();
      fetchStaff();
      fetchCustomers();
    } catch (error: any) {
      toast.error("Xogta lama soo xareyn karo: " + error.message);
    }
  };

  // Only show real data — no fake/fallback data
  const allBookings = bookings;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Modern UI colors matching the brand
  const navItems: { id: Tab; label: string; icon: any }[] = isAdmin ? [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "clients", label: "Customers", icon: Users },
    { id: "jobs", label: "Services", icon: Scissors },
    { id: "rentals", label: "Dress Rentals", icon: Box },
    { id: "settings", label: "Staff", icon: UserPlus },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "finance", label: "Payments", icon: CreditCard },
    { id: "reports", label: "Reports", icon: TrendingUp },
  ] : [
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "clients", label: "Customers", icon: Users },
    { id: "finance", label: "Payments", icon: CreditCard },
    { id: "rentals", label: "Dress Rentals", icon: Box },
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

  const allClients = customers.length > 0 ? customers : Array.from(new Set(allBookings.filter(b => b.name).map(b => b.name))).map((name, i) => {
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
          <div className="p-6 pb-2 mb-2 flex items-center gap-3">
            <Link to="/" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden border border-white/20 shadow-md transform transition-all active:scale-95 shrink-0">
              <img src={logo} alt="Logo" className="w-full h-full object-contain p-1" />
            </Link>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl font-bold tracking-tight text-white leading-none mb-1 truncate">Qurux Dumar</h2>
              <p className="font-body text-[10px] text-white/50 tracking-widest uppercase">Management</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto custom-scrollbar-light">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 font-body text-xs rounded-xl transition-all group relative",
                  activeTab === item.id
                    ? "bg-white/10 text-white font-bold"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
              >
                {activeTab === item.id && (
                  <div className="absolute left-0 w-1 h-5 bg-white rounded-r-full" />
                )}
                <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === item.id ? "text-white opacity-100" : "opacity-40")} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto p-4 border-t border-white/5">
            <button onClick={handleSignOut} className="flex items-center gap-2 text-white/40 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-colors text-[11px] font-bold uppercase tracking-widest w-full justify-center">
              <LogOut className="w-4 h-4" />
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
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-8 py-4 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-6 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-primary p-2 bg-white rounded-lg border border-zinc-100 shadow-sm">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative max-w-lg w-full hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 font-body text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/5 focus:border-primary/20 transition-all text-zinc-700"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative text-zinc-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-zinc-50">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-zinc-100">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-zinc-900">{user?.user_metadata?.full_name || (isAdmin ? "Admin" : "Cashier")}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{isAdmin ? "Manager" : "Staff / Cashier"}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 pt-2 flex-1 relative">
          <div key={activeTab}>
            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-8 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4">
                  <div className="space-y-1">
                    <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 leading-none">Dashboard</h1>
                    <p className="font-body text-zinc-400 font-medium text-sm">Welcome back! Performance overview.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-2 shadow-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">System Live</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                  {[
                    { label: 'Total Clients', value: allClients.length, icon: Users, tag: 'CLIENTS', color: 'bg-rose-500', shadow: 'shadow-rose-500/5' },
                    { label: 'Today Appointments', value: todaysAptCount, icon: Calendar, tag: 'SCHEDULE', color: 'bg-orange-500', shadow: 'shadow-orange-500/5' },
                    { label: 'Today Revenue', value: '$' + todayRevenue.toLocaleString(), icon: DollarSign, tag: 'INCOME', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/5' },
                    { label: 'Active Services', value: dbServices.length, icon: Sparkles, tag: 'SERVICES', color: 'bg-purple-500', shadow: 'shadow-purple-500/5' }
                  ].map((stat) => (
                    <div 
                      key={stat.label}
                      className={cn(
                        "bg-white p-6 rounded-2xl border border-zinc-50 relative overflow-hidden group transition-all",
                        stat.shadow
                      )}
                    >
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", stat.color)}>
                          <stat.icon className="w-6 h-6 stroke-[2.5px]" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">{stat.tag}</span>
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-display text-3xl font-black text-zinc-900 tracking-tight mb-1">{stat.value}</h3>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                      </div>
                    </div>
                  ))}
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
              <div className="space-y-6 pb-10 text-left">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-4">
                  <div className="space-y-1">
                    <h1 className="font-display text-2xl font-black text-zinc-900 leading-none">Payments & Sales</h1>
                    <p className="font-body text-zinc-400 font-medium text-[10px] uppercase tracking-widest">Transaction History</p>
                  </div>
                  <button onClick={() => setModalType('payment')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95">
                     <Plus className="w-4 h-4 stroke-[3px]" /> New Sale
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                  {[
                    { label: 'Today', value: financeStats[0], color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Clock },
                    { label: 'Weekly', value: financeStats[1], color: 'text-blue-600', bg: 'bg-blue-50', icon: TrendingUp },
                    { label: 'Monthly', value: financeStats[2], color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Calendar },
                    { label: 'Total', value: financeStats[3], color: 'text-zinc-900', bg: 'bg-zinc-100', icon: DollarSign }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                         <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bg)}>
                            <stat.icon className={cn("w-4 h-4", stat.color)} />
                         </div>
                         <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                      </div>
                      <h3 className={cn("text-2xl font-black tracking-tight", stat.color)}>${stat.value.toLocaleString()}</h3>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden mx-2">
                  <div className="p-5 border-b border-zinc-50 bg-zinc-50/30 flex justify-between items-center text-left">
                    <h3 className="font-display font-bold text-xs uppercase tracking-widest text-zinc-400">Recent Transactions</h3>
                    <CreditCard className="w-4 h-4 text-zinc-200" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white border-b border-zinc-50">
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Customer</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Service</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Date</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Amount</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allBookings.slice(0, 15).map((b, i) => (
                          <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                            <td className="p-4">
                               <p className="text-xs font-bold text-zinc-900">{b.name}</p>
                               <p className="text-[9px] text-zinc-400">{b.phone}</p>
                            </td>
                            <td className="p-4">
                               <span className="text-[10px] font-bold px-2 py-1 bg-zinc-100 text-zinc-600 rounded-md">{b.service}</span>
                            </td>
                            <td className="p-4 text-[10px] text-zinc-400 text-center font-medium">{b.booking_date}</td>
                            <td className="p-4 text-right font-black text-xs text-zinc-900">${b.amount || 0}</td>
                            <td className="p-4 text-center">
                               <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">Paid</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Section */}
            {activeTab === "reports" && (
              <div className="space-y-8 pb-10 text-left">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4">
                  <div className="space-y-1">
                    <h1 className="font-display text-2xl font-black text-zinc-900 leading-none">Business Reports</h1>
                    <p className="font-body text-zinc-400 font-medium text-[10px] uppercase tracking-widest">Growth & Trends</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-6 px-2">
                  <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm text-left">
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-8">Revenue Growth (7 Days)</h2>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="reportRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6D1B4B" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#6D1B4B" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                          <Area type="monotone" dataKey="value" stroke="#6D1B4B" strokeWidth={3} fill="url(#reportRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 text-white p-6 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-8">Service Share</h2>
                    <div className="h-[200px] w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          {serviceData.length > 0 ? (
                            <Pie data={serviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                              {serviceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                          ) : (
                             <Pie data={[{value: 1, color: '#333'}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none"><Cell fill="#333" /></Pie>
                          )}
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-8 space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar-light">
                      {serviceData.slice(0, 10).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px] font-bold">
                          <div className="flex items-center gap-2 min-w-0">
                             <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                             <span className="text-zinc-400 capitalize truncate">{item.name}</span>
                          </div>
                          <p className="shrink-0 ml-2">{Math.round((item.value / (serviceData.reduce((a, b) => a + b.value, 0) || 1)) * 100)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "jobs" && (
              <div className="space-y-8 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4">
                  <div className="space-y-1">
                    <h1 className="font-display text-3xl font-black text-zinc-900 leading-none">Salon Services</h1>
                    <p className="font-body text-zinc-400 font-medium text-sm">Manage treatments and pricing</p>
                  </div>
                  <button onClick={() => setModalType('service')} className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-body text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95">
                     <Plus className="w-4 h-4" /> 
                     Add Service
                  </button>
                </div>

                <div className={cardStyles}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                          <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Service Details</th>
                          <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Duration</th>
                          <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Price</th>
                          <th className="text-center p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbServices.filter(s => s.category !== 'Dress').length === 0 ? (
                           <tr>
                              <td colSpan={4} className="p-20 text-center">
                                <div className="flex flex-col items-center justify-center gap-4">
                                  <div className="p-6 bg-rose-50 rounded-full"><Scissors className="w-10 h-10 text-rose-200" /></div>
                                  <p className="text-lg text-zinc-900 font-black font-display uppercase tracking-tight">No Services Configured</p>
                                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest whitespace-pre-wrap">Click 'Add Service' to populate your salon menu.</p>
                                </div>
                              </td>
                           </tr>
                        ) : dbServices.filter(s => s.category !== 'Dress').map((serv, i) => (
                          <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors group">
                            <td className="p-6">
                              <p className="font-display font-bold text-sm text-zinc-900 uppercase tracking-tight">{serv.name}</p>
                              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{serv.category || 'General'}</p>
                            </td>
                            <td className="p-6 text-center">
                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                <Clock className="w-3 h-3" /> {serv.duration || "30 min"}
                              </span>
                            </td>
                            <td className="p-6 text-right font-display font-black text-emerald-600 text-base">${serv.price}</td>
                            <td className="p-6 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => openEditService(serv, false)}
                                  className="p-3 text-zinc-300 hover:text-primary hover:bg-zinc-50 rounded-2xl transition-all"
                                  title="Edit Service"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteService(serv.id)}
                                  className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                  title="Delete Service"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4">
                  <div className="space-y-1">
                    <h1 className="font-display text-3xl font-black text-zinc-900 leading-none">Dress Rentals</h1>
                    <p className="font-body text-zinc-400 font-medium text-sm">Collection management center</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={async () => {
                        if(window.confirm("Ma rabtaa inaad soo xareyso dhamaan dharka (Dirac & Gowns) oo ku jira online-ka?")) {
                          const supabaseBaseUrl = "https://zimvwvxwvykdxrkmtaqv.supabase.co/storage/v1/object/public/services/";
                          const defaultRentals = [
                            { name: "Luxury Somali Dirac", image_url: `${supabaseBaseUrl}dirac.jpg`, price: 15, category: "Dress", duration: "1 day", description: "Somali Style" },
                            { name: "Traditional Bridal Dirac", image_url: `${supabaseBaseUrl}dirac1.jpg`, price: 15, category: "Dress", duration: "1 day", description: "Classic" },
                            { name: "Modern Pattern Dirac", image_url: `${supabaseBaseUrl}dirac2.jpg`, price: 15, category: "Dress", duration: "1 day", description: "New" },
                            { name: "Elegant Evening Dirac", image_url: `${supabaseBaseUrl}dirac5.jpg`, price: 15, category: "Dress", duration: "1 day", description: "Trending" },
                            { name: "Royal Silk Dirac", image_url: `${supabaseBaseUrl}dirac6.jpg`, price: 15, category: "Dress", duration: "1 day", description: "Premium" },
                            { name: "Royal Lace Wedding Gown", image_url: `${supabaseBaseUrl}Weddin1.jpg`, price: 200, category: "Dress", duration: "1 day", description: "Hot" },
                            { name: "Classic Pearl Dress", image_url: `${supabaseBaseUrl}Weddin2.jpg`, price: 180, category: "Dress", duration: "1 day", description: "Elegant" },
                            { name: "Classic Groom Suit", image_url: `${supabaseBaseUrl}suit.jpg`, price: 150, category: "Dress", duration: "1 day", description: "New" },
                            { name: "Modern Elegance Suit", image_url: `${supabaseBaseUrl}suit1.jpg`, price: 160, category: "Dress", duration: "1 day", description: "Premium" },
                            { name: "Princess Silhouette", image_url: `${supabaseBaseUrl}dress2.jpg`, price: 250, category: "Dress", duration: "1 day", description: "Luxury" },
                            { name: "Crystal Embellished", image_url: `${supabaseBaseUrl}dress3.jpg`, price: 280, category: "Dress", duration: "1 day", description: "Exclusive" },
                            { name: "Satin Mermaid Dress", image_url: `${supabaseBaseUrl}dress4.jpg`, price: 190, category: "Dress", duration: "1 day", description: "Classic" },
                            { name: "Bohemian Chiffon", image_url: `${supabaseBaseUrl}dress5.jpg`, price: 160, category: "Dress", duration: "1 day", description: "Trending" },
                          ];
                          
                          try {
                            const { error } = await supabase.from('services').insert(defaultRentals);
                            if (error) throw error;
                            toast.success("Hambalyo! Dhamaan collection-ka waa la soo xareeyay.");
                            fetchServices();
                          } catch (e: any) {
                            toast.error("Xogta lama soo xareyn karo: " + e.message);
                          }
                        }
                      }}
                      className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-body text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Import Online Data
                    </button>
                    <button 
                      onClick={() => setModalType('rental')} 
                      className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-body text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> 
                      Add New Rental
                    </button>
                  </div>
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
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-zinc-50 rounded-2xl border-2 border-zinc-100/50 overflow-hidden shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center">
                                  {dress.image_url ? (
                                    <img src={dress.image_url} className="w-full h-full object-cover" alt="Dress" />
                                  ) : (
                                    <Box className="w-full h-full p-4 text-zinc-200" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-display font-bold text-zinc-900 uppercase tracking-tight">{dress.name}</p>
                                  <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1">
                                    {dress.description || "Collection Item"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <p className="text-base font-black text-emerald-600 tracking-tighter">${dress.price}</p>
                              <p className="text-[9px] text-zinc-400 uppercase font-black tracking-widest">Per Day</p>
                            </td>
                            <td className="p-6 text-center">
                               <button 
                                 onClick={() => {
                                   if(window.confirm(`Ma rabtaa inaad tirtirto: ${dress.name}?`)) {
                                     deleteService(dress.id);
                                   }
                                 }}
                                 className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                 title="Delete Rental"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Rental Management Board */}
                <div className="mt-12 bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden mx-2">
                  <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-xl font-black text-zinc-900 tracking-tight leading-none uppercase tracking-widest">Rental Management Board</h2>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Track dress rentals and return status</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-zinc-50/50">
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Client</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Dress Item</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Duration</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Date</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allBookings.filter(b => 
                          b.category === 'rentals' ||
                          b.service.toLowerCase().includes("rental") ||
                          b.service.toLowerCase().includes("days")
                        ).length === 0 ? (
                           <tr>
                             <td colSpan={5} className="p-20 text-center opacity-20 italic text-xs font-bold uppercase tracking-widest">No active rentals found</td>
                           </tr>
                        ) : (
                          allBookings.filter(b => 
                            b.category === 'rentals' ||
                            b.service.toLowerCase().includes("rental") ||
                            b.service.toLowerCase().includes("days")
                          ).slice(0, 15).map((b, i) => (
                            <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors group">
                              <td className="p-6">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-black text-[10px]">{b.name[0]}</div>
                                   <div>
                                     <p className="text-xs font-black text-zinc-900 leading-none">{b.name}</p>
                                     <p className="text-[9px] text-zinc-400 mt-1">{b.phone}</p>
                                   </div>
                                 </div>
                              </td>
                              <td className="p-6">
                                 <div className="flex items-center gap-3">
                                   {b.image_url && (
                                     <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-100">
                                       <img src={b.image_url} className="w-full h-full object-cover" alt="" />
                                     </div>
                                   )}
                                   <span className="text-[9px] font-black px-3 py-1 bg-zinc-100 text-zinc-500 rounded-lg uppercase tracking-wider">{b.service}</span>
                                 </div>
                              </td>
                              <td className="p-6 text-center">
                                 <span className="text-[10px] font-bold text-zinc-600">{b.booking_time}</span>
                              </td>
                              <td className="p-6 text-center">
                                 <p className="text-[10px] font-black text-zinc-900">{b.booking_date}</p>
                              </td>
                               <td className="p-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                   <button 
                                     onClick={() => {
                                       if(window.confirm(`Ma xaqiijinaysaa in dharkii dib loo soo celiyay: ${b.name}?`)) {
                                         deleteBooking(b.id);
                                       }
                                     }}
                                     className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors"
                                   >
                                     Returned
                                   </button>
                                   <button 
                                     onClick={() => openEditBooking(b)}
                                     className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-xl"
                                     title="Edit Booking"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </button>
                                   <button 
                                     onClick={() => deleteBooking(b.id)}
                                     className="p-2 text-rose-300 hover:text-rose-600 transition-colors"
                                     title="Delete Booking"
                                   >
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
                                  <button onClick={() => openEditClient(client)} className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-xl">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => deleteCustomer(client.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors hover:bg-rose-50 rounded-xl">
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

            {activeTab === "settings" && (
              <div className="space-y-8 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4">
                  <div className="space-y-1">
                    <h1 className="font-display text-3xl font-black text-zinc-900 leading-none">Our Team</h1>
                    <p className="font-body text-zinc-400 font-medium text-sm">Manage salon staff members</p>
                  </div>
                  <button onClick={() => setModalType('staff')} className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-body text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95">
                     <Plus className="w-4 h-4" /> 
                     Add Staff
                  </button>
                </div>

                <div className={cardStyles}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                          <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Staff Member</th>
                          <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Contact</th>
                          <th className="text-center p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                          <th className="text-center p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.length === 0 ? (
                           <tr>
                              <td colSpan={4} className="p-20 text-center">
                                <div className="flex flex-col items-center justify-center gap-4">
                                  <div className="p-6 bg-rose-50 rounded-full"><Users className="w-10 h-10 text-rose-200" /></div>
                                  <p className="text-lg text-zinc-900 font-black font-display uppercase tracking-tight">No Staff Found</p>
                                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest whitespace-pre-wrap">Click 'Add Staff' to start building your professional team.</p>
                                </div>
                              </td>
                           </tr>
                        ) : profiles.map((staff, i) => (
                          <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors group">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-zinc-100 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center font-display font-black text-primary text-xl uppercase ring-4 ring-zinc-50">
                                  {staff.avatar_url ? <img src={staff.avatar_url} className="w-full h-full object-cover" alt="Staff" /> : (staff.name?.[0] || staff.full_name?.[0] || 'S')}
                                </div>
                                <div>
                                  <p className="font-display font-bold text-sm text-zinc-900 uppercase tracking-tight">{staff.name || staff.full_name || 'Anonymous'}</p>
                                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{staff.role || 'Professional Stylist'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <Phone className="w-3 h-3 text-primary/40" /> {staff.phone || "No Phone"}
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                              </span>
                            </td>
                            <td className="p-6 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => openEditStaff(staff)}
                                  className="p-3 text-zinc-300 hover:text-primary hover:bg-zinc-50 rounded-2xl transition-all"
                                  title="Edit Staff"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteStaff(staff.id)}
                                  className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                  title="Remove Staff"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
          </div>
        </div>
      </main>

      {modalType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border border-zinc-100 max-h-[95vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-2xl text-charcoal">
                    {modalType === 'appointment' ? 'Add Appointment' : 
                     modalType === 'client' ? 'Add Customer' : 
                     modalType === 'service' ? 'Add Salon Service' : 
                     modalType === 'staff' ? 'Add Staff Member' : 
                     modalType === 'rental' ? 'Add Dress Rental' : 'Add Payment'}
                </h3>
                <button onClick={() => { setModalType(null); setEditingId(null); setFormData({ name: "", phone: "", service: "", date: "", time: "", amount: "", description: "", duration: "", image: "" }); }} className="text-primary/40 hover:text-primary transition-colors bg-primary/5 p-2 rounded-full">
                  <X className="w-5 h-5"/>
                </button>
              </div>

               <form className="space-y-6" onSubmit={handleModalSubmit}>
                {modalType === 'appointment' && (
                  <>
                     <div className="grid grid-cols-2 gap-4">
                        <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Client Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Phone Number" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                     </div>

                     <div className="space-y-3 bg-[#fdfbf7] p-4 rounded-3xl border border-gray-100">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center justify-between">
                           <span>Choose Image Service</span>
                           <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">Visual</span>
                        </label>
                        <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto custom-scrollbar p-1">
                           {(dbServices.filter(s => s.category !== 'Dress').length > 0 ? dbServices : [
                              { name: "Facial Treatment", price: 120, image_url: facialImg, category: "beauty" },
                              { name: "Body & Massage", price: 100, image_url: bodyImg, category: "beauty" },
                              { name: "Hair Styling", price: 85, image_url: hairImg, category: "hair" },
                              { name: "Nail Artistry", price: 55, image_url: nailImg, category: "nails" },
                              { name: "Henna Session", price: 65, image_url: aromaticHenna, category: "henna" },
                              ...dbServices
                           ]).map((srv, idx) => (
                             <button
                               type="button"
                               key={idx}
                               onClick={() => setFormData({...formData, service: srv.name, amount: srv.price.toString()})}
                               className={cn(
                                 "flex flex-col items-center gap-2 p-3 rounded-[1.5rem] border-2 transition-all group",
                                 formData.service === srv.name ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-slate-100 bg-white hover:border-primary/30"
                               )}
                             >
                               <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-100 group-hover:scale-105 transition-transform">
                                 {srv.image_url ? (
                                   <img src={srv.image_url} className="w-full h-full object-cover" alt={srv.name} />
                                 ) : (
                                   <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs">{srv.name.charAt(0)}</div>
                                 )}
                               </div>
                               <div className="text-center w-full">
                                 <p className={cn("text-[9px] font-bold truncate leading-tight uppercase tracking-wider", formData.service===srv.name ? "text-primary" : "text-charcoal")}>{srv.name}</p>
                                 <p className="text-[10px] text-gray-400 font-bold mt-0.5">${srv.price}</p>
                               </div>
                             </button>
                           ))}
                        </div>
                     </div>

                     <div className="relative mt-2">
                         <div className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-black uppercase text-gray-400 tracking-widest z-10">Or Type Custom Service</div>
                         <input className="w-full p-4 bg-white rounded-2xl text-sm font-bold text-charcoal border-2 border-gray-100 focus:border-primary/50 focus:bg-white transition-all outline-none shadow-inner" placeholder="E.g. Special Bridal Makeup" required value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})} />
                     </div>

                     <div className="grid grid-cols-2 gap-4 mt-4">
                        <input type="date" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-bold border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none text-charcoal/70" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                        <input type="time" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-bold border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none text-charcoal/70" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                     </div>
                     <input type="number" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Expected Amount ($)" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                  </>
                )}
                {modalType === 'client' && (
                  <>
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Customer Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Phone Number" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Email Address (optional)" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </>
                )}
                {modalType === 'service' && (
                  <>
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Service Name (e.g., Makeup)" required value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})} />
                     <div className="grid grid-cols-2 gap-4">
                        <input type="number" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Price ($)" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                        <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Duration (e.g., 60 mins)" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
                     </div>
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative w-full h-32 bg-[#FAFAFA] border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 hover:bg-primary/[0.01] transition-all"
                     >
                        <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           accept="image/*" 
                           onChange={handleFileUpload} 
                        />
                        {uploading ? (
                           <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 text-primary animate-spin" />
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sawirka waa la rabaa...</span>
                           </div>
                        ) : formData.image ? (
                           <div className="relative w-full h-full p-2">
                              <img src={formData.image} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                                 <span className="text-[10px] font-bold text-white uppercase">Bedel Sawirka</span>
                              </div>
                           </div>
                        ) : (
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-400 group-hover:text-primary group-hover:scale-110 transition-all">
                                 <ImagePlus className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-charcoal transition-colors">Kusoo Dar Sawirka Adeegga</span>
                           </div>
                        )}
                     </div>
                  </>
                )}
                {modalType === 'staff' && (
                  <>
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Staff Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Role (e.g., Hair Stylist)" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </>
                )}
                {modalType === 'payment' && (
                  <>
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Client Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                     <input type="number" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Amount ($)" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Payment Method (e.g., Cash, Card)" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </>
                )}
                {modalType === 'rental' && (
                  <div className="space-y-4">
                     <input className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Dress or Suit Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                     <input type="number" className="w-full p-4 bg-[#FAFAFA] rounded-2xl text-sm font-body border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Price Per Day ($)" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                     
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative w-full h-32 bg-[#FAFAFA] border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 hover:bg-primary/[0.01] transition-all"
                     >
                        <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           accept="image/*" 
                           onChange={handleFileUpload} 
                        />
                        {uploading ? (
                           <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 text-primary animate-spin" />
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sawirka waa la rabaa...</span>
                           </div>
                        ) : formData.image ? (
                           <div className="relative w-full h-full p-2">
                              <img src={formData.image} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                                 <span className="text-[10px] font-bold text-white uppercase">Bedel Sawirka</span>
                              </div>
                           </div>
                        ) : (
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-400 group-hover:text-primary group-hover:scale-110 transition-all">
                                 <ImagePlus className="w-5 h-5" />
                              </div>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Guji si aad u soo rarto sawir</span>
                           </div>
                        )}
                     </div>
                  </div>
                )}
                <button type="submit" className="w-full bg-primary text-white p-4 rounded-2xl font-bold font-body mt-2 hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20">
                  Save Details
                </button>
              </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
