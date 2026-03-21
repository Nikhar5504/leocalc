import React, { useState, useMemo } from 'react';

export default function QuantitiesDashboard({ products, setProducts }) {
    const stats = useMemo(() => {
        let totalRevenue = 0;
        let totalCost = 0;
        let totalSalesVolume = 0;
        let totalNetProfit = 0;
        let productCount = products.length;

        products.forEach(p => {
            const qty = Number(p.qty) || 0;
            const basePrice = Number(p.vendorCost) || 0; // Using vendorCost for backward compatibility
            const freight = Number(p.freight) || 0;
            const tco = basePrice + freight;
            
            const sellingPrice = Number(p.customerPrice) || 0;
            const customerDays = Number(p.customerDays) || 0;
            const vendorDays = Number(p.vendorDays) || 0;
            const interestRate = Number(p.interestRate ?? 12) || 0;

            const cashGapDays = customerDays - vendorDays;
            const financingCost = cashGapDays > 0 ? (tco * cashGapDays * (interestRate / 100)) / 365 : 0;
            
            const grossMargin = (sellingPrice - tco) * qty;
            const netProfit = grossMargin - (financingCost * qty);

            totalRevenue += qty * sellingPrice;
            totalCost += qty * tco; // Landed cost
            totalSalesVolume += qty;
            totalNetProfit += netProfit;
        });

        const netMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
        const avgProfitPerProduct = productCount > 0 ? totalNetProfit / productCount : 0;

        return {
            totalProfit: totalNetProfit,
            netMargin,
            avgProfitPerProduct,
            totalSalesVolume,
            totalRevenue,
            totalCost
        };
    }, [products]);


    const [editingMargin, setEditingMargin] = useState({ id: null, val: '' });

    const updateProduct = (id, field, value) => {
        setProducts(prev => prev.map(p => {
            if (p.id !== id) return p;

            let updated = { ...p, [field]: value };

            if (field === 'marginPercent') {
                const margin = parseFloat(value);
                const cost = parseFloat(p.vendorCost) || 0;
                if (!isNaN(margin) && margin < 100) {
                    updated.customerPrice = (cost / (1 - margin / 100)).toFixed(2);
                }
            }
            return updated;
        }));
    };

    const addProduct = () => {
        const newId = Math.max(...products.map(p => p.id), 0) + 1;
        setProducts([...products, { id: newId, name: '', qty: 0, vendorCost: 0, customerPrice: 0, interestRate: 12, freight: 0, vendorDays: 0, customerDays: 0 }]);
    };

    const deleteProduct = (id) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    const clearAll = () => {
        if (window.confirm('Are you sure you want to clear all products?')) {
            setProducts([]);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Page Heading & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">Quantities Dashboard</h1>
                    <p className="text-slate-500 text-base font-normal">Multi-product profitability calculator & analytics</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Profit', value: `₹ ${stats.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: 'payments', color: 'emerald' },
                    { label: 'Net Margin', value: `${stats.netMargin.toFixed(1)}%`, icon: 'percent', color: 'blue' },
                    { label: 'Avg Profit/Product', value: `₹ ${stats.avgProfitPerProduct.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: 'pie_chart', color: 'violet' },
                    { label: 'Sales Volume', value: stats.totalSalesVolume.toLocaleString(), icon: 'inventory_2', color: 'orange', suffix: 'units' }
                ].map((stat, i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-xl p-5 bg-slate-50 border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:bg-slate-100/50">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                            <span className={`material-symbols-outlined text-[24px] text-slate-400`}>{stat.icon}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-slate-900 text-2xl font-black tracking-tight">{stat.value}</h3>
                            {stat.suffix && <span className="text-xs text-slate-400 font-medium">{stat.suffix}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Section */}
            <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {/* Table Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-900">Product Profitability Table</h3>
                    <div className="flex gap-2">
                        <button onClick={addProduct} className="flex items-center h-9 px-4 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
                            <span className="material-symbols-outlined text-[18px] mr-2">add</span>
                            Add Row
                        </button>
                        <button onClick={clearAll} className="flex items-center h-9 px-4 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 text-sm font-medium transition-colors">
                            <span className="material-symbols-outlined text-[18px] mr-2">delete</span>
                            Clear
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto custom-scrollbar flex-1 pb-4">
                    <table className="w-full text-left border-collapse min-w-[2200px]">
                        <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-30 border-b border-slate-200 shadow-sm">
                            <tr>
                                {/* Product Identity */}
                                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[280px] sticky left-0 bg-slate-50 z-40 shadow-[1px_0_0_rgba(0,0,0,0.05)] border-r border-slate-100">Product Name</th>
                                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px] text-right border-r border-slate-100">Qty</th>

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
                                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[100px] text-center bg-slate-50/30">Yield %</th>
                                <th className="px-5 py-4 w-12 text-center sticky right-0 bg-slate-50 z-40 shadow-[-1px_0_0_rgba(0,0,0,0.05)]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                            {products.map(p => {
                                const qty = parseFloat(p.qty) || 0;
                                const basePrice = parseFloat(p.vendorCost) || 0;
                                const interestRate = parseFloat(p.interestRate ?? 12) || 0;
                                const freight = parseFloat(p.freight) || 0;
                                const vendorDays = parseFloat(p.vendorDays) || 0;
                                const sellingPrice = parseFloat(p.customerPrice) || 0;
                                const customerDays = parseFloat(p.customerDays) || 0;
                                
                                const tco = basePrice + freight;
                                const cashGapDays = customerDays - vendorDays;
                                
                                const revenue = sellingPrice * qty;
                                const cogs = tco * qty;
                                const grossMargin = revenue - cogs;
                                
                                const financingCost = cashGapDays > 0 ? (tco * cashGapDays * (interestRate / 100)) / 365 : 0;
                                const totalFinancingCost = financingCost * qty;
                                
                                const netProfit = grossMargin - totalFinancingCost;
                                const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

                                return (
                                    <tr key={p.id} className="bg-white hover:bg-slate-50/80 transition-all group">
                                        {/* Product Name - Sticky Left */}
                                        <td className="px-5 py-4 align-top sticky left-0 bg-white group-hover:bg-slate-50 z-20 shadow-[1px_0_0_rgba(0,0,0,0.05)] border-r border-slate-100">
                                            <input
                                                className="w-full font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:ring-0 px-0 py-0.5 placeholder:text-slate-300 transition-all"
                                                value={p.name}
                                                onChange={(e) => updateProduct(p.id, 'name', e.target.value)}
                                                placeholder="Enter Product Name..."
                                            />
                                        </td>

                                        {/* Quantity */}
                                        <td className="px-5 py-4 align-top border-r border-slate-100">
                                            <div className="relative rounded-md shadow-sm">
                                                <input
                                                    type="number"
                                                    className="block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 font-mono font-bold text-right bg-slate-50/50 hover:bg-white transition-colors"
                                                    value={p.qty}
                                                    onChange={(e) => updateProduct(p.id, 'qty', e.target.value)}
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
                                                    value={p.vendorCost}
                                                    onChange={(e) => updateProduct(p.id, 'vendorCost', e.target.value)}
                                                />
                                            </div>
                                        </td>

                                        {/* Interest Rate */}
                                        <td className="px-5 py-4 align-top bg-blue-50/10">
                                            <div className="relative rounded-md shadow-sm">
                                                <input
                                                    type="number"
                                                    className="block w-full rounded-md border-0 py-1.5 pl-2 pr-6 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 font-mono font-medium text-right"
                                                    value={p.interestRate ?? 12}
                                                    onChange={(e) => updateProduct(p.id, 'interestRate', e.target.value)}
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
                                                    value={p.freight || ''}
                                                    onChange={(e) => updateProduct(p.id, 'freight', e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </td>

                                        {/* Vendor Terms */}
                                        <td className="px-5 py-4 align-top bg-blue-50/20 border-r border-blue-50">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    className="w-full py-1.5 text-sm font-mono text-center font-bold text-blue-700 bg-white border border-blue-200 rounded focus:ring-primary focus:border-primary shadow-sm"
                                                    value={p.vendorDays || ''}
                                                    onChange={(e) => updateProduct(p.id, 'vendorDays', e.target.value)}
                                                    placeholder="0"
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
                                                    value={p.customerPrice || ''}
                                                    onChange={(e) => updateProduct(p.id, 'customerPrice', e.target.value)}
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
                                                    value={p.customerDays || ''}
                                                    onChange={(e) => updateProduct(p.id, 'customerDays', e.target.value)}
                                                    placeholder="0"
                                                />
                                                <span className="text-[10px] text-emerald-400 font-bold uppercase shrink-0">Days</span>
                                            </div>
                                        </td>

                                        {/* True Landed Cost */}
                                        <td className="px-5 py-4 align-top text-right bg-slate-50/30 border-l border-slate-100">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-base font-bold tracking-tight text-slate-700`}>
                                                    ₹{tco.toFixed(2)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 py-0.5 px-1.5 rounded-full bg-slate-100 mt-1 font-medium">Per Unit</span>
                                            </div>
                                        </td>

                                        {/* Gross Margin */}
                                        <td className="px-5 py-4 align-top text-right bg-slate-50/30">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-base font-bold tracking-tight text-slate-700`}>
                                                    ₹{grossMargin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Interest Cost */}
                                        <td className="px-5 py-4 align-top text-right bg-slate-50/30 border-r border-slate-100">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-base font-bold tracking-tight ${totalFinancingCost > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                                    {totalFinancingCost > 0 ? '-' : ''}₹{Math.abs(totalFinancingCost).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold mt-0.5">BANK COST</span>
                                            </div>
                                        </td>

                                        {/* Realized Margin Highlight */}
                                        <td className="px-5 py-4 align-top text-right bg-emerald-50/20 border-l border-emerald-100 relative">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-xl font-black tracking-tighter ${netProfit > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    ₹{netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Cash Gap */}
                                        <td className="px-5 py-4 align-top text-right bg-slate-50/30">
                                            <div className={`text-sm font-bold ${cashGapDays > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {cashGapDays > 0 ? `+${cashGapDays} Days` : `${cashGapDays} Days`}
                                            </div>
                                        </td>

                                        {/* Yield % */}
                                        <td className="px-5 py-4 align-top text-center bg-slate-50/30">
                                            <div className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded ${marginPercent > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                <span className="text-[10px] font-black uppercase">
                                                    {marginPercent.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 align-top text-center sticky right-0 bg-white group-hover:bg-slate-50 z-20 shadow-[-1px_0_0_rgba(0,0,0,0.05)] border-l border-slate-100">
                                            <button onClick={() => deleteProduct(p.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Remove Product">
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary Bar - Light Mode */}
                <div className="bg-slate-50 p-5 lg:px-8 border-t border-slate-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row gap-8">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Procurement Cost</span>
                                <span className="text-xl font-black text-slate-900 font-mono">₹{stats.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sales Revenue</span>
                                <span className="text-xl font-black text-primary font-mono">₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total True Net Profit</span>
                            <span className="text-3xl font-black text-emerald-700 tracking-tight font-mono">₹{stats.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
