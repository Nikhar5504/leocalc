import { useState, useEffect } from 'react';
import PricingCalculator from './components/PricingCalculator';
import FreightCalculator from './components/FreightCalculator';
import SupplySchedule from './components/SupplySchedule';
import SavedArchives from './components/SavedArchives';
import Login from './components/Login';
import QuantitiesDashboard from './components/QuantitiesDashboard';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('calculator');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '' });

  // Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [existingCompanies, setExistingCompanies] = useState([]);
  const [saveModalConfig, setSaveModalConfig] = useState({ type: '', payload: {}, defaultName: '' });
  const [selectedCompany, setSelectedCompany] = useState('');
  const [newCompanyInput, setNewCompanyInput] = useState('');

  // Edit Mode State
  const [editingArchiveId, setEditingArchiveId] = useState(null);
  const [editingCompanyName, setEditingCompanyName] = useState(null);
  const [editingRecordName, setEditingRecordName] = useState(null);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  // Improved Tab Switching (clears edit mode)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEditingArchiveId(null); // Clear edit mode when switching tabs
    setEditingCompanyName(null);
    setEditingRecordName(null);
  };

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
    bagWeight: 0.185, // kg
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
    customCount: '',
    effectivePalletCount: 30 // Reasonable default? Or should be 0. Let's say 30.
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

  const [products, setProducts] = useState(() => loadState('leocalc_products', [
    { id: 1, name: 'Widget A - Standard', qty: 100, vendorCost: 500, customerPrice: 750 },
    { id: 2, name: 'Widget B - Premium', qty: 50, vendorCost: 200, customerPrice: 400 },
    { id: 3, name: 'Widget C - Economy', qty: 200, vendorCost: 150, customerPrice: 180 },
  ]));

  // Persistence Effects
  useEffect(() => { localStorage.setItem('leocalc_poDetails', JSON.stringify(poDetails)); }, [poDetails]);
  useEffect(() => { localStorage.setItem('leocalc_vendors', JSON.stringify(vendors)); }, [vendors]);
  useEffect(() => { localStorage.setItem('leocalc_supplies', JSON.stringify(supplies)); }, [supplies]);
  useEffect(() => { localStorage.setItem('leocalc_products', JSON.stringify(products)); }, [products]);


  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    setPricingInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleFreightChange = (e) => {
    const { name, value } = e.target;
    setFreightInputs(prev => ({ ...prev, [name]: value }));
  };

  // --- Save / Load Logic ---
  // --- Save / Load Logic ---
  const handleSaveConfig = async () => {
    if (!supabase) {
      alert('Supabase not configured. Check console.');
      return;
    }

    const isCalculator = activeTab === 'calculator';
    const isSupply = activeTab === 'supply';
    const isQuantities = activeTab === 'quantities';

    let defaultName = '';
    if (isSupply) defaultName = poDetails.customerName || '';
    if (isQuantities) defaultName = 'Product Analysis';

    let type = 'calculator';
    let payload = {};

    if (isCalculator) {
      type = 'calculator';
      payload = { pricing: pricingInputs, freight: freightInputs };
    } else if (isSupply) {
      type = 'schedule';
      payload = { poDetails, vendors, supplies };
    } else if (isQuantities) {
      type = 'quantities';
      payload = { products };
    }

    // Fetch existing companies
    try {
      const { data, error } = await supabase.from('archives').select('company_name');
      if (!error && data) {
        const unique = [...new Set(data.map(i => i.company_name).filter(Boolean))].sort();
        setExistingCompanies(unique);
      }
    } catch (e) { console.error(e); }

    setSaveModalConfig({ type, payload, defaultName });
    setSelectedCompany('');
    setNewCompanyInput(defaultName);
    setShowSaveModal(true);
  };

  // New Handler for Quick Update (Bypasses Modal)
  const handleQuickUpdate = async () => {
    if (!editingArchiveId || !editingCompanyName) return;

    // Construct Payload manually (similar to handleSaveConfig logic)
    const isCalculator = activeTab === 'calculator';
    const isSupply = activeTab === 'supply';
    const isQuantities = activeTab === 'quantities';

    let type = 'calculator';
    let payload = {};

    if (isCalculator) {
      type = 'calculator';
      payload = { pricing: pricingInputs, freight: freightInputs };
    } else if (isSupply) {
      type = 'schedule';
      payload = { poDetails, vendors, supplies };
    } else if (isQuantities) {
      type = 'quantities';
      payload = { products };
    }

    const finalPayload = { ...payload, companyName: editingCompanyName, recordName: editingRecordName };

    try {
      const { error } = await supabase
        .from('archives')
        .update({
          type: type,
          data: finalPayload,
          company_name: editingCompanyName,
          // Removed updated_at as it doesn't exist in schema
        })
        .eq('id', editingArchiveId);

      if (error) throw error;
      showToast(`Updated Record for ${editingCompanyName}!`);
    } catch (err) {
      console.error('Error updating:', err);
      showToast(`Update Error: ${err.message || 'Unknown error'}`);
    }
  };

  const confirmSave = async () => {
    const companyName = selectedCompany === 'NEW_COMPANY_OPTION' ? newCompanyInput : selectedCompany;

    if (!companyName || companyName.trim() === "") {
      showToast("Company Name is required.");
      return;
    }

    console.log('Saving to company:', companyName); // Debug

    // Update payload with company name if needed for internal consistency (though DB col is distinct)
    const finalPayload = { ...saveModalConfig.payload, companyName };
    if (editingRecordName) finalPayload.recordName = editingRecordName;

    try {
      let error;

      if (editingArchiveId) {
        // UPDATE existing record
        const result = await supabase
          .from('archives')
          .update({
            type: saveModalConfig.type,
            data: finalPayload,
            company_name: companyName,
            updated_at: new Date(), // Ensure schema supports this or use created_at if acceptable (though update usually prefers updated_at)
          })
          .eq('id', editingArchiveId);
        error = result.error;
      } else {
        // INSERT new record
        const result = await supabase
          .from('archives')
          .insert([
            {
              type: saveModalConfig.type,
              data: finalPayload,
              company_name: companyName,
              status: 'saved',
              created_at: new Date(),
            }
          ]);
        error = result.error;
      }

      if (error) throw error;

      showToast(editingArchiveId ? `Updated Record for ${companyName}!` : `Saved Successfully for ${companyName}!`);
      setShowSaveModal(false);

      // Optional: Clear edit mode after save if you want fresh start, or keep it to allow further edits.
      // Keeping it allows continuous editing.
    } catch (err) {
      console.error('Error saving:', err);
      showToast(`Save Error: ${err.message || 'Unknown error'}`);
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
    } else if (archive.type === 'quantities') {
      if (archive.data.products) setProducts(archive.data.products);
      setActiveTab('quantities');
    }
    if (archive.id) {
      setEditingArchiveId(archive.id); // Enable Edit Mode
      // CRITICAL FIX: Prioritize DB column over JSON blob to prevent reverting renames
      setEditingCompanyName(archive.company_name || archive.data.companyName);
      setEditingRecordName(archive.data.recordName); // Preserve record name
    }
    showToast('Loaded Archive: ' + (archive.company_name || archive.data.companyName || 'Archive'));
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
              {activeTab === 'calculator' ? 'Costing & Logistics Engine' :
                activeTab === 'supply' ? 'Production & Supply Planning' :
                  activeTab === 'quantities' ? 'Quantities & Margin Analysis' :
                    'Archives & Records'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button onClick={() => handleTabChange('calculator')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'calculator' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}>
                <span className="material-symbols-outlined text-[16px]">calculate</span> Calculator
              </button>
              <button onClick={() => handleTabChange('supply')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'supply' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}>
                <span className="material-symbols-outlined text-[16px]">local_shipping</span> Supply
              </button>
              <button onClick={() => handleTabChange('quantities')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'quantities' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}>
                <span className="material-symbols-outlined text-[16px]">calculate</span> Quantities
              </button>
              <button onClick={() => handleTabChange('archives')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'archives' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}>
                <span className="material-symbols-outlined text-[16px]">folder_open</span> Archives
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            {activeTab !== 'archives' && (
              <button
                onClick={editingArchiveId ? handleQuickUpdate : handleSaveConfig}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all text-sm font-medium shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{editingArchiveId ? 'Update' : 'Save'} {activeTab === 'supply' ? 'Schedule' : 'Config'}</span>
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

        {/* Content Body with Rounded Box Style */}
        <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full flex-1 mb-10">
          <div className="bg-white border border-border-light rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 p-6 md:p-8 animate-fade-in">
            {activeTab === 'calculator' ? (
              <>
                {/* Page Heading & Actions (Standardized) */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">Costing Engine</h1>
                    <p className="text-slate-500 text-base font-normal">Unit economics, logistics optimization & margin analysis</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-4">
                  <PricingCalculator inputs={pricingInputs} onChange={handlePricingChange} />
                </div>
                <div className="flex flex-col gap-4 mt-8">
                  <h3 className="text-text-main text-lg font-bold px-1">Freight & Loading Optimization</h3>
                  <FreightCalculator inputs={freightInputs} onChange={handleFreightChange} bagWeight={pricingInputs.bagWeight} />
                </div>
              </>
            ) : activeTab === 'supply' ? (
              <SupplySchedule
                poDetails={poDetails} setPoDetails={setPoDetails}
                vendors={vendors} setVendors={setVendors}
                supplies={supplies} setSupplies={setSupplies}
              />
            ) : activeTab === 'quantities' ? (
              <QuantitiesDashboard products={products} setProducts={setProducts} />
            ) : (
              <SavedArchives onLoad={handleLoadArchive} />
            )}
          </div>
        </div>

        {/* Save Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-slate-900">Save Configuration</h3>
                <p className="text-sm text-slate-500 mt-1">Select an existing company or add a new one.</p>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Company</span>
                  <select
                    className="form-select rounded-lg border-slate-200 bg-slate-50 text-sm font-medium focus:ring-primary focus:border-primary"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                  >
                    <option value="" disabled>-- Choose a Company --</option>
                    {existingCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="NEW_COMPANY_OPTION">+ Add New Company</option>
                  </select>
                </label>

                {selectedCompany === 'NEW_COMPANY_OPTION' && (
                  <label className="flex flex-col gap-2 animate-fade-in">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Company Name</span>
                    <input
                      className="form-input rounded-lg border-slate-200 text-sm font-medium focus:ring-primary focus:border-primary"
                      placeholder="Enter company name..."
                      value={newCompanyInput}
                      onChange={(e) => setNewCompanyInput(e.target.value)}
                      autoFocus
                    />
                  </label>
                )}
              </div>
              <div className="p-4 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                >
                  Save Archive
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed bottom-6 right-6 z-[9999] animate-fade-in">
            <div className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700">
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              <span className="text-sm font-bold">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
