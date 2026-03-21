import React, { useState, useMemo } from 'react';
import {
    Calculator, DollarSign, Percent, Clock, AlertTriangle, TrendingUp, Info, RotateCcw, ArrowRight, TrendingDown
} from 'lucide-react';

export default function PaymentDelayCalculator() {
    const [inputs, setInputs] = useState({
        productName: 'Industrial Steel Components',
        vendorCost: 42500,
        sellingPrice: 58000,
        bankInterestRate: 12.5,
        customerDays: 75,
        vendorDays: 45
    });

    const handleChange = (field, value) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const results = useMemo(() => {
        const cost = parseFloat(inputs.vendorCost) || 0;
        const price = parseFloat(inputs.sellingPrice) || 0;
        const bankInterestRate = parseFloat(inputs.bankInterestRate) || 0;
        const customerDays = parseFloat(inputs.customerDays) || 0;
        const vendorDays = parseFloat(inputs.vendorDays) || 0;
        const days = Math.max(0, customerDays - vendorDays); // Cash Gap

        const grossProfit = price - cost;
        const grossMargin = price > 0 ? (grossProfit / price) * 100 : 0;

        // Financing Cost (Bank Loan Cost): (Cost * Days * (Bank Interest Rate / 100)) / 365
        const financingCost = (cost * days * (bankInterestRate / 100)) / 365;

        const netRealProfit = grossProfit - financingCost;
        const netRealMargin = price > 0 ? (netRealProfit / price) * 100 : 0;

        const interestErosion = grossProfit > 0 ? (financingCost / grossProfit) * 100 : 0;
        const profitLoss = grossProfit - netRealProfit;

        return {
            grossProfit,
            grossMargin,
            financingCost,
            netRealProfit,
            netRealMargin,
            interestErosion,
            profitLoss,
            days
        };
    }, [inputs]);

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50 font-sans">
            {/* Header */}
            <div className="px-8 py-6 shrink-0 border-b border-slate-200 bg-white shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Calculator className="text-amber-600" size={28} />
                        Cash Gap Calculator
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Analyze how the cash gap between vendor payments and customer receipts erodes profit margins.</p>
                </div>
                <button
                    onClick={() => setInputs({ productName: '', vendorCost: 0, sellingPrice: 0, bankInterestRate: 12, customerDays: 0, vendorDays: 0 })}
                    className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                >
                    <RotateCcw size={14} /> Reset
                </button>
            </div>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto flex flex-col gap-8">

                    {/* Top Card - Profit Impact Analysis (Comparison) */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={16} className="text-slate-400" />
                                Profit Impact Analysis
                            </h3>
                            {results.interestErosion > 0 && (
                                <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-rose-200">
                                    {results.interestErosion.toFixed(1)}% Erosion
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                            {/* Original Profit */}
                            <div className="flex-1 w-full p-6 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Original Expected Profit</p>
                                <p className="text-4xl md:text-5xl font-black text-emerald-700 tracking-tight">
                                    ₹{results.grossProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </p>
                                <div className="mt-3 bg-white px-4 py-2 rounded-lg border border-emerald-100 shadow-sm">
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">Gross Margin</span>
                                    <span className="text-2xl font-black text-emerald-600">
                                        {results.grossMargin.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Arrow Indicator */}
                            <div className="text-slate-300 hidden md:block">
                                <ArrowRight size={48} />
                            </div>

                            {/* Actual Profit */}
                            <div className="flex-1 w-full p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center text-center relative overflow-hidden">
                                {/* Stripe for erosion visual */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-rose-500"></div>

                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Actual Realized Profit</p>
                                <p className={`text-4xl md:text-5xl font-black tracking-tight ${results.netRealProfit < results.grossProfit ? 'text-amber-600' : 'text-slate-800'}`}>
                                    ₹{results.netRealProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </p>
                                <div className="mt-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Net Margin</span>
                                    <span className={`text-2xl font-black ${results.netRealProfit < results.grossProfit ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {results.netRealMargin.toFixed(1)}%
                                    </span>
                                </div>
                                {results.financingCost > 0 && (
                                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                                        <TrendingDown size={12} />
                                        <span>-₹{results.financingCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })} lost to financing</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Input Columns */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* Trade Details */}
                            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Trade Details</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Product Name</label>
                                        <input
                                            type="text"
                                            className="w-full text-base font-bold text-slate-700 border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-md px-3 py-2 bg-white transition-all placeholder:text-slate-300 border"
                                            placeholder="Enter product name..."
                                            value={inputs.productName}
                                            onChange={(e) => handleChange('productName', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Vendor Cost</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    className="w-full text-lg font-bold text-slate-900 border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-md pl-8 pr-3 py-2 bg-white transition-all border"
                                                    value={inputs.vendorCost}
                                                    onChange={(e) => handleChange('vendorCost', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Selling Price</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    className="w-full text-lg font-bold text-emerald-600 border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-md pl-8 pr-3 py-2 bg-white transition-all border"
                                                    value={inputs.sellingPrice}
                                                    onChange={(e) => handleChange('sellingPrice', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Financing Parameters */}
                            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Financing Parameters</h3>
                                </div>
                                <div className="p-6 space-y-8">
                                    {/* Bank Interest Rate Input */}
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Bank Rate of Interest (% Per Annum)</label>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="relative w-32 shrink-0">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="w-full text-lg font-bold text-slate-900 border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-md px-3 py-2 text-right pr-8 border"
                                                    value={inputs.bankInterestRate}
                                                    onChange={(e) => handleChange('bankInterestRate', e.target.value)}
                                                />
                                                <span className="absolute right-3 top-3.5 text-slate-400 font-bold text-xs">%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0" max="30" step="0.5"
                                                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                                                value={inputs.bankInterestRate}
                                                onChange={(e) => handleChange('bankInterestRate', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Customer Days Input */}
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="text-xs font-bold text-emerald-600 uppercase">Customer Payment Terms</label>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="relative w-32 shrink-0">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full text-lg font-bold text-emerald-700 border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-md px-3 py-2 text-right pr-10 border"
                                                    value={inputs.customerDays}
                                                    onChange={(e) => handleChange('customerDays', e.target.value)}
                                                />
                                                <span className="absolute right-3 top-3.5 text-emerald-400 font-bold text-xs">Days</span>
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="range"
                                                    min="0" max="365" step="1"
                                                    className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                                    value={Math.min(inputs.customerDays, 365)}
                                                    onChange={(e) => handleChange('customerDays', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vendor Days Input */}
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="text-xs font-bold text-blue-600 uppercase">Vendor Credit Terms</label>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="relative w-32 shrink-0">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full text-lg font-bold text-blue-700 border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-right pr-10 border"
                                                    value={inputs.vendorDays}
                                                    onChange={(e) => handleChange('vendorDays', e.target.value)}
                                                />
                                                <span className="absolute right-3 top-3.5 text-blue-400 font-bold text-xs">Days</span>
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="range"
                                                    min="0" max="365" step="1"
                                                    className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    value={Math.min(inputs.vendorDays, 365)}
                                                    onChange={(e) => handleChange('vendorDays', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cash Gap Output Badge */}
                                    <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-xl mt-4">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Calculated Cash Gap</span>
                                        <span className={`text-xl font-black ${results.days > 0 ? 'text-amber-600' : 'text-emerald-600'} flex items-center gap-2`}>
                                            <Clock size={20} />
                                            {results.days} Days
                                        </span>
                                    </div>
                                </div>
                            </section>

                        </div>

                        {/* Analysis Column */}
                        <div className="lg:col-span-5 space-y-6 h-full">
                            {/* Warning Banner */}
                            <div className={`rounded-xl p-5 border ${results.interestErosion > 20 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'} h-full flex flex-col justify-between`}>
                                <div>
                                    <div className="flex items-start gap-3 mb-4">
                                        <AlertTriangle className={results.interestErosion > 20 ? "text-amber-500" : "text-slate-400"} size={24} />
                                        <div>
                                            <h4 className={`text-sm font-bold uppercase ${results.interestErosion > 20 ? "text-amber-800" : "text-slate-600"}`}>
                                                Erosion Monitor
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                Tracking how much of your margin is being consumed by financing the cash gap.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                                <span>Profit Retained</span>
                                                <span>{100 - results.interestErosion.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${results.netRealProfit < 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.max(0, 100 - results.interestErosion)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200/50 mt-auto">
                                    <ul className="space-y-3 text-xs">
                                        <li className="flex justify-between">
                                            <span className="text-slate-500 font-medium">Daily Cost of Carry:</span>
                                            <span className="font-bold text-slate-700">₹{results.days > 0 && results.grossProfit > 0 ? (((results.financingCost / results.grossProfit) * results.grossProfit / results.days)).toFixed(2) : 0}/day</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-500 font-medium">Monthly Impact:</span>
                                            <span className="font-bold text-slate-700">₹{results.days > 0 && results.grossProfit > 0 ? (((results.financingCost / results.grossProfit) * results.grossProfit / results.days) * 30).toFixed(0) : 0}/mo</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
