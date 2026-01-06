import { useState, useEffect } from 'react';
import { Truck, Calculator, Settings as SettingsIcon } from 'lucide-react';
import PricingCalculator from './components/PricingCalculator';
import FreightCalculator from './components/FreightCalculator';
import Settings from './components/Settings';

function App() {
  // Simplified State - No Auth/Session needed if we aren't saving to cloud? 
  // User said "remove save functionality". Usually Auth is for saving. 
  // However, `Auth.jsx` had a "Master Access" check. 
  // For now I'll strip the session check to make it instant access if save is gone. 
  // But wait, Pricing might be sensitive? 
  // I will KEEP Auth for safety, but remove all Save/Load logic.

  // Actually, without Save, Supabase is less needed. 
  // Let's keep it simple: Show Calculators.

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
      palletCapacity: 450,
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

  return (
    <div className="app-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
      <main>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section>
            <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calculator</h2>
            <PricingCalculator inputs={pricingInputs} onChange={handlePricingChange} />
          </section>

          <section>
            <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Freight Optimization</h2>
            <FreightCalculator
              inputs={freightInputs}
              onChange={handleFreightChange}
              bagWeight={pricingInputs.bagWeight}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
