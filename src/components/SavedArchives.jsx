import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function SavedArchives({ onLoad }) {
    const [activeFilter, setActiveFilter] = useState('All');
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPageCalc, setCurrentPageCalc] = useState(1);
    const [currentPageSched, setCurrentPageSched] = useState(1);
    const [currentPageQuant, setCurrentPageQuant] = useState(1);
    const ITEMS_PER_PAGE = 8;

    useEffect(() => {
        fetchArchives();
    }, []);

    const fetchArchives = async () => {
        try {
            setLoading(true);
            if (!supabase) {
                setLoading(false);
                return;
            }
            const { data, error } = await supabase
                .from('archives')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setArchives(data || []);
        } catch (err) {
            console.error('Error fetching archives:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteArchive = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this archive?')) return;
        try {
            if (!supabase) return;
            const { error } = await supabase.from('archives').delete().eq('id', id);
            if (error) throw error;
            setArchives(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const handleLoad = (archive) => {
        if (onLoad) onLoad(archive);
    };

    const filteredArchives = archives.filter(item => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Costing') return item.type === 'calculator';
        if (activeFilter === 'Schedules') return item.type === 'schedule';
        if (activeFilter === 'Quantities') return item.type === 'quantities';
        return true;
    });

    const allCalculatorArchives = filteredArchives.filter(a => a.type === 'calculator');
    const allScheduleArchives = filteredArchives.filter(a => a.type === 'schedule');
    const allQuantitiesArchives = filteredArchives.filter(a => a.type === 'quantities');

    const calcTotalPages = Math.ceil(allCalculatorArchives.length / ITEMS_PER_PAGE);
    const displayedCalcArchives = allCalculatorArchives.slice((currentPageCalc - 1) * ITEMS_PER_PAGE, currentPageCalc * ITEMS_PER_PAGE);

    const schedTotalPages = Math.ceil(allScheduleArchives.length / ITEMS_PER_PAGE);
    const displayedSchedArchives = allScheduleArchives.slice((currentPageSched - 1) * ITEMS_PER_PAGE, currentPageSched * ITEMS_PER_PAGE);

    const quantTotalPages = Math.ceil(allQuantitiesArchives.length / ITEMS_PER_PAGE);
    const displayedQuantArchives = allQuantitiesArchives.slice((currentPageQuant - 1) * ITEMS_PER_PAGE, currentPageQuant * ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPageCalc(1);
        setCurrentPageSched(1);
        setCurrentPageQuant(1);
    }, [activeFilter]);

    return (
        <div className="flex flex-col gap-6 w-full font-display">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                <div>
                    <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">Saved Archives</h1>
                    <p className="text-slate-500 text-base font-normal">Manage your production history and cost analysis records.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                        {['All', 'Costing', 'Schedules', 'Quantities'].map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64 text-slate-400 gap-2"><span className="material-symbols-outlined animate-spin">sync</span> Loading Archives...</div>
            ) : (
                <div className="space-y-12">
                    {/* Calculator Archives */}
                    {(activeFilter === 'All' || activeFilter === 'Costing') && allCalculatorArchives.length > 0 && (
                        <section>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                <span className="w-8 h-px bg-slate-200"></span> Calculator Records
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {displayedCalcArchives.map(a => {
                                    const p = a.data?.pricing || {};
                                    const cName = a.data?.companyName || `Record #${a.id.toString().slice(-4)}`;
                                    return (
                                        <div key={a.id} onClick={() => handleLoad(a)} className="group flex flex-col bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <h3 className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors">{cName}</h3>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(a.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PP Rate</span>
                                                    <span className="text-sm font-black text-slate-900">₹{p.ppRate}</span>
                                                </div>
                                                <button onClick={(e) => deleteArchive(a.id, e)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Schedule Archives */}
                    {(activeFilter === 'All' || activeFilter === 'Schedules') && allScheduleArchives.length > 0 && (
                        <section>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                <span className="w-8 h-px bg-slate-200"></span> Production Schedules
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {displayedSchedArchives.map(a => {
                                    const po = a.data?.poDetails || {};
                                    const cName = a.data?.companyName || po.customerName || 'Unknown Customer';
                                    return (
                                        <div key={a.id} onClick={() => handleLoad(a)} className="group flex flex-col bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <h3 className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors">{cName}</h3>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">REF: {po.poNumber || 'N/A'}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(a.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Qty</span>
                                                    <span className="text-sm font-black text-slate-900">{Number(po.totalQty).toLocaleString()} Units</span>
                                                </div>
                                                <button onClick={(e) => deleteArchive(a.id, e)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Quantities Archives */}
                    {(activeFilter === 'All' || activeFilter === 'Quantities') && allQuantitiesArchives.length > 0 && (
                        <section>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                <span className="w-8 h-px bg-slate-200"></span> Quantity Analysis
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {displayedQuantArchives.map(a => {
                                    const prods = a.data?.products || [];
                                    const cName = a.data?.companyName || `Analysis #${a.id.toString().slice(-4)}`;
                                    return (
                                        <div key={a.id} onClick={() => handleLoad(a)} className="group flex flex-col bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <h3 className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors">{cName}</h3>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{prods.length} Products Included</span>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(a.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales</span>
                                                    <span className="text-sm font-black text-slate-900">{prods.reduce((s, p) => s + (Number(p.qty) || 0), 0).toLocaleString()} Units</span>
                                                </div>
                                                <button onClick={(e) => deleteArchive(a.id, e)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {archives.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                            <span className="material-symbols-outlined text-slate-300 text-6xl mb-4">archive</span>
                            <p className="text-slate-400 font-bold uppercase tracking-widest">No saved records found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
