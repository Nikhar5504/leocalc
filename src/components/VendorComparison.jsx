
import React, { useMemo } from 'react';
import {
    Calculator, Truck, CreditCard, Percent, Table, Plus, Trash2,
    Save, PlusCircle, TrendingDown, BarChart3, AlertTriangle, RotateCcw
} from 'lucide-react';

export default function VendorComparison({ vendors, setVendors, onSave, onReset }) {

    // --- Constants ---
    const ANNUAL_INTEREST_RATE = 0.12;

    // --- Dynamic Calculations ---
    const calculatedData = useMemo(() => {
        if (!vendors.length) return [];

        // 1. Pre-calculate Min/Max for scoring normalization
        const minBasePrice = Math.min(...vendors.map(v => parseFloat(v.basePrice) || Infinity));
        // Avoid division by zero for max
        const maxCreditDays = Math.max(...vendors.map(v => parseFloat(v.creditDays) || 0)) || 1;
        const minFreight = Math.min(...vendors.map(v => parseFloat(v.freight) || Infinity));

        return vendors.map(vendor => {
            const base = parseFloat(vendor.basePrice) || 0;
            const freight = parseFloat(vendor.freight) || 0;
            const days = parseFloat(vendor.creditDays) || 0;
            const quality = parseFloat(vendor.quality) || 100;

            // Computed Columns

            // 1. Logistics Badge (Freight < 5% of Base)
            const isLogisticsGood = freight < (base * 0.05);

            // 2. Credit Savings
            const creditSavings = (base * days * ANNUAL_INTEREST_RATE) / 365;

            // 3. TCO
            const tco = base + freight - creditSavings;

            // 4. Value Score (0-100)
            // Price (40%) - Lower is better. (Min / Curr) * 100 * 0.4
            const priceScore = base > 0 ? (minBasePrice / base) * 100 * 0.4 : 0;

            // Credit (20%) - Higher is better. (Curr / Max) * 100 * 0.2
            const creditScore = (days / maxCreditDays) * 100 * 0.2;

            // Logistics (20%) - Lower is better. (Min / Curr) * 100 * 0.2
            // If freight is 0, score is max (20). If minFreight is 0 and curr is >0, score is 0?
            let logisticsScore = 0;
            if (freight > 0) {
                logisticsScore = (minFreight / freight) * 100 * 0.2;
            } else if (freight === 0 && minFreight === 0) {
                logisticsScore = 20; // Maximum points if 0 freight
            }

            // Quality (20%) - Higher is better. (Curr / 100) * 100 * 0.2 => Curr * 0.2
            const qualityScore = quality * 0.2;

            // Only calculate total score if base price is present
            const totalScore = base > 0 ? Math.round(priceScore + creditScore + logisticsScore + qualityScore) : 0;

            return {
                ...vendor,
                creditSavings,
                tco,
                totalScore,
                isLogisticsGood
            };
        });
    }, [vendors]);

    // --- Identify L1 Winner (Lowest TCO) & Best Value (Highest Score) ---
    const l1Winner = useMemo(() => {
        if (!calculatedData.length) return null;
        return calculatedData.reduce((prev, curr) => (prev.tco < curr.tco ? prev : curr));
    }, [calculatedData]);

    const bestValue = useMemo(() => {
        if (!calculatedData.length) return null;
        return calculatedData.reduce((prev, curr) => (prev.totalScore > curr.totalScore ? prev : curr));
    }, [calculatedData]);

    // --- Summary Metrics ---
    const avgLogistics = useMemo(() => {
        if (!calculatedData.length) return 0;
        const total = calculatedData.reduce((sum, v) => sum + (parseFloat(v.freight) || 0), 0);
        return total / calculatedData.length;
    }, [calculatedData]);

    const totalProjectedSavings = useMemo(() => {
        // Just a dummy metric? Or difference between Highest and Lowest TCO?
        // Prompt says "Total Projected Savings... ESTIMATED". 
        // Let's say (Avg TCO - Min TCO) * (some volume?)
        // Or just Sum of Credit Savings?
        // Let's implement: Max TCO - Min TCO (per unit savings potential)
        if (!calculatedData.length) return 0;
        const minTCO = l1Winner?.tco || 0;
        const maxTCO = Math.max(...calculatedData.map(v => v.tco));
        return maxTCO - minTCO;
    }, [calculatedData, l1Winner]);


    // --- Handlers ---
    const handleAddRow = () => {
        setVendors(prev => [
            ...prev,
            {
                id: Date.now(),
                name: 'New Vendor',
                basePrice: 0,
                freight: 0,
                creditDays: 30,
                quality: 100
            }
        ]);
    };

    const handleRemoveRow = (id) => {
        setVendors(prev => prev.filter(v => v.id !== id));
    };

    const handleChange = (id, field, value) => {
        setVendors(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    // --- Render Helpers ---
    const renderScoreRing = (score, colorClass = "text-primary") => {
        const radius = 15.9155;
        const circumference = 2 * Math.PI * radius; // ~100
        const offset = circumference - (score / 100) * circumference;

        // Determine color based on score if not overridden
        let finalColor = colorClass;
        if (score < 50) finalColor = "text-red-500";
        else if (score < 80) finalColor = "text-amber-500";
        else finalColor = "text-primary";

        return (
            <div className="relative h-12 w-12 flex items-center justify-center">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                    <path className={finalColor} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${score}, 100`} strokeWidth="3"></path>
                </svg>
                <span className="absolute text-xs font-black text-slate-700">{score}</span>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50">
            {/* Header & Summary Cards */}
            <div className="px-8 py-6 shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Card 1: Lowest Eff. Price */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lowest Eff. Price</p>
                            <TrendingDown size={14} className="text-emerald-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-extrabold text-slate-900">
                                {l1Winner ? `₹${l1Winner.tco.toFixed(2)}` : '---'}
                            </p>
                            {/* Optional: Diff from Avg */}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">L1 Winner TCO</p>
                    </div>

                    {/* Card 2: Avg Market Baseline (Avg Base Price) */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Base Price</p>
                            <BarChart3 size={14} className="text-slate-400" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">
                            {vendors.length ? `₹${(vendors.reduce((s, v) => s + (parseFloat(v.basePrice) || 0), 0) / vendors.length).toFixed(2)}` : '---'}
                        </p>
                    </div>

                    {/* Card 3: Avg Logistics Cost */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow ring-1 ring-blue-50">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Avg. Logistics Cost</p>
                            <Truck size={14} className="text-primary" />
                        </div>
                        <p className="text-2xl font-extrabold text-primary">₹{avgLogistics.toFixed(2)}</p>
                    </div>

                    {/* Card 4: Best Value Score */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Top Value Score</p>
                            <Percent size={14} className="text-amber-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-extrabold text-slate-900">{bestValue ? bestValue.totalScore : 0}</p>
                            <span className="text-xs font-semibold text-slate-400">/ 100</span>
                        </div>
                    </div>

                    {/* Card 5: Yield Variance (Dynamic based on L1 Quality) */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Yield Variance</p>
                            <AlertTriangle size={14} className="text-slate-400" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">
                            {l1Winner && l1Winner.quality ? `${(100 - l1Winner.quality).toFixed(1)}%` : '---'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Based on L1 Quality</p>
                    </div>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col min-h-0">
                <div className="bg-white border border-slate-200 rounded-t-lg border-b-0 p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <Table className="text-slate-400" size={18} />
                            Procurement Quote Matrix
                        </span>
                        <button
                            onClick={handleAddRow}
                            className="bg-slate-50 text-primary px-3 py-1.5 text-xs font-bold uppercase border border-slate-200 rounded-md flex items-center hover:bg-white hover:border-primary transition-all shadow-sm"
                        >
                            <Plus size={14} className="mr-1" /> Add Vendor
                        </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                        <span>LIVE FEED ACTIVE</span>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 overflow-auto custom-scrollbar flex-1 rounded-b-lg shadow-sm">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-56">Vendor Entity</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Base Price (INR)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48 text-right">Logistics Cost</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Credit Days</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Quality (0-100)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48 text-right">True Landed Cost</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-56">Value Score</th>
                                <th className="px-6 py-4 w-12 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {calculatedData.map((row) => {
                                const isL1 = l1Winner && l1Winner.id === row.id;
                                const isBestVal = bestValue && bestValue.id === row.id;

                                return (
                                    <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors group">
                                        {/* Vendor Name */}
                                        <td className="px-6 py-4 align-top">
                                            <input
                                                className="font-bold text-slate-900 text-sm mb-1 bg-transparent border-0 border-b border-transparent focus:border-primary focus:ring-0 w-full p-0"
                                                value={row.name}
                                                onChange={(e) => handleChange(row.id, 'name', e.target.value)}
                                                placeholder="Vendor Name"
                                            />
                                            {isL1 && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide border border-emerald-200">
                                                    L1 Winner
                                                </span>
                                            )}
                                        </td>

                                        {/* Base Price */}
                                        <td className="px-6 py-4 align-top">
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <span className="text-slate-400 sm:text-sm">₹</span>
                                                </div>
                                                <input
                                                    className="block w-full rounded-md border-0 py-1.5 pl-7 pr-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 font-mono font-medium bg-slate-50"
                                                    type="number"
                                                    value={row.basePrice}
                                                    onChange={(e) => handleChange(row.id, 'basePrice', e.target.value)}
                                                />
                                            </div>
                                        </td>

                                        {/* Freight */}
                                        <td className="px-6 py-4 align-top text-right">
                                            <div className="w-full flex flex-col items-end">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 self-start ml-auto">Freight Cost</label>
                                                <div className="relative w-full">
                                                    <span className="absolute left-2 top-1.5 text-xs text-slate-400">₹</span>
                                                    <input
                                                        className="input-neo w-full pl-5 py-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2 focus:ring-1 focus:ring-primary text-right"
                                                        type="number"
                                                        value={row.freight}
                                                        onChange={(e) => handleChange(row.id, 'freight', e.target.value)}
                                                    />
                                                </div>
                                                {/* Logic Badge (Only show if calculated/relevant) */}
                                                {parseFloat(row.freight) > 0 && (
                                                    <div className={`mt-1 text-[10px] uppercase font-bold flex items-center gap-1 ${row.isLogisticsGood ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        <Truck size={10} />
                                                        {row.isLogisticsGood ? 'Good' : 'High'}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Credit Days */}
                                        <td className="px-6 py-4 align-top">
                                            <input
                                                className="input-neo w-full py-1.5 text-sm font-mono text-center font-medium border border-slate-200 rounded px-2 focus:ring-1 focus:ring-primary"
                                                type="number"
                                                value={row.creditDays}
                                                onChange={(e) => handleChange(row.id, 'creditDays', e.target.value)}
                                            />
                                            <p className="text-[10px] text-slate-400 text-center mt-1">
                                                Saving: ₹{row.creditSavings.toFixed(1)}
                                            </p>
                                        </td>

                                        {/* Quality Score Input */}
                                        <td className="px-6 py-4 align-top">
                                            <input
                                                className="input-neo w-full py-1.5 text-sm font-mono text-center font-medium border border-slate-200 rounded px-2 focus:ring-1 focus:ring-primary"
                                                type="number"
                                                min="0" max="100"
                                                value={row.quality || ''}
                                                onChange={(e) => handleChange(row.id, 'quality', e.target.value)}
                                                placeholder="100"
                                            />
                                        </td>

                                        {/* True Landed Cost */}
                                        <td className="px-6 py-4 align-top text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-xl font-black tracking-tight ${isL1 && row.tco > 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                                                    {row.tco > 0 ? `₹${row.tco.toFixed(2)}` : '---'}
                                                </span>
                                                {isBestVal && row.totalScore > 0 && (
                                                    <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-1.5 py-0.5 rounded mt-1">Best Value</span>
                                                )}
                                                {!isL1 && l1Winner && row.tco > 0 && (
                                                    <span className="text-[10px] font-bold text-red-400 uppercase mt-1">
                                                        +{((row.tco - l1Winner.tco) / l1Winner.tco * 100).toFixed(1)}% vs L1
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Value Score */}
                                        <td className="px-6 py-4 align-top">
                                            {row.totalScore > 0 ? (
                                                <div className="flex items-center gap-3">
                                                    {renderScoreRing(row.totalScore)}
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Vendor Score</span>
                                                        <div className="flex gap-0.5 mt-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < Math.round(row.totalScore / 20) ? (row.totalScore > 80 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-200'}`}></span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 opacity-50">
                                                    <div className="h-10 w-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-xs font-bold text-slate-300">0</div>
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase">Input Data</span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Delete Action */}
                                        <td className="px-6 py-4 align-middle text-center">
                                            <button
                                                onClick={() => handleRemoveRow(row.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Add Row Button at Bottom */}
                    <div
                        onClick={handleAddRow}
                        className="p-0 border-t border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border-dashed border-b"
                    >
                        <button className="w-full py-3 text-slate-500 font-bold uppercase text-xs flex items-center justify-center gap-2">
                            <PlusCircle size={14} />
                            Add New Vendor Row
                        </button>
                    </div>
                </div>

                {/* Footer Actions (Modified: Only Savings Card, spread full width) */}
                <div className="mt-6 z-20 shrink-0">
                    <div className="bg-white border border-slate-200 text-slate-900 p-4 rounded-md shadow-sm flex items-center justify-between w-full">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Projected Annual Savings vs Max</p>
                            <div className="flex items-baseline gap-4">
                                <p className="text-3xl font-black tracking-tight text-slate-900">₹{totalProjectedSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">ESTIMATED POTENTIAL</span>
                            </div>
                        </div>
                        <div className="w-1/2 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[75%] animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
