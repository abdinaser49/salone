import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, X, Check, Sparkles, Phone, CreditCard, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Services with price and duration
const services = [
  { name: "Hair Styling", price: 85, duration: "60–120 min", icon: "✂️", description: "Cut, color & blowout by master stylists", color: "from-violet-500/10 to-purple-500/10", border: "border-violet-200/50" },
  { name: "Nail Artistry", price: 55, duration: "45–90 min", icon: "💅", description: "Manicure, pedicure & bespoke nail art", color: "from-rose-500/10 to-pink-500/10", border: "border-rose-200/50" },
  { name: "Facial Treatments", price: 120, duration: "60–90 min", icon: "🌿", description: "Rejuvenating facials with premium products", color: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-200/50" },
  { name: "Body & Massage", price: 100, duration: "60–120 min", icon: "🌺", description: "Deep tissue, hot stone & aromatherapy", color: "from-amber-500/10 to-orange-500/10", border: "border-amber-200/50" },
  { name: "Henna Art", price: 65, duration: "60–90 min", icon: "🌸", description: "Intricate bridal & party henna designs", color: "from-rose-500/10 to-yellow-500/10", border: "border-rose-200/50" },
  { name: "Wedding Dress Rental", price: 200, duration: "1 day", icon: "👗", description: "Premium bridal and evening gowns", color: "from-blue-500/10 to-indigo-500/10", border: "border-blue-200/50" },
];

const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

// EVC Plus USSD payment number
const PAYMENT_MERCHANT = "614498649";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
  selectedImage?: string;
}

const BookingModal = ({ isOpen, onClose, preselectedService, selectedImage }: BookingModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("Beauty");
  const [selectedService, setSelectedService] = useState(
    services[0]
  );

  useEffect(() => {
    if (preselectedService && isOpen) {
      const found = services.find(s => s.name === preselectedService) || 
                    (preselectedService.includes("Dress") || preselectedService.includes("Suit") ? services[5] : services[4]);
      setSelectedService(found);
      
      // If it's a specific dress/suit name not in our static list, we might want to keep the name
      if (!services.find(s => s.name === preselectedService)) {
        if (preselectedService.includes("Dress") || preselectedService.includes("Suit")) {
           setSelectedService({ ...services[5], name: preselectedService });
        }
      }
    }
  }, [preselectedService, isOpen]);
  const [selectedEmployee, setSelectedEmployee] = useState("Any");
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("8:00 am");
  const [endTime, setEndTime] = useState("8:00 am");
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || "");
      setPhone(user.user_metadata?.phone || "");
    }
  }, [user]);

  const resetAndClose = () => {
    setStep(1);
    onClose();
  };

  const steps = [
    { id: 1, label: "Time" },
    { id: 2, label: "Service" },
    { id: 3, label: "Details" },
    { id: 4, label: "Payment" },
    { id: 5, label: "Done" },
  ];

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleConfirm = async () => {
    if (!user) {
      toast.error("Waan ka xunnahay, waqti-gii (Session) waa dhacay. Fadlan dib isku diiwaangeli.");
      onClose();
      return;
    }

    const bookingData = {
      client_id: user?.id,
      name: name,
      phone: phone,
      service: selectedImage && (selectedService.name === "Wedding Dress Rental" || selectedService.name === "Henna Art") 
                ? `${selectedService.name} (Selected Style)` 
                : selectedService.name,
      booking_date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      booking_time: startTime,
      status: "Pending Confirmation",
      amount: selectedService.price,
    };

    try {
      const { data, error } = await supabase.from('bookings').insert([bookingData]).select();
      if (error) throw error;
      setStep(5);
      toast.success("Appointment booked!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans text-slate-700 relative">
        
        {/* Stepper Header */}
        <div className="flex w-full border-b shrink-0">
          {steps.map((s) => (
            <div 
              key={s.id}
              className={cn(
                "flex-1 flex items-center justify-center py-4 gap-2 border-r last:border-r-0 transition-colors",
                step === s.id ? "bg-primary text-white" : "bg-[#f8f9fa] text-slate-400"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                step === s.id ? "bg-white/20" : "bg-slate-200"
              )}>
                {s.id}
              </div>
              <span className="text-xs font-bold hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Content Area - Scrollable */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Please select service:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option>Beauty</option>
                      <option>Hair</option>
                      <option>Nails</option>
                      <option>Dress Rentals</option>
                      <option>Henna</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                      value={selectedService?.name}
                      onChange={(e) => setSelectedService(services.find(s => s.name === e.target.value) || services[0])}
                    >
                      {services.map(s => <option key={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      <option>Any</option>
                      <option>Deeqa Axmed</option>
                      <option>Layla Cali</option>
                      <option>Hodan Maxamed</option>
                      <option>Sahra Cabdi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full text-left p-4 bg-slate-50 border-0 rounded-2xl hover:bg-slate-100 flex justify-between items-center text-sm font-medium">
                          {date ? format(date, "PPP") : "Select Date"}
                          <CalendarIcon className="w-4 h-4 text-slate-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-0 shadow-2xl">
                        <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start from</label>
                    <select className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium" value={startTime} onChange={e => setStartTime(e.target.value)}>
                      {timeSlots.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Finish by</label>
                    <select className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium" value={endTime} onChange={e => setEndTime(e.target.value)}>
                      {timeSlots.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Confirm Service</h3>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                   <div className="flex justify-between mb-4">
                      <span className="text-slate-500 text-sm">Selected treatment</span>
                      <span className="font-bold text-primary">{selectedService.name}</span>
                   </div>
                   {selectedImage && (
                     <div className="mb-4 flex flex-col gap-2">
                        <span className="text-slate-500 text-sm">Selected style/item</span>
                        <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                           <img src={selectedImage} className="w-full h-full object-cover" alt="Selected" />
                        </div>
                     </div>
                   )}
                   <div className="flex justify-between mb-4">
                      <span className="text-slate-500 text-sm">Duration</span>
                      <span className="font-medium text-sm">{selectedService.duration}</span>
                   </div>
                   <div className="flex justify-between text-xl font-bold pt-4 border-t">
                      <span>Price</span>
                      <span className="text-slate-900">${selectedService.price}</span>
                   </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Your Details:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <input type="tel" className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium" value={phone} onChange={e => setPhone(e.target.value)} placeholder="061XXXXXXX" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6 flex flex-col items-center py-4">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <CreditCard className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 text-center">Payment Confirmation</h3>
                <p className="text-slate-500 text-center max-w-md text-sm">Please complete the payment of <strong>${selectedService.price}</strong> to confirm your appointment.</p>
                <div className="w-full max-w-sm bg-zinc-900 text-white p-6 rounded-3xl space-y-4 shadow-xl">
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-50">
                      <span>Merchant</span>
                      <span>EVC Plus</span>
                   </div>
                   <div className="text-center text-3xl font-mono font-bold tracking-[0.2em] py-2">
                      {PAYMENT_MERCHANT}
                   </div>
                   <button onClick={() => setPaid(true)} className={cn("w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all", paid ? "bg-emerald-500" : "bg-primary shadow-lg shadow-primary/30")}>
                      {paid ? "Payment Verified" : "I have paid"}
                   </button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="flex flex-col items-center py-6">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                  <Check className="w-10 h-10 stroke-[3px]" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">Done!</h3>
                <p className="text-slate-500 mb-6 text-center">Thank you! Your booking is complete.</p>
                <div className="w-full max-w-sm bg-slate-50 rounded-3xl overflow-hidden mb-8 border border-slate-100">
                   <div className="p-4 border-b bg-white">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Appointment Details</p>
                   </div>
                   <div className="p-5 space-y-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Service</span>
                        <span className="font-bold text-slate-900">{selectedService.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date</span>
                        <span className="font-bold text-slate-900">{format(date, "PPP")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Time</span>
                        <span className="font-bold text-slate-900">{startTime}</span>
                      </div>
                      {selectedImage && (
                        <div className="flex justify-between items-center pt-2">
                           <span className="text-slate-500">Choice</span>
                           <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                             <img src={selectedImage} className="w-full h-full object-cover" alt="Choice" />
                           </div>
                        </div>
                      )}
                   </div>
                </div>
                <button onClick={resetAndClose} className="bg-primary text-white px-12 py-4 rounded-full font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-transform">
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        {step < 5 && (
          <div className="p-6 sm:p-8 border-t bg-[#fdfdfd] flex justify-between items-center shrink-0">
            <button 
              onClick={handleBack}
              disabled={step === 1}
              className="bg-slate-100 text-slate-500 px-8 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={step === 4 ? handleConfirm : handleNext}
              className="bg-primary text-white px-8 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              {step === 4 ? "Complete" : "Next"}
            </button>
          </div>
        )}
        
        {/* Close button X */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors sm:hidden"
        >
          <X className="w-6 h-6" />
        </button>

      </div>
    </div>
  );
};

export default BookingModal;
