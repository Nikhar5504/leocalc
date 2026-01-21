import { useState, useEffect } from 'react';
import { Truck, Calculator, Settings as SettingsIcon } from 'lucide-react';
import PricingCalculator from './components/PricingCalculator';
import FreightCalculator from './components/FreightCalculator';
import Settings from './components/Settings';

import SupplySchedule from './components/SupplySchedule';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');


  // Lifted State
  const [pricingInputs, setPricingInputs] = useState({
    ppRate: 0,
    conversionCost: 0,
    bagWeight: 0,
    transportPerBag: 0,
    profitMargin: 0
  });

  const [freightInputs, setFreightInputs] = useState({
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
  });

  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    setPricingInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleFreightChange = (e) => {
    const { name, value } = e.target;
    setFreightInputs(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="app-container">
      <main>
        {/* Tab Navigation */}
        <nav className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <Calculator size={18} /> Calculator
          </button>
          <button
            className={`tab-btn ${activeTab === 'supply' ? 'active' : ''}`}
            onClick={() => setActiveTab('supply')}
          >
            <Truck size={18} /> Supply Schedule
          </button>
        </nav>

        {activeTab === 'calculator' ? (
          <div className="calculator-layout">
            <section>
              <h2>Pricing & Profit</h2>
              <PricingCalculator inputs={pricingInputs} onChange={handlePricingChange} />
            </section>

            <section>
              <h2>Freight Optimization</h2>
              <FreightCalculator
                inputs={freightInputs}
                onChange={handleFreightChange}
                bagWeight={pricingInputs.bagWeight}
              />
            </section>
          </div>
        ) : (
          <SupplySchedule />
        )}
      </main>
    </div>
  );
}

export default App;
