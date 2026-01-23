import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function SavedArchives({ onLoad }) {
    const [activeFilter, setActiveFilter] = useState('All');
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPageCalc, setCurrentPageCalc] = useState(1);
    const [currentPageSched, setCurrentPageSched] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchArchives();
    }, []);

    const fetchArchives = async () => {
        try {
            setLoading(true);

            if (!supabase) {
                console.warn("Supabase client not initialized. Using mock or empty mode.");
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
        e.stopPropagation(); // prevent triggering onLoad
        if (!confirm('Are you sure you want to delete this archive?')) return;
        try {
            if (!supabase) return;
            const { error } = await supabase.from('archives').delete().eq('id', id);
            if (error) throw error;
            setArchives(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error('Error deleting:', err);
            alert('Failed to delete item.');
        }
    };

    const handleLoad = (archive) => {
        if (onLoad) {
            onLoad(archive);
        } else {
            console.warn("No onLoad handler provided to SavedArchives");
        }
    };

    // Filter Logic
    const filteredArchives = archives.filter(item => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Costing') return item.type === 'calculator';
        if (activeFilter === 'Schedules') return item.type === 'schedule';
        return true;
    });

    // Separate into categories for the different UI sections
    const allCalculatorArchives = filteredArchives.filter(a => a.type === 'calculator');
    const allScheduleArchives = filteredArchives.filter(a => a.type === 'schedule');

    // Pagination Logic
    const calcTotalPages = Math.ceil(allCalculatorArchives.length / ITEMS_PER_PAGE);
    const displayedCalcArchives = allCalculatorArchives.slice(
        (currentPageCalc - 1) * ITEMS_PER_PAGE,
        currentPageCalc * ITEMS_PER_PAGE
    );

    const schedTotalPages = Math.ceil(allScheduleArchives.length / ITEMS_PER_PAGE);
    const displayedSchedArchives = allScheduleArchives.slice(
        (currentPageSched - 1) * ITEMS_PER_PAGE,
        currentPageSched * ITEMS_PER_PAGE
    );

    // Reset pages when filter changes
    useEffect(() => {
        setCurrentPageCalc(1);
        setCurrentPageSched(1);
    }, [activeFilter]);

    return (
        <div className="flex-1 bg-background-light dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-10 min-h-screen font-display">
            <div className="max-w-[1400px] mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Saved Archives</h1>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">Manage your archived costing calculations and production schedules.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex p-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                            {['All', 'Costing', 'Schedules'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeFilter === filter ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    {filter === 'All' ? 'All Archives' : filter}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchArchives}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:ring-slate-700 dark:hover:bg-slate-700"
                        >
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        Loading Archives...
                    </div>
                ) : (
                    <>
                        {/* Calculator Archives Section */}
                        {(activeFilter === 'All' || activeFilter === 'Costing') && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[24px]">calculate</span>
                                        Calculator Archives
                                    </h2>
                                </div>

                                {allCalculatorArchives.length === 0 ? (
                                    <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                                        No saved calculations found.
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {displayedCalcArchives.map((archive) => {
                                                const pricing = archive.data?.pricing || {};
                                                const companyName = archive.data?.companyName || `Calculation #${archive.id}`;
                                                const bagWeightKg = (parseFloat(pricing.bagWeight) || 0) / 1000;
                                                const baseCost = (parseFloat(pricing.ppRate) || 0) * bagWeightKg + (parseFloat(pricing.conversionCost) || 0) + (parseFloat(pricing.transportPerBag) || 0);
                                                const price = (baseCost * (1 + (parseFloat(pricing.profitMargin) || 0) / 100)).toFixed(2);

                                                return (
                                                    <div
                                                        key={archive.id}
                                                        onClick={() => handleLoad(archive)}
                                                        className="group relative flex flex-col justify-between rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-primary/50 transition-all duration-200 p-5 cursor-pointer"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{companyName}</h3>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ID: P-{new Date(archive.created_at).getTime().toString().slice(-6)}</p>
                                                            </div>
                                                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{archive.status || 'Saved'}</span>
                                                        </div>
                                                        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                                                            <div>
                                                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Bag Price</p>
                                                                <p className="text-lg font-bold text-slate-900 dark:text-white">₹{price}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Weight</p>
                                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{pricing.bagWeight}g</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 flex items-center justify-between gap-2 pt-2">
                                                            <span className="text-xs text-slate-400">{new Date(archive.created_at).toLocaleDateString()}</span>
                                                            <div className="flex gap-1">
                                                                <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Open">
                                                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => deleteArchive(archive.id, e)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Delete"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Calculator Pagination Controls */}
                                        {calcTotalPages > 1 && (
                                            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                                                <p className="text-sm text-slate-500">
                                                    Page <span className="font-medium">{currentPageCalc}</span> of <span className="font-medium">{calcTotalPages}</span>
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setCurrentPageCalc(p => Math.max(1, p - 1))}
                                                        disabled={currentPageCalc === 1}
                                                        className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                                                    >
                                                        Previous
                                                    </button>
                                                    <button
                                                        onClick={() => setCurrentPageCalc(p => Math.min(calcTotalPages, p + 1))}
                                                        disabled={currentPageCalc === calcTotalPages}
                                                        className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>
                        )}

                        <hr className="border-slate-200 dark:border-slate-700 my-8" />

                        {/* Supply Schedule Archives Section */}
                        {(activeFilter === 'All' || activeFilter === 'Schedules') && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[24px]">schedule</span>
                                        Supply Schedule Archives
                                    </h2>
                                </div>
                                {allScheduleArchives.length === 0 ? (
                                    <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                                        No saved schedules found.
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {displayedSchedArchives.map(archive => {
                                                const po = archive.data?.poDetails || {};
                                                const companyName = archive.data?.companyName || po.customerName || 'Unknown Customer';
                                                return (
                                                    <div
                                                        key={archive.id}
                                                        onClick={() => handleLoad(archive)}
                                                        className="group relative flex flex-col justify-between rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-primary/50 transition-all duration-200 p-5 cursor-pointer"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{companyName}</h3>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PO: {po.poNumber}</p>
                                                            </div>
                                                            <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">Schedule</span>
                                                        </div>
                                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500">Total Qty:</span>
                                                                <span className="font-bold text-slate-900 dark:text-white">{Number(po.totalQty).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 flex items-center justify-between gap-2 pt-2">
                                                            <span className="text-xs text-slate-400">{new Date(archive.created_at).toLocaleDateString()}</span>
                                                            <div className="flex gap-1">
                                                                <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Open">
                                                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => deleteArchive(archive.id, e)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Delete"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Schedule Pagination Controls */}
                                        {schedTotalPages > 1 && (
                                            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                                                <p className="text-sm text-slate-500">
                                                    Page <span className="font-medium">{currentPageSched}</span> of <span className="font-medium">{schedTotalPages}</span>
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setCurrentPageSched(p => Math.max(1, p - 1))}
                                                        disabled={currentPageSched === 1}
                                                        className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                                                    >
                                                        Previous
                                                    </button>
                                                    <button
                                                        onClick={() => setCurrentPageSched(p => Math.min(schedTotalPages, p + 1))}
                                                        disabled={currentPageSched === schedTotalPages}
                                                        className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
