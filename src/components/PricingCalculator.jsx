import React from 'react';
import { RefreshCw, DollarSign, TrendingUp, CheckCircle, Package } from 'lucide-react';

export default function PricingCalculator({ inputs, onChange }) {
    // Parsing Inputs
    const ppRate = parseFloat(inputs.ppRate) || 0;         // ₹/kg
    const conversionCost = parseFloat(inputs.conversionCost) || 0; // ₹/bag
    const bagWeight = parseFloat(inputs.bagWeight) || 0;   // g
    const transportPerBag = parseFloat(inputs.transportPerBag) || 0; // ₹/bag
    const profitMargin = parseFloat(inputs.profitMargin) || 0; // %

    // --- Math Logic ---
    const bagWeightKg = bagWeight / 1000;

    // 1. Costs per Bag
    const materialCostPerBag = ppRate * bagWeightKg;
    const effectiveConversionPerBag = conversionCost + transportPerBag;
    const vendorCostPerBag = materialCostPerBag + effectiveConversionPerBag;

    // 2. Costs per Kg (for Stats)
    const effectiveConversionPerKg = bagWeightKg > 0 ? effectiveConversionPerBag / bagWeightKg : 0;
    // Note: The screenshot shows "Adj. Conversion /kg" and "Conversion Cost /kg".
    // Usually one implies the "Cost" side and one implies "Revenue" side (Conversion Realization)?
    // Or "Conversion Cost" meant just the input conversion per kg?
    // Let's stick to Old Code logic:
    // Old Code: adjustedConversion = conversionCost + transportPerBag  <-- Treated as scalar in old code? 
    // BUT User inputs are now PER BAG.
    // So "Adj. Conversion" (Cost side) = (Conv/bag + Trans/bag) / Weight.
    const adjConversionPerKg = effectiveConversionPerKg;

    // 3. Pricing
    const bagPrice = vendorCostPerBag * (1 + profitMargin / 100);
    const netProfit = bagPrice - vendorCostPerBag;

    // 4. Customer Metrics
    const customerPricePerKg = bagWeightKg > 0 ? bagPrice / bagWeightKg : 0;

    // 5. Conversion Metrics (market standard: Selling Price/kg - PP Rate)
    // "Conversion Cost" in Customer Pricing card likely refers to "Realized Conversion" or "Customer Conversion"
    // Old Code: customerConversionPerKg = customerPricePerKg - ppRate;
    const customerConversionPerKg = customerPricePerKg - ppRate;

    // 6. Diff
    // Old Code: conversionDiff = customerConversionPerKg - adjustedConversion
    const conversionDiff = customerConversionPerKg - adjConversionPerKg;

    // Formatters
    const fmtCurrency = (val) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
    const fmtNum = (val) => val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <>
            {/* Left Column: Inputs (Span 4) */}
            <div className="xl:col-span-4 flex flex-col gap-4 bg-white border border-border-light rounded-xl p-5 shadow-sm h-full">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[24px]">payments</span>
                        <h3 className="text-text-main text-lg font-bold">Unit Economics</h3>
                    </div>
                    <button className="text-text-muted hover:text-primary transition-colors">
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">PP Rate (₹/kg)</span>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                            <input
                                className="w-full bg-slate-50 border border-border-light rounded-lg py-2.5 pl-8 pr-3 text-text-main placeholder-slate-400 focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono text-sm font-semibold"
                                type="number"
                                name="ppRate"
                                value={inputs.ppRate}
                                onChange={onChange}
                                placeholder="0.00"
                            />
                        </div>
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Bag Weight (g)</span>
                        <div className="relative">
                            <input
                                className="w-full bg-slate-50 border border-border-light rounded-lg py-2.5 px-3 text-text-main placeholder-slate-400 focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono text-sm font-semibold"
                                type="number"
                                name="bagWeight"
                                value={inputs.bagWeight}
                                onChange={onChange}
                                placeholder="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-medium">g</span>
                        </div>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Conv. Cost (₹/bag)</span>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                            <input
                                className="w-full bg-slate-50 border border-border-light rounded-lg py-2.5 pl-8 pr-3 text-text-main placeholder-slate-400 focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono text-sm font-semibold"
                                type="number"
                                name="conversionCost"
                                value={inputs.conversionCost}
                                onChange={onChange}
                                placeholder="0.00"
                            />
                        </div>
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Transport (₹/bag)</span>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                            <input
                                className="w-full bg-slate-50 border border-border-light rounded-lg py-2.5 pl-8 pr-3 text-text-main placeholder-slate-400 focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono text-sm font-semibold"
                                type="number"
                                name="transportPerBag"
                                value={inputs.transportPerBag}
                                onChange={onChange}
                                placeholder="0.00"
                            />
                        </div>
                    </label>
                </div>

                <div className="pt-2 border-t border-border-light mt-auto">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Profit Margin (%)</span>
                        <input
                            type="number"
                            name="profitMargin"
                            value={inputs.profitMargin}
                            onChange={onChange}
                            className="text-primary font-bold text-sm bg-blue-50 px-2 py-0.5 rounded text-blue-700 w-20 text-right border-none focus:ring-1 focus:ring-primary"
                            placeholder="0"
                        />
                    </div>
                    <input
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        type="range"
                        name="profitMargin"
                        min="0"
                        max="100"
                        value={inputs.profitMargin > 100 ? 100 : inputs.profitMargin}
                        onChange={onChange}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%+</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Stats Cards (Span 8) */}
            <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Visual Matching to Screenshot 1 and 2 */}

                {/* Card 1: VENDOR COST (Blue) */}
                <div className="bg-[#4f46e5] rounded-xl p-5 relative overflow-hidden shadow-sm flex flex-col justify-between text-white">
                    <div>
                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Vendor Cost</p>
                        <p className="text-white/80 text-sm mb-1">Effective Vendor Cost</p>
                        <h3 className="text-white text-3xl font-bold font-mono tracking-tight">{fmtCurrency(vendorCostPerBag)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-indigo-200 text-xs font-bold mb-1">Adj. Conversion</p>
                        <p className="text-white font-bold font-mono text-lg">{fmtNum(adjConversionPerKg)} <span className="text-sm font-normal opacity-80">/kg</span></p>
                    </div>
                </div>

                {/* Card 2: CUSTOMER PRICING (Green) */}
                <div className="bg-[#059669] rounded-xl p-5 relative overflow-hidden shadow-sm flex flex-col justify-between text-white">
                    <div>
                        <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">Customer Pricing</p>
                        <p className="text-white/80 text-sm mb-1">Bag Price (Total)</p>
                        <h3 className="text-white text-3xl font-bold font-mono tracking-tight">{fmtCurrency(bagPrice)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20 flex justify-between">
                        <div>
                            <p className="text-emerald-200 text-xs font-bold mb-1">Conversion Cost</p>
                            <p className="text-white font-bold font-mono text-lg">{fmtNum(customerConversionPerKg)} <span className="text-sm font-normal opacity-80">/kg</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-200 text-xs font-bold mb-1">Customer Price / kg</p>
                            <p className="text-white font-bold font-mono text-lg">{fmtNum(customerPricePerKg)}</p>
                        </div>
                    </div>
                </div>

                {/* Card 3: PROFIT & COMPARISON (Purple) */}
                <div className="bg-[#9333ea] rounded-xl p-5 relative overflow-hidden shadow-sm flex flex-col justify-between text-white">
                    <div>
                        <p className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">Profit & Comparison</p>
                        <p className="text-white/80 text-sm mb-1">Net Profit</p>
                        <h3 className="text-white text-3xl font-bold font-mono tracking-tight">{fmtCurrency(netProfit)}</h3>
                        <p className="text-purple-200 text-sm font-medium">({fmtNum(profitMargin)}%)</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-purple-200 text-xs font-bold mb-1">Conversion Diff / kg</p>
                        <p className="text-white font-bold font-mono text-lg">{fmtNum(conversionDiff)} <span className="text-sm font-normal opacity-80">/kg</span></p>
                    </div>
                </div>

            </div>
        </>
    );
}
