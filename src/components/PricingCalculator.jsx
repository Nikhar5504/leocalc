import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function PricingCalculator({ inputs, onChange }) {
    // Parsing Inputs
    const ppRate = parseFloat(inputs.ppRate) || 0;
    const conversionCost = parseFloat(inputs.conversionCost) || 0;
    const bagWeight = parseFloat(inputs.bagWeight) || 0;
    const transportPerBag = parseFloat(inputs.transportPerBag) || 0;
    const profitMargin = parseFloat(inputs.profitMargin) || 0;

    const bagWeightKg = bagWeight;
    const vendorCostPerBag = (ppRate + transportPerBag + conversionCost) * bagWeight;

    const transportPerKg = bagWeightKg > 0 ? transportPerBag / bagWeightKg : 0;
    const adjConversionPerKg = conversionCost + transportPerBag;

    const bagPrice = vendorCostPerBag * (1 + profitMargin / 100);
    const netProfit = bagPrice - vendorCostPerBag;
    const customerPricePerKg = bagWeightKg > 0 ? bagPrice / bagWeightKg : 0;
    const customerConversionPerKg = customerPricePerKg - ppRate;
    const conversionDiff = customerConversionPerKg - adjConversionPerKg;

    const fmtCurrency = (val) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
    const fmtNum = (val) => val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <>
            {/* Left Column: Inputs */}
            <div className="xl:col-span-4 flex flex-col gap-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-slate-900 text-lg font-black tracking-tight">Unit Economics</h3>
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Base Cost Inputs</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex flex-col gap-2">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">PP Rate (₹/kg)</span>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">₹</span>
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-8 pr-3 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm font-bold" type="number" name="ppRate" value={inputs.ppRate} onChange={onChange} />
                            </div>
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">Bag Weight (kg)</span>
                            <div className="relative">
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm font-bold" type="number" name="bagWeight" value={inputs.bagWeight} onChange={onChange} step="0.001" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black uppercase tracking-widest">kg</span>
                            </div>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex flex-col gap-2">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">Conv. Cost (₹/kg)</span>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">₹</span>
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-8 pr-3 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm font-bold" type="number" name="conversionCost" value={inputs.conversionCost} onChange={onChange} />
                            </div>
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">Transport (₹/bag)</span>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">₹</span>
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-8 pr-3 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm font-bold" type="number" name="transportPerBag" value={inputs.transportPerBag} onChange={onChange} />
                            </div>
                        </label>
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-700 text-xs font-black uppercase tracking-[0.15em]">Profit Margin (%)</span>
                        <div className="bg-primary/10 px-3 py-1 rounded-full"><span className="text-primary font-black text-xs font-mono">{inputs.profitMargin}%</span></div>
                    </div>
                    <input className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" type="range" name="profitMargin" min="0" max="500" value={inputs.profitMargin} onChange={onChange} />
                </div>
            </div>

            {/* Right Column: Stats Cards */}
            <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Card 1: VENDOR COST (Blue) */}
                <div className="bg-[#4f46e5] rounded-2xl p-6 relative overflow-hidden shadow-md flex flex-col justify-between text-white hover:shadow-lg transition-shadow">
                    <div>
                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Vendor Cost</p>
                        <p className="text-white/80 text-sm mb-1">Effective Vendor Cost</p>
                        <h3 className="text-white text-3xl font-bold font-mono tracking-tight">{fmtCurrency(vendorCostPerBag)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-indigo-200 text-xs font-bold mb-1">Adj. Conversion</p>
                        <p className="text-white font-bold font-mono text-xl">{fmtNum(adjConversionPerKg)}</p>
                    </div>
                </div>

                {/* Card 2: CUSTOMER PRICING (Green) */}
                <div className="bg-[#059669] rounded-2xl p-6 relative overflow-hidden shadow-md flex flex-col justify-between text-white hover:shadow-lg transition-shadow">
                    <div>
                        <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">Customer Pricing</p>
                        <p className="text-white/80 text-sm mb-1">Bag Price (Total)</p>
                        <h3 className="text-white text-3xl font-bold font-mono tracking-tight">{fmtCurrency(bagPrice)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20 flex justify-between">
                        <div>
                            <p className="text-emerald-200 text-xs font-bold mb-1">Customer Price / kg</p>
                            <p className="text-white font-bold font-mono text-xl">{fmtNum(customerPricePerKg)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-200 text-xs font-bold mb-1">Realized Conv.</p>
                            <p className="text-white font-bold font-mono text-xl">{fmtNum(customerConversionPerKg)}</p>
                        </div>
                    </div>
                </div>

                {/* Card 3: PROFIT & COMPARISON (Purple) */}
                <div className="bg-[#9333ea] rounded-2xl p-6 relative overflow-hidden shadow-md flex flex-col justify-between text-white hover:shadow-lg transition-shadow">
                    <div>
                        <p className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">Profit & Comparison</p>
                        <p className="text-white/80 text-sm mb-1">Net Profit</p>
                        <h3 className="text-white text-3xl font-bold font-mono tracking-tight">{fmtCurrency(netProfit)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-purple-200 text-xs font-bold mb-1">Conversion Diff</p>
                        <p className="text-white font-bold font-mono text-xl">+ {fmtNum(conversionDiff)} <span className="text-sm font-normal opacity-80">/kg</span></p>
                    </div>
                </div>

            </div>
        </>
    );
}
