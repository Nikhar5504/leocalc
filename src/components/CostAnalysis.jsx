import React, { useState } from 'react';
import BuyingTab from './BuyingTab';
import MarginSimulator from './MarginSimulator';
import { Calculator, Table } from 'lucide-react';

export default function CostAnalysis({ vendors, setVendors }) {
    const [activeSubTab, setActiveSubTab] = useState('matrix');

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Sub-Navigation */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-6 shadow-sm">
                <button
                    onClick={() => setActiveSubTab('matrix')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-all ${activeSubTab === 'matrix'
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Table size={16} />
                    Cost Analysis Matrix
                </button>
                <button
                    onClick={() => setActiveSubTab('calculator')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-all ${activeSubTab === 'calculator'
                        ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Calculator size={16} />
                    Payment Delay Calculator
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
                {activeSubTab === 'matrix' ? (
                    <BuyingTab
                        vendors={vendors || []}
                        setVendors={setVendors}
                    />
                ) : (
                    <MarginSimulator />
                )}
            </div>
        </div>
    );
}
