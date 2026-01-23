import { useState, useEffect } from 'react';
import { Truck, Calculator, Calendar } from 'lucide-react';
import PricingCalculator from './components/PricingCalculator';
import FreightCalculator from './components/FreightCalculator';
import SupplySchedule from './components/SupplySchedule';
import SavedArchives from './components/SavedArchives';
import Login from './components/Login';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('calculator');
  const [isLoading, setIsLoading] = useState(true);

  // --- Auth & Initial Load Logic ---
  useEffect(() => {
    // 0. Secret Master Access Check
    if (localStorage.getItem('leocalc_master_access') === 'true') {
      setSession({ user: { email: 'chhabhayanikhar@gmail.com', role: 'master' } });
      setIsLoading(false);
      return;
    }

    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Helper to load from local storage (Lifted) ---
  const loadState = (key, fallback) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  };

  // --- Calculator State ---
  const [pricingInputs, setPricingInputs] = useState({
    ppRate: 115.42,
    conversionCost: 28.35,
    bagWeight: 185,
    transportPerBag: 2.50,
    profitMargin: 18
  });

  const [freightInputs, setFreightInputs] = useState({
    unit: 'm',
    vehicleL: 12.03,
    vehicleW: 2.35,
    vehicleH: 2.39,
    baleL: 1.2,
    baleW: 1.0,
    baleH: 1.1,
    baleSize: 0,
    freightCharge: 50000,
    efficiency: 92,
    palletCapacity: 450,
    customCount: ''
  });

  // --- Supply Schedule State (Lifted) ---
  const [poDetails, setPoDetails] = useState(() => loadState('leocalc_poDetails', {
    customerName: 'Global Sacks Inc.',
    customerEmail: '',
    poNumber: '2024-LEO-885',
    totalQty: 100000,
  }));

  const [vendors, setVendors] = useState(() => loadState('leocalc_vendors', [
    { name: 'Vendor A', email: '', allocatedQty: 40000 },
    { name: 'Vendor B', email: '', allocatedQty: 60000 }
  ]));

  const [supplies, setSupplies] = useState(() => loadState('leocalc_supplies', [
    { id: 1, week: '4th week of October', vendor: 'Vendor A', plannedQty: 5000, date: '2023-10-12', status: 'Confirmed', notes: 'Initial batch per agreement' },
    { id: 2, week: '1st week of November', vendor: 'Vendor B', plannedQty: 12000, date: '2023-10-15', status: 'Pending', notes: '-' },
    { id: 3, week: '2nd week of November', vendor: 'Vendor A', plannedQty: 8000, date: '2023-10-20', status: 'Confirmed', notes: 'Expedited shipping requested' },
  ]));

  // Persistence Effects
  useEffect(() => { localStorage.setItem('leocalc_poDetails', JSON.stringify(poDetails)); }, [poDetails]);
  useEffect(() => { localStorage.setItem('leocalc_vendors', JSON.stringify(vendors)); }, [vendors]);
  useEffect(() => { localStorage.setItem('leocalc_supplies', JSON.stringify(supplies)); }, [supplies]);


  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    setPricingInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleFreightChange = (e) => {
    const { name, value } = e.target;
    setFreightInputs(prev => ({ ...prev, [name]: value }));
  };

  // --- Save / Load Logic ---
  const handleSaveConfig = async () => {
    if (!supabase) {
      alert('Supabase not configured. Check console.');
      return;
    }

    const isCalculator = activeTab === 'calculator';

    // Prompt for Company Name (Mandatory)
    // For Supply, default to the customer name in state
    const defaultName = isCalculator ? '' : (poDetails.customerName || '');
    const companyName = window.prompt("Enter Company Name for this Archive (Mandatory):", defaultName);

    if (!companyName || companyName.trim() === "") {
      alert("Company Name is required to save.");
      return;
    }

    const type = isCalculator ? 'calculator' : 'schedule';
    // Construct Data Payload based on active tab
    const payload = isCalculator
      ? { pricing: pricingInputs, freight: freightInputs, companyName }
      : { poDetails, vendors, supplies, companyName };

    try {
      // If we want to use the user_id for RLS ownership later, we can add it here
      const { error } = await supabase
        .from('archives')
        .insert([
          {
            type,
            data: payload,
            status: 'saved',
            created_at: new Date(),
            // user_id: session.user.id
          }
        ]);

      if (error) throw error;
      alert((isCalculator ? 'Calculator Config' : 'Supply Schedule') + ' Saved Successfully for ' + companyName + '!');
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save configuration.');
    }
  };

  const handleLoadArchive = (archive) => {
    if (!archive || !archive.data) return;

    if (archive.type === 'calculator') {
      if (archive.data.pricing) setPricingInputs(archive.data.pricing);
      if (archive.data.freight) setFreightInputs(archive.data.freight);
      setActiveTab('calculator');
    } else if (archive.type === 'schedule') {
      if (archive.data.poDetails) setPoDetails(archive.data.poDetails);
      if (archive.data.vendors) setVendors(archive.data.vendors);
      if (archive.data.supplies) setSupplies(archive.data.supplies);
      setActiveTab('supply');
    }
    alert('Loaded Archive from ' + (archive.data.companyName || 'Archive'));
  };

  const handleLogout = async () => {
    localStorage.removeItem('leocalc_master_access');
    await supabase.auth.signOut();
    setSession(null);
  };

  // Inject Design System
  useEffect(() => {
    // Fonts & Tailwind (Existing logic preserved if needed, but likely loaded by index.html/css usually. Keeping for safety as per previous)
    const fontLinks = [
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap",
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    ];
    fontLinks.forEach(href => {
      if (!document.querySelector(`link[href = "${href}"]`)) {
        const link = document.createElement('link');
        link.href = href; link.rel = 'stylesheet';
        if (href.includes('preconnect')) link.rel = 'preconnect';
        if (href.includes('gstatic')) link.crossOrigin = '';
        document.head.appendChild(link);
      }
    });
    if (!document.querySelector('script[src*="tailwindcss"]')) {
      const script = document.createElement('script');
      script.src = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
      document.head.appendChild(script);
      script.onload = () => {
        if (window.tailwind) {
          window.tailwind.config = {
            darkMode: "class",
            theme: {
              extend: {
                colors: { "primary": "#1152d4", "background-light": "#f8fafc", "text-main": "#0f172a", "text-muted": "#64748b" },
                fontFamily: { "display": ["Inter", "sans-serif"] },
              },
            },
          };
        }
      };
    }
  }, []);

  // --- Auth Guard ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLoginSuccess={setSession} />;
  }

  return (
    <div className="bg-background-light text-text-main font-display overflow-hidden h-screen flex flex-col">
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border-light bg-white/95 backdrop-blur sticky top-0 z-20">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className="font-semibold text-primary">Leocalc</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-text-main font-medium capitalize">{activeTab} Dashboard</span>
            </div>
            <h2 className="text-text-main text-xl font-bold tracking-tight">
              {activeTab === 'calculator' ? 'Costing & Logistics Engine' : activeTab === 'supply' ? 'Production & Supply Planning' : 'Archives & Records'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button onClick={() => setActiveTab('calculator')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'calculator' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}>
                <span className="material-symbols-outlined text-[16px]">calculate</span> Calculator
              </button>
              <button onClick={() => setActiveTab('supply')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'supply' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}>
                <span className="material-symbols-outlined text-[16px]">local_shipping</span> Supply
              </button>
              <button onClick={() => setActiveTab('archives')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'archives' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}>
                <span className="material-symbols-outlined text-[16px]">folder_open</span> Archives
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            {activeTab !== 'archives' && (
              <button
                onClick={handleSaveConfig}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all text-sm font-medium shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Save {activeTab === 'supply' ? 'Schedule' : 'Config'}</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full flex-1">
          {activeTab === 'calculator' ? (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <PricingCalculator inputs={pricingInputs} onChange={handlePricingChange} />
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-text-main text-lg font-bold px-1">Freight & Loading Optimization</h3>
                <FreightCalculator inputs={freightInputs} onChange={handleFreightChange} bagWeight={pricingInputs.bagWeight} />
              </div>
            </>
          ) : activeTab === 'supply' ? (
            <SupplySchedule
              // Pass Lifted State
              poDetails={poDetails} setPoDetails={setPoDetails}
              vendors={vendors} setVendors={setVendors}
              supplies={supplies} setSupplies={setSupplies}
            />
          ) : (
            <SavedArchives onLoad={handleLoadArchive} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
