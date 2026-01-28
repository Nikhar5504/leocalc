import React, { useState, useMemo } from 'react';

export default function QuantitiesDashboard({ products, setProducts }) {
    const stats = useMemo(() => {
        let totalRevenue = 0;
        let totalCost = 0;
        let totalSalesVolume = 0;
        let productCount = products.length;

        products.forEach(p => {
            const qty = Number(p.qty) || 0;
            const vCost = Number(p.vendorCost) || 0;
            const cPrice = Number(p.customerPrice) || 0;

            totalRevenue += qty * cPrice;
            totalCost += qty * vCost;
            totalSalesVolume += qty;
        });

        const totalProfit = totalRevenue - totalCost;
        const netMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const avgProfitPerProduct = productCount > 0 ? totalProfit / productCount : 0;

        return {
            totalProfit,
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
        setProducts([...products, { id: newId, name: '', qty: 0, vendorCost: 0, customerPrice: 0 }]);
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
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full min-w-[1000px] text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[22%]">Product Name</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[8%] text-right">Qty</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[12%] text-right">Vendor Cost</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[12%] text-right">Cust. Price</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[12%] text-right">Unit Profit</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[12%] text-right">Total Profit</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[12%] text-center">Margin %</th>
                                <th className="p-4 w-[6%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.map(p => {
                                const qty = parseFloat(p.qty) || 0;
                                const vCost = parseFloat(p.vendorCost) || 0;
                                const cPrice = parseFloat(p.customerPrice) || 0;
                                const unitProfit = cPrice - vCost;
                                const totalProfit = unitProfit * qty;
                                const margin = cPrice > 0 ? (unitProfit / cPrice) * 100 : 0;

                                const marginColor = margin >= 30 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    margin >= 15 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        margin > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-red-50 text-red-700 border-red-100';

                                return (
                                    <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="p-3">
                                            <input
                                                className="w-full bg-transparent border border-transparent rounded px-2 py-1.5 text-sm font-semibold text-slate-900 focus:border-slate-200 focus:bg-white focus:ring-0 placeholder-slate-300 transition-all font-display"
                                                placeholder="Enter product name..."
                                                type="text"
                                                value={p.name}
                                                onChange={(e) => updateProduct(p.id, 'name', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-right text-sm font-bold text-slate-700 focus:border-primary focus:ring-0 font-mono"
                                                type="number"
                                                value={p.qty}
                                                onChange={(e) => updateProduct(p.id, 'qty', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold font-mono">₹</span>
                                                <input
                                                    className="w-full bg-slate-50 border border-slate-200 rounded pl-6 pr-2 py-1.5 text-right text-sm font-bold text-slate-700 focus:border-primary focus:ring-0 font-mono"
                                                    type="number"
                                                    value={p.vendorCost}
                                                    onChange={(e) => updateProduct(p.id, 'vendorCost', e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="relative border-2 border-primary/10 rounded-lg overflow-hidden">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary/40 text-[10px] font-bold font-mono">₹</span>
                                                <input
                                                    className="w-full bg-slate-50 border-none pl-6 pr-2 py-1.5 text-right text-sm font-black text-primary underline decoration-primary/20 decoration-2 underline-offset-4 focus:ring-0 font-mono"
                                                    type="number"
                                                    value={p.customerPrice}
                                                    onChange={(e) => updateProduct(p.id, 'customerPrice', e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className={`text-xs font-bold font-mono ${unitProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                ₹{unitProfit.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className={`text-sm font-black font-mono ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                ₹{totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="relative inline-flex items-center">
                                                <input
                                                    className={`w-20 border text-center text-xs font-black rounded-full px-2 py-1 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-mono ${marginColor}`}
                                                    value={editingMargin.id === p.id ? editingMargin.val : margin.toFixed(1)}
                                                    onFocus={() => setEditingMargin({ id: p.id, val: margin.toFixed(1) })}
                                                    onBlur={() => setEditingMargin({ id: null, val: '' })}
                                                    onChange={(e) => {
                                                        const newVal = e.target.value;
                                                        setEditingMargin({ id: p.id, val: newVal });
                                                        if (newVal !== '' && !isNaN(newVal)) {
                                                            updateProduct(p.id, 'marginPercent', newVal);
                                                        }
                                                    }}
                                                />
                                                <span className="absolute right-2 text-[10px] font-bold opacity-40">%</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
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
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Vendor Value</span>
                                <span className="text-xl font-black text-slate-900 font-mono">₹{stats.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Customer Value</span>
                                <span className="text-xl font-black text-primary font-mono">₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Estimated Net Profit</span>
                            <span className="text-3xl font-black text-emerald-700 tracking-tight font-mono">₹{stats.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
