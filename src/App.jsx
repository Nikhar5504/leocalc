import { useState, useEffect } from 'react';
import { Truck, Calculator, Calendar } from 'lucide-react';
import PricingCalculator from './components/PricingCalculator';
import FreightCalculator from './components/FreightCalculator';
import SupplySchedule from './components/SupplySchedule';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');

  // Lifted State
  const [pricingInputs, setPricingInputs] = useState({
    ppRate: 115.42,
    conversionCost: 28.35,
    bagWeight: 185,
    transportPerBag: 2.50, // Added default
    profitMargin: 18
  });

  const [freightInputs, setFreightInputs] = useState({
    unit: 'm',
    vehicleL: 12.03, // Default 40ft HC approx
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

  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    setPricingInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleFreightChange = (e) => {
    const { name, value } = e.target;
    setFreightInputs(prev => ({ ...prev, [name]: value }));
  };

  // Inject Design System (Fonts & Tailwind Control)
  useEffect(() => {
    // 1. Load Fonts
    const fontLinks = [
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap",
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    ];

    fontLinks.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.href = href;
        link.rel = 'stylesheet';
        if (href.includes('preconnect')) link.rel = 'preconnect';
        if (href.includes('gstatic')) link.crossOrigin = '';
        document.head.appendChild(link);
      }
    });

    // 2. Load Tailwind
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
                colors: {
                  "primary": "#1152d4",
                  "background-light": "#f8fafc",
                  "surface-light": "#ffffff",
                  "border-light": "#e2e8f0",
                  "text-main": "#0f172a",
                  "text-muted": "#64748b",
                  "background-dark": "#f8fafc", // Map dark to light for SupplySchedule compat
                  "surface-dark": "#ffffff",
                  "surface-border": "#e2e8f0",
                  "text-secondary": "#64748b",
                },
                fontFamily: {
                  "display": ["Inter", "sans-serif"],
                  "body": ["Inter", "sans-serif"],
                },
              },
            },
          };
        }
      };
    }
  }, []);


  return (
    <div className="bg-background-light text-text-main font-display overflow-hidden h-screen flex flex-col">
      {/* Main Scrollable Area */}
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
              {activeTab === 'calculator' ? 'Costing & Logistics Engine' : 'Production & Supply Planning'}
            </h2>
          </div>

          {/* Right Actions / Tabs */}
          <div className="flex items-center gap-3">
            {/* Tab Switcher as a Segmented Control */}
            <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'calculator' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="material-symbols-outlined text-[16px]">calculate</span>
                Calculator
              </button>
              <button
                onClick={() => setActiveTab('supply')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'supply' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                Supply
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border-light text-text-muted hover:text-text-main hover:border-slate-300 transition-all text-sm font-medium shadow-sm">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all text-sm font-medium shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Save Config</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full flex-1">
          {activeTab === 'calculator' ? (
            <>
              {/* Top Section: Pricing & Stats */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <PricingCalculator
                  inputs={pricingInputs}
                  onChange={handlePricingChange}
                />
              </div>

              {/* Bottom Section: Freight & Visualizer */}
              <div className="flex flex-col gap-4">
                <h3 className="text-text-main text-lg font-bold px-1">Freight & Loading Optimization</h3>
                <FreightCalculator
                  inputs={freightInputs}
                  onChange={handleFreightChange}
                  bagWeight={pricingInputs.bagWeight}
                />
              </div>
            </>
          ) : (
            <SupplySchedule />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
