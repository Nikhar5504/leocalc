import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function SavedArchives({ onLoad }) {
    const [activeFilter, setActiveFilter] = useState('All');
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);

    // View Mode State
    const [viewMode, setViewMode] = useState('companies'); // 'companies' | 'details'
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyPage, setCompanyPage] = useState(1);
    const COMPANIES_PER_PAGE = 20;

    const [moveModal, setMoveModal] = useState({ show: false, archiveId: null, currentCompany: '' });
    const [targetCompany, setTargetCompany] = useState('');
    const [newTargetCompany, setNewTargetCompany] = useState('');

    const [renameModal, setRenameModal] = useState({ show: false, oldName: '', newName: '' });
    const [deleteCompanyModal, setDeleteCompanyModal] = useState({ show: false, companyName: '', inputName: '' });

    // Persistent Company State (to keep empty ones visible until deleted)
    const [knownCompanies, setKnownCompanies] = useState([]);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

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
            if (error) throw error;
            setArchives(data || []);

            // Initial Load of Companies
            const unique = [...new Set((data || []).map(a => a.company_name || 'Unassigned'))].sort();
            setKnownCompanies(prev => {
                // Merge with existing known (in case fetch happens later but we added one locally?)
                // Actually, fetch overwrites. But we want to strictly add new unique ones found.
                // Simpler: Just set it initially. If we want persistence across re-fetches, we merge.
                // Let's just set it for now, as re-fetch usually means full reload here.
                return unique;
            });
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
            console.error('Error deleting archive:', err);
            alert(`Failed to delete archive. Error: ${err.message || JSON.stringify(err)}`);
        }
    };

    const openMoveModal = (e, archive) => {
        e.stopPropagation();
        setMoveModal({ show: true, archiveId: archive.id, currentCompany: archive.company_name || '' });
        setTargetCompany('');
        setNewTargetCompany('');
    };

    const handleMoveArchive = async () => {
        const finalCompany = targetCompany === 'NEW_COMPANY_OPTION' ? newTargetCompany : targetCompany;
        if (!finalCompany || finalCompany.trim() === '') {
            alert('Please select or enter a valid company name.');
            return;
        }

        try {
            const { error } = await supabase
                .from('archives')
                .update({ company_name: finalCompany })
                .eq('id', moveModal.archiveId);

            if (error) throw error;

            // Update local state
            setArchives(prev => prev.map(a => a.id === moveModal.archiveId ? { ...a, company_name: finalCompany } : a));

            // Update Known Companies if new one created.
            setKnownCompanies(prev => {
                if (!prev.includes(finalCompany)) return [...prev, finalCompany].sort();
                return prev;
            });

            setMoveModal({ show: false, archiveId: null, currentCompany: '' });
        } catch (err) {
            console.error('Error moving archive:', err);
            alert('Failed to move archive.');
        }
    };

    const handleRenameCompany = async () => {
        const { oldName, newName } = renameModal;
        if (!newName || newName.trim() === '') {
            alert('Please enter a valid company name.');
            return;
        }
        if (newName === oldName) {
            setRenameModal({ show: false, oldName: '', newName: '' });
            return;
        }

        try {
            const { error } = await supabase
                .from('archives')
                .update({ company_name: newName })
                .eq('company_name', oldName);

            if (error) throw error;

            // Update local state
            setArchives(prev => prev.map(a => (a.company_name || 'Unassigned') === oldName ? { ...a, company_name: newName } : a));

            // Update Known Companies list
            setKnownCompanies(prev => {
                const updated = prev.map(c => c === oldName ? newName : c).sort();
                return updated;
            });

            setRenameModal({ show: false, oldName: '', newName: '' });
        } catch (err) {
            console.error('Error renaming company:', err);
            alert('Failed to rename company.');
        }
    };

    const handleDeleteCompany = () => {
        const { companyName } = deleteCompanyModal;
        if (deleteCompanyModal.inputName !== companyName) {
            alert('The company name you entered does not match.');
            return;
        }

        // Remove from knownCompanies
        setKnownCompanies(prev => prev.filter(c => c !== companyName));
        setDeleteCompanyModal({ show: false, companyName: '', inputName: '' });
        alert(`Company "${companyName}" has been deleted.`);
    };

    const handleLoad = (archive) => {
        if (onLoad) onLoad(archive);
    };

    // --- Search Logic ---
    const isSearching = searchQuery.trim().length > 0;
    const searchResults = isSearching
        ? archives.filter(a => JSON.stringify(a).toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    // --- View Logic ---
    // Use knownCompanies for display instead of derived uniqueCompanies
    // const uniqueCompanies = [...new Set(archives.map(a => a.company_name || 'Unassigned'))].sort();

    // Pagination for Companies
    const totalCompanyPages = Math.ceil(knownCompanies.length / COMPANIES_PER_PAGE);
    const displayedCompanies = knownCompanies.slice((companyPage - 1) * COMPANIES_PER_PAGE, companyPage * COMPANIES_PER_PAGE);

    const handleCompanyClick = (company) => {
        setSelectedCompany(company);
        setViewMode('details');
    };

    const handleBackToGrid = () => {
        setSelectedCompany(null);
        setViewMode('companies');
    };

    // Filter logic for Detail View
    const getFilteredArchivesForCompany = (companyName) => {
        return archives.filter(a => {
            const matchesCompany = (a.company_name || 'Unassigned') === companyName;
            if (!matchesCompany) return false;
            if (activeFilter === 'All') return true;
            if (activeFilter === 'Costing') return a.type === 'calculator';
            if (activeFilter === 'Schedules') return a.type === 'schedule';
            if (activeFilter === 'Quantities') return a.type === 'quantities';
            return true;
        });
    };

    return (
        <div className="flex flex-col gap-6 w-full font-display">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-2">
                <div>
                    <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">Saved Archives</h1>
                    <p className="text-slate-500 text-base font-normal">Manage your production history and cost analysis records.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    {/* Search Bar */}
                    <div className="relative group w-full sm:w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-primary focus:border-primary transition-all shadow-sm hover:border-slate-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto">
                        {['All', 'Costing', 'Schedules', 'Quantities'].map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === f ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
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
                <div className="space-y-6">
                    {/* View Mode: Search Results */}
                    {isSearching && (
                        <div className="animate-fade-in">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">search</span>
                                Search Results
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{searchResults.length} found</span>
                            </h2>

                            {searchResults.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {searchResults.map(a => {
                                        const isCalc = a.type === 'calculator';
                                        const isSched = a.type === 'schedule';
                                        const isQuant = a.type === 'quantities';
                                        let title = 'Record';
                                        let subTitle = '';
                                        let mainMetricLabel = '';
                                        let mainMetricValue = '';

                                        if (isCalc) {
                                            title = a.data?.companyName || `Costing #${a.id}`;
                                            subTitle = 'Costing Engine';
                                            mainMetricLabel = 'Bag Price';
                                            const p = a.data?.pricing || {};
                                            const vendorCost = (Number(p.ppRate) + Number(p.transportPerBag) + Number(p.conversionCost)) * Number(p.bagWeight);
                                            const price = vendorCost * (1 + (Number(p.profitMargin) / 100));
                                            mainMetricValue = price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
                                        } else if (isSched) {
                                            const po = a.data?.poDetails || {};
                                            title = po.customerName || 'Unknown';
                                            subTitle = `PO: ${po.poNumber}`;
                                            mainMetricLabel = 'Total Qty';
                                            mainMetricValue = `${Number(po.totalQty).toLocaleString()} Units`;
                                        } else if (isQuant) {
                                            const prods = a.data?.products || [];
                                            title = a.data?.companyName || 'Analysis';
                                            subTitle = `${prods.length} Products`;
                                            mainMetricLabel = 'Est. Net Profit';
                                            mainMetricValue = prods.reduce((s, p) => s + ((Number(p.customerPrice) - Number(p.vendorCost)) * (Number(p.qty) || 0)), 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
                                        }

                                        return (
                                            <div key={a.id} className="group flex flex-col bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all relative overflow-hidden">
                                                <div
                                                    className="absolute inset-0 z-0 cursor-pointer"
                                                    onClick={() => handleLoad(a)}
                                                    title="Load this record"
                                                ></div>
                                                <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-[9px] font-black uppercase tracking-wider ${isCalc ? 'bg-blue-50 text-blue-600' : isSched ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {isCalc ? 'Costing' : isSched ? 'Schedule' : 'Quantities'}
                                                </div>
                                                <div className="flex justify-between items-start mb-4 mt-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <h3 className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors truncate w-40">{title}</h3>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{subTitle}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-end">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mainMetricLabel}</span>
                                                        <span className={`text-sm font-black ${isQuant ? 'text-emerald-600' : 'text-slate-900'}`}>{mainMetricValue}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-20">
                                                        <button onClick={(e) => openMoveModal(e, a)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-md transition-all" title="Move">
                                                            <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                                                        </button>
                                                        <button onClick={(e) => deleteArchive(a.id, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all" title="Delete">
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                                    <p className="font-bold">No results found for "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View Mode: Companies Grid */}
                    {!isSearching && viewMode === 'companies' && (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {displayedCompanies.map(company => {
                                    const count = archives.filter(a => (a.company_name || 'Unassigned') === company).length;
                                    // Find latest date
                                    const latest = archives
                                        .filter(a => (a.company_name || 'Unassigned') === company)
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

                                    return (
                                        <div
                                            key={company}
                                            className="relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-primary/50 transition-all group flex flex-col items-center text-center gap-3"
                                        >
                                            {/* Click Overlay for Navigation */}
                                            <div
                                                className="absolute inset-0 z-0 cursor-pointer"
                                                onClick={() => handleCompanyClick(company)}
                                                title={`View ${company} records`}
                                            ></div>
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors relative">
                                                <span className="material-symbols-outlined text-[24px]">business</span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-800 line-clamp-1" title={company}>{company}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{count} Records</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Double safety
                                                    setRenameModal({ show: true, oldName: company, newName: company });
                                                }}
                                                className="absolute top-2 right-2 z-20 p-1.5 text-slate-300 hover:text-primary hover:bg-slate-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Rename Company"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Double safety
                                                    if (count > 0) {
                                                        alert(`Cannot delete company "${company}". It contains ${count} records. Delete them first.`);
                                                        return;
                                                    }
                                                    setDeleteCompanyModal({ show: true, companyName: company, inputName: '' });
                                                }}
                                                className="absolute top-2 left-2 z-20 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Company"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                            {latest && (
                                                <div className="mt-auto pt-2 border-t border-slate-50 w-full">
                                                    <p className="text-[9px] text-slate-400">Last: {new Date(latest.created_at).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Controls */}
                            {totalCompanyPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-8">
                                    <button
                                        onClick={() => setCompanyPage(p => Math.max(1, p - 1))}
                                        disabled={companyPage === 1}
                                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <span className="material-symbols-outlined text-slate-500">chevron_left</span>
                                    </button>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Page {companyPage} of {totalCompanyPages}</span>
                                    <button
                                        onClick={() => setCompanyPage(p => Math.min(totalCompanyPages, p + 1))}
                                        disabled={companyPage === totalCompanyPages}
                                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                                    </button>
                                </div>
                            )}
                            {displayedCompanies.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                    <span className="material-symbols-outlined text-slate-300 text-6xl mb-4">archive</span>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest">No saved records found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View Mode: Details (Drill-down) */}
                    {!isSearching && viewMode === 'details' && selectedCompany && (
                        <div className="animate-fade-in">
                            <button
                                onClick={handleBackToGrid}
                                className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                Back to Companies
                            </button>

                            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                {selectedCompany}
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                    {getFilteredArchivesForCompany(selectedCompany).length} Records
                                </span>
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {getFilteredArchivesForCompany(selectedCompany).map(a => {
                                    const isCalc = a.type === 'calculator';
                                    const isSched = a.type === 'schedule';
                                    const isQuant = a.type === 'quantities';

                                    // Data Extraction
                                    let title = 'Record';
                                    let subTitle = '';
                                    let mainMetricLabel = '';
                                    let mainMetricValue = '';
                                    let date = new Date(a.created_at).toLocaleDateString();

                                    if (isCalc) {
                                        title = a.data?.companyName || `Costing #${a.id}`;
                                        subTitle = 'Costing Engine';
                                        mainMetricLabel = 'Bag Price';
                                        const p = a.data?.pricing || {};
                                        const vendorCost = (Number(p.ppRate) + Number(p.transportPerBag) + Number(p.conversionCost)) * Number(p.bagWeight);
                                        const price = vendorCost * (1 + (Number(p.profitMargin) / 100));
                                        mainMetricValue = price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
                                    } else if (isSched) {
                                        const po = a.data?.poDetails || {};
                                        title = po.customerName || 'Unknown';
                                        subTitle = `PO: ${po.poNumber}`;
                                        mainMetricLabel = 'Total Qty';
                                        mainMetricValue = `${Number(po.totalQty).toLocaleString()} Units`;
                                    } else if (isQuant) {
                                        const prods = a.data?.products || [];
                                        title = a.data?.companyName || 'Analysis';
                                        subTitle = `${prods.length} Products`;
                                        mainMetricLabel = 'Est. Net Profit';
                                        mainMetricValue = prods.reduce((s, p) => s + ((Number(p.customerPrice) - Number(p.vendorCost)) * (Number(p.qty) || 0)), 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
                                    }

                                    return (
                                        <div key={a.id} className="group flex flex-col bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all relative overflow-hidden">
                                            {/* Click Overlay for Loading Archive */}
                                            <div
                                                className="absolute inset-0 z-0 cursor-pointer"
                                                onClick={() => handleLoad(a)}
                                                title="Load this record"
                                            ></div>

                                            {/* Type Badge */}
                                            <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-[9px] font-black uppercase tracking-wider ${isCalc ? 'bg-blue-50 text-blue-600' : isSched ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {isCalc ? 'Costing' : isSched ? 'Schedule' : 'Quantities'}
                                            </div>

                                            <div className="flex justify-between items-start mb-4 mt-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <h3 className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors truncate w-40">{title}</h3>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{subTitle}</span>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mainMetricLabel}</span>
                                                    <span className={`text-sm font-black ${isQuant ? 'text-emerald-600' : 'text-slate-900'}`}>{mainMetricValue}</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-20">
                                                    <button
                                                        onClick={(e) => openMoveModal(e, a)}
                                                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-md transition-all"
                                                        title="Move to another company"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => deleteArchive(a.id, e)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                        title="Delete"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {getFilteredArchivesForCompany(selectedCompany).length === 0 && (
                                <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    No records found for this filter.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Move Modal */}
            {moveModal.show && (
                <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-slate-900">Move Archive</h3>
                            <p className="text-xs text-slate-500 mt-1">Current: <span className="font-semibold text-primary">{moveModal.currentCompany}</span></p>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <label className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Move to</span>
                                <select
                                    className="form-select rounded-lg border-slate-200 bg-slate-50 text-sm font-medium focus:ring-primary focus:border-primary"
                                    value={targetCompany}
                                    onChange={(e) => setTargetCompany(e.target.value)}
                                >
                                    <option value="" disabled>-- Select Company --</option>
                                    {knownCompanies.filter(c => c !== moveModal.currentCompany).map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="NEW_COMPANY_OPTION">+ Create New Company</option>
                                </select>
                            </label>

                            {targetCompany === 'NEW_COMPANY_OPTION' && (
                                <input
                                    className="form-input rounded-lg border-slate-200 text-sm font-medium focus:ring-primary focus:border-primary"
                                    placeholder="Enter new company name..."
                                    value={newTargetCompany}
                                    onChange={(e) => setNewTargetCompany(e.target.value)}
                                    autoFocus
                                />
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setMoveModal({ show: false, archiveId: null, currentCompany: '' })}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMoveArchive}
                                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-md transition-all"
                            >
                                Move
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Rename Modal */}
            {renameModal.show && (
                <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-slate-900">Rename Company</h3>
                            <p className="text-xs text-slate-500 mt-1">Renaming <span className="font-semibold text-primary">{renameModal.oldName}</span></p>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <label className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Name</span>
                                <input
                                    className="form-input rounded-lg border-slate-200 text-sm font-medium focus:ring-primary focus:border-primary"
                                    placeholder="Enter new company name..."
                                    value={renameModal.newName}
                                    onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                                    autoFocus
                                />
                            </label>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setRenameModal({ show: false, oldName: '', newName: '' })}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRenameCompany}
                                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-md transition-all"
                            >
                                Rename
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
