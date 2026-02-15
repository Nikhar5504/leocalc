import React, { useMemo } from 'react';
import {
    PlusCircle, Trash2, TrendingUp, TrendingDown, DollarSign,
    Table, Truck, CreditCard, Percent, BarChart3, AlertTriangle, BadgeDollarSign,
    ArrowRightLeft, Trophy, MapPin, ExternalLink
} from 'lucide-react';

// Refined Cost Analysis Matrix with "Colourful" Visuals
export default function BuyingTab({ vendors, setVendors }) {
    const ANNUAL_INTEREST_RATE = 0.12;

    // --- Calculations ---
    const buyingData = useMemo(() => {
        if (!vendors.length) return [];

        const calculated = vendors.map(vendor => {
            const base = parseFloat(vendor.basePrice) || 0;
            const freight = parseFloat(vendor.freight) || 0;
            const days = parseFloat(vendor.creditDays) || 0; // Vendor Days
            const qty = parseFloat(vendor.quantity) || 0;
            const interestRate = parseFloat(vendor.interestRate) || 12;

            // Credit Savings Logic (Using individual interest rate)
            const creditSavings = (base * days * (interestRate / 100)) / 365;

            // TCO (True Landed Cost) - Per Unit
            const tco = base + freight - creditSavings;
            const tcoTotal = tco * qty;

            // Selling Data
            const sellingPrice = parseFloat(vendor.sellingPrice) || 0;
            const customerDays = parseFloat(vendor.customerCreditDays) || 0;

            // Cash Flow Gap
            const cashGapDays = customerDays - days;

            // Financials
            const revenue = sellingPrice * qty;
            const cogs = tco * qty;

            // Gross Margin (Before Interest)
            const grossMargin = revenue - cogs;

            // Interest Cost (Financing the Cash Gap on TCO val)
            // If Gap is positive (Customer pays LATER than we pay Vendor), we BORROW -> Cost.
            // If Gap is negative (Customer pays SOONER), we EARN -> Benefit (Negative Cost).
            const financingCost = (tco * cashGapDays * (interestRate / 100)) / 365;
            const totalFinancingCost = financingCost * qty;

            // Realized Margin (Net Profit)
            const netProfit = grossMargin - totalFinancingCost;
            const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

            return {
                ...vendor,
                base, freight, days, qty,
                creditSavings,
                tco,
                tcoTotal,
                interestRate,
                sellingPrice,
                customerDays,
                cashGapDays,
                financingCost, // Per Unit
                totalFinancingCost,
                grossMargin,
                netProfit,
                marginPercent
            };
        });

        // Determine L1 (Lowest TCO) for ranking
        const sortedByTCO = [...calculated].sort((a, b) => a.tco - b.tco);
        // Rank Badge Logic: L1, L2, L3
        return calculated.map(vendor => {
            const rankIndex = sortedByTCO.findIndex(v => v.tco === vendor.tco);
            const rank = rankIndex + 1; // 1-based rank
            const isTopProfit = vendor.netProfit === Math.max(...calculated.map(v => v.netProfit));

            return {
                ...vendor,
                rank: `L${rank}`,
                isTopRank: rank === 1,
                isTopProfit
            };
        });
    }, [vendors]);

    // --- Summary Metrics ---
    const metrics = useMemo(() => {
        if (!buyingData.length) return {
            topProfitDeal: { name: '-', profit: 0 },
            lowestLandedCost: { name: '-', cost: 0 },
            totalNetProfit: 0,
            avgCashCycle: 0
        };

        const topProfit = buyingData.reduce((prev, current) => (prev.netProfit > current.netProfit) ? prev : current, buyingData[0]);
        const lowestCost = buyingData.reduce((prev, current) => (prev.tco < current.tco) ? prev : current, buyingData[0]);
        const totalNetProfit = buyingData.reduce((sum, v) => sum + v.netProfit, 0);
        const avgCashCycle = buyingData.reduce((sum, v) => sum + v.cashGapDays, 0) / buyingData.length;

        return {
            topProfitDeal: { name: topProfit.name || 'N/A', profit: topProfit.netProfit },
            lowestLandedCost: { name: lowestCost.name || 'N/A', cost: lowestCost.tco },
            totalNetProfit,
            avgCashCycle
        };
    }, [buyingData]);

    const handleVendorChange = (id, field, value) => {
        setVendors(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const handleRemoveVendor = (id) => {
        setVendors(prev => prev.filter(v => v.id !== id));
    };

    const handleAddVendor = () => {
        setVendors(prev => [
            ...prev,
            {
                id: Date.now(),
                name: 'New Entry',
                productName: 'Product A',
                quantity: 1000,
                basePrice: 100,
                interestRate: 12,
                freight: 10,
                creditDays: 30, // Vendor
                sellingPrice: 150,
                customerCreditDays: 45
            }
        ]);
    };

    return (
        <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-8 bg-slate-50 font-sans">
            {/* Header / Intro */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {/* Removed Procurement Module Badge */}
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cost Analysis Matrix</h1>
                </div>
            </div>

            {/* Metrics Grid - Comparative Focus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Top Profit Deal - White Card with Emerald Accent (Fixed Visibility) */}
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden active-ring">
                    <div className="flex justify-between items-start mb-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Highest Profit Potential</p>
                        <div className="bg-emerald-50 rounded-full p-1 text-emerald-600">
                            <Trophy size={14} />
                        </div>
                    </div>
                    <div className="flex flex-col items-start mt-2">
                        <p className="text-4xl font-black text-emerald-700 tracking-tighter">
                            <span className="text-2xl align-top text-emerald-400 font-bold mr-0.5">₹</span>
                            {metrics.topProfitDeal.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide truncate max-w-full" title={metrics.topProfitDeal.name}>
                                {metrics.topProfitDeal.name}
                            </span>
                            <div className="bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700 text-[10px] font-black uppercase tracking-tight">
                                Best Deal
                            </div>
                        </div>
                    </div>
                    {/* Decorative Stripe */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300"></div>
                </div>

                {/* 2. Lowest Landed Cost - Big Font, Small Vendor Name (User Request) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden active-ring">
                    <div className="flex justify-between items-start mb-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lowest Landed Cost</p>
                        <div className="bg-blue-50 rounded-full p-1 text-blue-600">
                            <TrendingDown size={14} />
                        </div>
                    </div>
                    <div className="flex flex-col items-start mt-2">
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">
                            <span className="text-2xl align-top text-slate-400 font-bold mr-0.5">₹</span>
                            {metrics.lowestLandedCost.cost.toFixed(2)}
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1 truncate max-w-full" title={metrics.lowestLandedCost.name}>
                            {metrics.lowestLandedCost.name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 shadow-lg shadow-slate-200/50 rounded-2xl border border-slate-200 bg-white">
                <div className="bg-white border-b border-slate-100 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                                <Table size={16} />
                            </div>
                            Procurement & Sales Ledger
                        </span>
                    </div>
                    <button onClick={handleAddVendor} className="bg-slate-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center hover:bg-slate-800 transition-all shadow-md shadow-slate-900/20 active:scale-95">
                        <PlusCircle size={14} className="mr-2" /> Add Entry
                    </button>
                </div>

                <div className="overflow-auto custom-scrollbar flex-1 pb-4">
                    <table className="w-full text-left border-collapse min-w-[2400px]">
                        <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-30 border-b border-slate-200 shadow-sm">
                            <tr>
                                {/* Vendor Columns */}
                                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[280px] sticky left-0 bg-slate-50 z-40 shadow-[1px_0_0_rgba(0,0,0,0.05)] border-r border-slate-100">Vendor Identity</th>
                                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Product Name Item</th>
                                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px] text-right">Qty</th>

                                {/* Buying Inputs */}
                                <th className="px-5 py-4 text-[10px] font-black text-blue-400 uppercase tracking-widest min-w-[140px] bg-blue-50/30">Base Price</th>
                                <th className="px-5 py-4 text-[10px] font-black text-blue-400 uppercase tracking-widest min-w-[100px] bg-blue-50/30 text-right">Int. Rate %</th>
                                <th className="px-5 py-4 text-[10px] font-black text-blue-400 uppercase tracking-widest min-w-[120px] bg-blue-50/30">Freight</th>
                                <th className="px-5 py-4 text-[10px] font-black text-blue-400 uppercase tracking-widest min-w-[130px] bg-blue-50/50 border-r border-blue-100">Vendor Terms</th>

                                {/* Selling Inputs */}
                                <th className="px-5 py-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest min-w-[140px] bg-emerald-50/30 pl-6">Selling Price</th>
                                <th className="px-5 py-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest min-w-[130px] bg-emerald-50/50 border-r border-emerald-100">Cust. Terms</th>

                                {/* Analysis Columns */}
                                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[160px] text-right bg-slate-50/30">True Landed Cost</th>
                                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[160px] text-right bg-slate-50/30">Gross Margin</th>
                                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[160px] text-right bg-slate-50/30 border-r border-slate-100">Interest Cost</th>
                                <th className="px-5 py-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest min-w-[180px] text-right bg-emerald-50/20">Realized Margin</th>
                                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[140px] text-right bg-slate-50/30">Cash Gap</th>
                                <th className="px-5 py-4 w-12 text-center sticky right-0 bg-slate-50 z-40 shadow-[-1px_0_0_rgba(0,0,0,0.05)]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                            {buyingData.map((row) => (
                                <tr key={row.id} className={`bg-white hover:bg-slate-50/80 transition-all group ${row.isTopProfit ? 'bg-emerald-50/10' : ''}`}>
                                    {/* Vendor Name - Sticky Left */}
                                    <td className="px-5 py-4 align-top sticky left-0 bg-white group-hover:bg-slate-50 z-20 shadow-[1px_0_0_rgba(0,0,0,0.05)] border-r border-slate-100">
                                        <div className="flex flex-col gap-3">
                                            {/* Rank Badge */}
                                            <div className="flex items-center gap-2">
                                                <input
                                                    className="w-full font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:ring-0 px-0 py-0.5 placeholder:text-slate-300 transition-all"
                                                    value={row.name}
                                                    onChange={(e) => handleVendorChange(row.id, 'name', e.target.value)}
                                                    placeholder="Enter Vendor Name..."
                                                />
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${row.isTopRank
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                    : row.rank === 'L2' ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                    } uppercase tracking-tight whitespace-nowrap`}>
                                                    {row.rank} Grade
                                                </span>
                                            </div>

                                            {/* DSO Benchmark Visual (Bar Chart style) */}
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex relative">
                                                {/* Base Bar (Vendor Terms) */}
                                                <div
                                                    className="h-full bg-blue-400 rounded-full z-10"
                                                    style={{ width: `${Math.min((row.days / 120) * 100, 100)}%` }}
                                                    title={`Vendor Terms: ${row.days} Days`}
                                                ></div>

                                                {/* Overlay Gap (if Gap > 0) */}
                                                {row.cashGapDays > 0 && (
                                                    <div
                                                        className="h-full bg-rose-400/80 progress-stripe absolute top-0 left-0"
                                                        style={{
                                                            left: `${Math.min((row.days / 120) * 100, 100)}%`,
                                                            width: `${Math.min((row.cashGapDays / 120) * 100, 100)}%`
                                                        }}
                                                        title={`Funding Gap: ${row.cashGapDays} Days`}
                                                    ></div>
                                                )}
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                <span>Vendor: {row.days}d</span>
                                                <span className={row.cashGapDays > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                                                    {row.cashGapDays > 0 ? `Gap: +${row.cashGapDays}d` : `Surplus: ${Math.abs(row.cashGapDays)}d`}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Product Name */}
                                    <td className="px-5 py-4 align-top">
                                        <input
                                            className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded px-3 py-1.5 placeholder:text-slate-300 transition-all shadow-sm"
                                            value={row.productName}
                                            onChange={(e) => handleVendorChange(row.id, 'productName', e.target.value)}
                                            placeholder="Product Name"
                                        />
                                    </td>

                                    {/* Quantity */}
                                    <td className="px-5 py-4 align-top">
                                        <div className="relative rounded-md shadow-sm">
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 font-mono font-bold text-right bg-slate-50/50 hover:bg-white transition-colors"
                                                value={row.quantity}
                                                onChange={(e) => handleVendorChange(row.id, 'quantity', e.target.value)}
                                            />
                                        </div>
                                    </td>

                                    {/* Base Price */}
                                    <td className="px-5 py-4 align-top bg-blue-50/10">
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-slate-400 sm:text-sm">₹</span>
                                            </div>
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-0 py-1.5 pl-7 pr-2 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 font-mono font-medium"
                                                value={row.basePrice}
                                                onChange={(e) => handleVendorChange(row.id, 'basePrice', e.target.value)}
                                            />
                                        </div>
                                    </td>

                                    {/* Interest Rate */}
                                    <td className="px-5 py-4 align-top bg-blue-50/10">
                                        <div className="relative rounded-md shadow-sm">
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-0 py-1.5 pl-2 pr-6 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 font-mono font-medium text-right"
                                                value={row.interestRate || 12}
                                                onChange={(e) => handleVendorChange(row.id, 'interestRate', e.target.value)}
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                <span className="text-slate-400 sm:text-xs font-bold">%</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Freight */}
                                    <td className="px-5 py-4 align-top bg-blue-50/10">
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-slate-400 sm:text-sm">₹</span>
                                            </div>
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-0 py-1.5 pl-7 pr-2 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 font-mono font-medium"
                                                value={row.freight}
                                                onChange={(e) => handleVendorChange(row.id, 'freight', e.target.value)}
                                            />
                                        </div>
                                    </td>

                                    {/* Vendor Terms */}
                                    <td className="px-5 py-4 align-top bg-blue-50/20 border-r border-blue-50">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                className="w-full py-1.5 text-sm font-mono text-center font-bold text-blue-700 bg-white border border-blue-200 rounded focus:ring-primary focus:border-primary shadow-sm"
                                                value={row.creditDays}
                                                onChange={(e) => handleVendorChange(row.id, 'creditDays', e.target.value)}
                                            />
                                            <span className="text-[10px] text-blue-400 font-bold uppercase shrink-0">Days</span>
                                        </div>
                                    </td>

                                    {/* Selling Price */}
                                    <td className="px-5 py-4 align-top bg-emerald-50/10 pl-6 border-l border-slate-100">
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-emerald-500 sm:text-sm font-bold">₹</span>
                                            </div>
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-0 py-1.5 pl-7 pr-2 text-emerald-900 ring-1 ring-inset ring-emerald-200 placeholder:text-emerald-300 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 font-mono font-bold bg-white"
                                                value={row.sellingPrice || ''}
                                                onChange={(e) => handleVendorChange(row.id, 'sellingPrice', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </td>

                                    {/* Customer Terms */}
                                    <td className="px-5 py-4 align-top bg-emerald-50/20 border-r border-emerald-50">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                className="w-full py-1.5 text-sm font-mono text-center font-bold text-emerald-700 bg-white border border-emerald-200 rounded focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                                                value={row.customerCreditDays || ''}
                                                onChange={(e) => handleVendorChange(row.id, 'customerCreditDays', e.target.value)}
                                                placeholder="0"
                                            />
                                            <span className="text-[10px] text-emerald-400 font-bold uppercase shrink-0">Days</span>
                                        </div>
                                    </td>

                                    {/* True Landed Cost */}
                                    <td className="px-5 py-4 align-top text-right bg-slate-50/30 border-l border-slate-100">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-base font-bold tracking-tight text-slate-700`}>
                                                ₹{row.tco.toFixed(2)}
                                            </span>
                                            <span className="text-[10px] text-slate-400 py-0.5 px-1.5 rounded-full bg-slate-100 mt-1 font-medium">Per Unit</span>
                                        </div>
                                    </td>

                                    {/* Gross Margin */}
                                    <td className="px-5 py-4 align-top text-right bg-slate-50/30">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-base font-bold tracking-tight text-slate-700`}>
                                                ₹{row.grossMargin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Interest Cost */}
                                    <td className="px-5 py-4 align-top text-right bg-slate-50/30 border-r border-slate-100">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-base font-bold tracking-tight ${row.totalFinancingCost > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {row.totalFinancingCost > 0 ? '-' : '+'}₹{Math.abs(row.totalFinancingCost).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold mt-0.5">COST</span>
                                        </div>
                                    </td>

                                    {/* Realized Margin Highlight */}
                                    <td className="px-5 py-4 align-top text-right bg-emerald-50/20 border-l border-emerald-100 relative">
                                        {row.isTopProfit && (
                                            <div className="absolute top-0 right-0 text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-bl">Best</div>
                                        )}
                                        <div className="flex flex-col items-end">
                                            <span className={`text-xl font-black tracking-tighter ${row.netProfit > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                ₹{row.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </span>
                                            <div className={`flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded ${row.marginPercent > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                <span className="text-[10px] font-black uppercase">
                                                    {row.marginPercent.toFixed(1)}% Yield
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Cash Gap */}
                                    <td className="px-5 py-4 align-top text-right bg-slate-50/30">
                                        <div className={`text-sm font-bold ${row.cashGapDays > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {row.cashGapDays > 0 ? `+${row.cashGapDays} Days` : `${row.cashGapDays} Days`}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wide">
                                            {row.cashGapDays > 0 ? 'Funding Gap' : 'Cash Surplus'}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-4 align-top text-center sticky right-0 bg-white group-hover:bg-slate-50 z-20 shadow-[-1px_0_0_rgba(0,0,0,0.05)]">
                                        <button onClick={() => handleRemoveVendor(row.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Empty State */}
                    {buyingData.length === 0 && (
                        <div className="p-16 text-center text-slate-400 bg-white">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Truck size={32} className="text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-600 mb-1">Cost Analysis Ledger</p>
                            <p className="text-sm mb-6 max-w-md mx-auto text-slate-400">Add procurement and sales details to calculate your L1 landed cost and realized net margin.</p>
                            <button onClick={handleAddVendor} className="bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                                Add First Entry
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
