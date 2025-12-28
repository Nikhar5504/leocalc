import { useState, useEffect } from 'react';
import { Save, Calculator, FolderOpen, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import Auth from './components/Auth';
import PricingCalculator from './components/PricingCalculator';
import FreightCalculator from './components/FreightCalculator';
import SavedCalculations from './components/SavedCalculations';
import Settings from './components/Settings';

function App() {
  const [session, setSession] = useState(null)
  const [masterSession, setMasterSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe();
    }
  }, [])

  const effectiveSession = session || masterSession;

  if (!effectiveSession) {
    return <Auth onMasterLogin={(mockUser) => setMasterSession({ user: mockUser })} />
  }

  // Handle Logout (Clear Master Session too)
  const handleLogout = () => {
    setMasterSession(null);
  };

  return <CalculatorApp session={effectiveSession} onLogout={handleLogout} />
}

function CalculatorApp({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('calculator');

  // Lifted State
  const [pricingInputs, setPricingInputs] = useState(() => {
    const saved = localStorage.getItem('pricingInputs');
    return saved ? JSON.parse(saved) : {
      ppRate: 0,
      conversionCost: 0,
      bagWeight: 0,
      transportPerBag: 0,
      profitMargin: 0
    };
  });

  const [freightInputs, setFreightInputs] = useState(() => {
    const saved = localStorage.getItem('freightInputs');
    const defaults = {
      unit: 'm',
      vehicleL: 0,
      vehicleW: 0,
      vehicleH: 0,
      baleL: 0,
      baleW: 0,
      baleH: 0,
      baleSize: 0,
      freightCharge: 0,
      efficiency: 100,
      customCount: ''
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  useEffect(() => { localStorage.setItem('pricingInputs', JSON.stringify(pricingInputs)); }, [pricingInputs]);
  useEffect(() => { localStorage.setItem('freightInputs', JSON.stringify(freightInputs)); }, [freightInputs]);

  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    setPricingInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleFreightChange = (e) => {
    const { name, value } = e.target;
    setFreightInputs(prev => ({ ...prev, [name]: value }));
  };

  // Save Modal Logic
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const openSaveModal = () => setIsSaveModalOpen(true);
  const closeSaveModal = () => setIsSaveModalOpen(false);

  const confirmSave = async () => {
    if (!companyName) return;

    if (effectiveSession?.user?.id === 'master-bypass') {
      alert("Cloud saving is disabled in Master Access mode. Please login with email.");
      closeSaveModal();
      return;
    }

    try {
      console.log("Attempting save for User ID:", effectiveSession.user.id);

      const payload = {
        user_id: effectiveSession.user.id,
        name: companyName,
        date: new Date().toISOString(),
        pricing: pricingInputs,
        freight: freightInputs
      };

      console.log("Payload:", payload);

      const { error } = await supabase.from('calculations').insert([payload]);

      if (error) {
        console.error("Supabase Save Error:", error);
        throw error;
      }
      alert("Saved successfully!");
      closeSaveModal();
      setCompanyName('');
    } catch (error) {
      alert("Save failed (or local only): " + error.message);
      closeSaveModal();
    }
  };

  const handleLoadScenario = (item) => {
    if (item.pricing) setPricingInputs(item.pricing);
    if (item.freight) setFreightInputs(item.freight);
    setActiveTab('calculator');
  };

  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {/* Branding Removed */}
        </div>

        <div className="tabs" style={{ marginTop: '0' }}>
          <button
            className={`tab-button ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <Calculator size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
            Calculator
          </button>
          <button
            className={`tab-button ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <FolderOpen size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
            Saved
          </button>
          <button
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
            Settings
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'calculator' ? (
          <div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              <section>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#334155' }}>PP Pricing</h2>
                <PricingCalculator inputs={pricingInputs} onChange={handlePricingChange} />
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#334155' }}>Freight Optimization</h2>
                <FreightCalculator inputs={freightInputs} onChange={handleFreightChange} />
              </section>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                <button className="primary" onClick={openSaveModal} style={{ width: '100%', maxWidth: '400px', padding: '1rem', fontSize: '1.1rem' }}>
                  <Save size={20} /> Save Calculation
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'saved' && (
          <SavedCalculations onLoad={handleLoadScenario} />
        )}

        {activeTab === 'settings' && (
          <Settings onLogout={onLogout} />
        )}

        {/* Save Modal */}
        {isSaveModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div className="card" style={{ maxWidth: '400px', padding: '2rem' }}>
              <h3 style={{ marginTop: 0 }}>Save Calculation</h3>
              <input
                className="inputField"
                placeholder="Enter Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                autoFocus
                style={{ marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="primary" onClick={confirmSave} style={{ flex: 1, padding: '0.75rem', borderRadius: '4px' }}>Save</button>
                <button className="secondary" onClick={closeSaveModal} style={{ flex: 1, padding: '0.75rem', borderRadius: '4px' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
