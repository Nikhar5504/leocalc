import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SupplySchedule() {

    // Helper to load from local storage
    const loadState = (key, fallback) => {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    };

    // --- State ---
    const [poDetails, setPoDetails] = useState(() => loadState('leocalc_poDetails', {
        customerName: 'Global Sacks Inc.',
        customerEmail: '',
        poNumber: '2024-LEO-885',
        totalQty: 100000,
    }));

    const [vendors, setVendors] = useState(() => loadState('leocalc_vendors', [
        { name: 'Vendor A', email: '', allocatedQty: 40000 },
        { name: 'Vendor B', email: '', allocatedQty: 60000 }
    ]));

    // Modal State
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showVendorExportModal, setShowVendorExportModal] = useState(false);

    // Vendor Form State
    const [newVendorName, setNewVendorName] = useState('');
    const [newVendorEmail, setNewVendorEmail] = useState('');
    const [newVendorAllocation, setNewVendorAllocation] = useState('');

    const [supplies, setSupplies] = useState(() => loadState('leocalc_supplies', [
        { id: 1, week: '4th week of October', vendor: 'Vendor A', plannedQty: 5000, date: '2023-10-12', status: 'Confirmed', notes: 'Initial batch per agreement' },
        { id: 2, week: '1st week of November', vendor: 'Vendor B', plannedQty: 12000, date: '2023-10-15', status: 'Pending', notes: '-' },
        { id: 3, week: '2nd week of November', vendor: 'Vendor A', plannedQty: 8000, date: '2023-10-20', status: 'Confirmed', notes: 'Expedited shipping requested' },
    ]));

    // --- Persistence Effects ---
    useEffect(() => { localStorage.setItem('leocalc_poDetails', JSON.stringify(poDetails)); }, [poDetails]);
    useEffect(() => { localStorage.setItem('leocalc_vendors', JSON.stringify(vendors)); }, [vendors]);
    useEffect(() => { localStorage.setItem('leocalc_supplies', JSON.stringify(supplies)); }, [supplies]);

    // --- Derived State (Calculations) ---
    const totalPlanned = useMemo(() => {
        return supplies.reduce((sum, item) => sum + (Number(item.plannedQty) || 0), 0);
    }, [supplies]);

    // Excess Calculation
    const excess = Math.max(0, totalPlanned - poDetails.totalQty);

    // Balance = PO Total - Total Planned
    const balance = Math.max(0, poDetails.totalQty - totalPlanned);

    // Colors for Vendor Allocation Bars
    const vendorColors = ['bg-emerald-500', 'bg-purple-500', 'bg-blue-500', 'bg-amber-500', 'bg-pink-500'];
    const vendorTextColors = ['text-emerald-600', 'text-purple-600', 'text-blue-600', 'text-amber-600', 'text-pink-600'];

    // Helper: Generate Week Label
    const getWeekLabel = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const dayOfMonth = date.getDate();
        const weekNum = Math.ceil(dayOfMonth / 7);
        const ordinal = weekNum === 1 ? '1st' : weekNum === 2 ? '2nd' : weekNum === 3 ? '3rd' : '4th';

        const monthName = date.toLocaleString('default', { month: 'long' });
        return `${ordinal} week of ${monthName}`;
    };

    // Date Calculations
    const dateStats = useMemo(() => {
        const dates = supplies.map(s => new Date(s.date)).filter(d => !isNaN(d));
        if (dates.length === 0) return { totalDays: 0, closureDate: '-' };

        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const diffTime = Math.abs(maxDate - minDate);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return {
            totalDays,
            closureDate: maxDate.toISOString().split('T')[0]
        };
    }, [supplies]);


    // --- Handlers ---
    const handlePoChange = (field, value) => {
        setPoDetails(prev => ({ ...prev, [field]: value }));
    };

    const updateSupply = (id, field, value) => {
        setSupplies(prev => {
            const updatedList = prev.map(item => {
                if (item.id !== id) return item;

                const updatedItem = { ...item, [field]: value };

                // Auto-update Week if Date changes
                if (field === 'date') {
                    updatedItem.week = getWeekLabel(value);
                }
                return updatedItem;
            });

            // Auto-Sort by Date
            return updatedList.sort((a, b) => {
                const dateA = new Date(a.date || '9999-12-31');
                const dateB = new Date(b.date || '9999-12-31');
                return dateA - dateB;
            });
        });
    };

    const addSupplyRow = () => {
        const newId = Math.max(...supplies.map(s => s.id), 0) + 1;

        // Auto-calculate next week based on last entry
        const lastSupply = supplies[supplies.length - 1];
        let nextDate = new Date();
        if (lastSupply && lastSupply.date) {
            nextDate = new Date(lastSupply.date);
            nextDate.setDate(nextDate.getDate() + 7);
        }

        const dateStr = nextDate.toISOString().split('T')[0];
        const weekLabel = getWeekLabel(dateStr);

        setSupplies([...supplies, {
            id: newId,
            week: weekLabel,
            vendor: vendors[0]?.name || '',
            plannedQty: 0,
            date: dateStr,
            status: 'Draft',
            notes: ''
        }]);
    };

    const deleteSupplyRow = (id) => {
        setSupplies(prev => prev.filter(s => s.id !== id));
    };

    // --- Vendor Management ---
    const addVendor = () => {
        if (newVendorName.trim() && !vendors.find(v => v.name === newVendorName.trim())) {
            setVendors([...vendors, {
                name: newVendorName.trim(),
                email: newVendorEmail.trim(),
                allocatedQty: Number(newVendorAllocation) || 0
            }]);
            setNewVendorName('');
            setNewVendorEmail('');
            setNewVendorAllocation('');
        }
    };

    const removeVendor = (vendorName) => {
        setVendors(vendors.filter(v => v.name !== vendorName));
    };

    // --- PDF Logic ---
    const loadImage = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Failed to load image", e);
            return null;
        }
    };

    const generatePdfDocument = async (recipientName, statsOverride = null) => {
        const doc = new jsPDF();

        // We might not have white icon anymore since we moved to light mode, but let's keep logic safe
        // Or assume we use standard logo if present.
        const logoFull = await loadImage('/leopack-logo-white.png');
        const logoIcon = await loadImage('/leopack-logo-icon.png');

        // Watermark
        if (logoIcon) {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const imgWidth = 100;
            const imgHeight = 100;
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;
            doc.setGState(new doc.GState({ opacity: 0.1 }));
            doc.addImage(logoIcon, 'PNG', x, y, imgWidth, imgHeight);
            doc.setGState(new doc.GState({ opacity: 1.0 }));
        }

        // Header
        doc.setFillColor(0, 0, 128); // Dark Blue
        doc.rect(14, 15, 70, 24, 'F');
        doc.setFillColor(0, 200, 83); // Green Highlight
        doc.rect(84, 15, 2, 24, 'F');

        if (logoFull) {
            const w = 50; const h = 12;
            const lx = 14 + (70 - w) / 2;
            const ly = 15 + (24 - h) / 2;
            doc.addImage(logoFull, 'PNG', lx, ly, w, h);
        } else {
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("LEOPACK", 49, 30, { align: "center" });
        }

        doc.setTextColor(51, 65, 85);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("Supply Schedule", 196, 31, { align: 'right' });

        // Metadata Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        const boxY = 55;
        doc.roundedRect(14, boxY, 182, 35, 2, 2, 'FD');

        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);

        // Col 1
        const recipientLabel = statsOverride ? "VENDOR:" : "CUSTOMER:";
        doc.setFont("helvetica", "bold");
        doc.text(recipientLabel, 20, boxY + 10);
        doc.setFont("helvetica", "normal");
        doc.text(recipientName || "N/A", 20, boxY + 15);

        doc.setFont("helvetica", "bold");
        doc.text("PO REFERENCE:", 20, boxY + 25);
        doc.setFont("helvetica", "normal");
        doc.text(poDetails.poNumber || "N/A", 20, boxY + 30);

        // Col 2
        doc.setFont("helvetica", "bold");
        doc.text("EST. CLOSURE:", 80, boxY + 10);
        doc.setFont("helvetica", "normal");
        doc.text(dateStats.closureDate, 80, boxY + 15);
        doc.setFont("helvetica", "bold");
        doc.text("DURATION:", 80, boxY + 25);
        doc.setFont("helvetica", "normal");
        doc.text(`${dateStats.totalDays} Days`, 80, boxY + 30);

        // Col 3
        const pdfTotalQty = statsOverride ? statsOverride.totalQty : poDetails.totalQty;
        const pdfBalance = statsOverride ? statsOverride.balance : balance;
        const pdfExcess = statsOverride ? statsOverride.excess : excess;

        doc.setFont("helvetica", "bold");
        doc.text("TOTAL QTY:", 140, boxY + 10);
        doc.setFont("helvetica", "normal");
        doc.text(Number(pdfTotalQty).toLocaleString(), 140, boxY + 15);
        doc.setFont("helvetica", "bold");
        doc.text("BALANCE:", 140, boxY + 25);

        if (pdfExcess > 0) {
            doc.setTextColor(220, 38, 38);
            doc.text(`EXCESS: +${pdfExcess.toLocaleString()}`, 140, boxY + 30);
        } else {
            doc.setTextColor(220, 38, 38);
            doc.text(pdfBalance.toLocaleString(), 140, boxY + 30);
        }

        // Footer
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFillColor(0, 0, 128);
        doc.rect(0, pageHeight - 15, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("sales@leopack.in          |          Plot No.: 3002/F/1/S/113, GIDC Ankleshwar          |          +91 81285 99591", 105, pageHeight - 6, { align: 'center' });

        return doc;
    };

    const addPageNumbers = (doc) => {
        const pageCount = doc.internal.getNumberOfPages();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, 196, pageHeight - 18, { align: 'right' });
        }
    };

    const handleCustomerDownload = async () => {
        const doc = await generatePdfDocument(poDetails.customerName);
        const tableData = supplies.map(row => [row.week, row.date, "Leopack", Number(row.plannedQty).toLocaleString(), row.status]);
        autoTable(doc, {
            startY: 100,
            head: [['WEEK', 'SUPPLY DATE', 'SUPPLIER', 'PLANNED QTY', 'STATUS']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
            columnStyles: { 3: { halign: 'left', fontStyle: 'bold' } },
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });
        addPageNumbers(doc);
        doc.save(`Supply_Schedule_${poDetails.customerName || 'Customer'}.pdf`);
    };

    const handleVendorDownload = async (vendorName) => {
        if (!vendorName) return;
        const vendorObj = vendors.find(v => v.name === vendorName);
        const vendorSupplies = supplies.filter(s => s.vendor === vendorName);
        const vendorPreAllocated = Number(vendorObj?.allocatedQty) || 0;
        const vendorPlanned = vendorSupplies.reduce((sum, item) => sum + (Number(item.plannedQty) || 0), 0);
        const vendorBalance = Math.max(0, vendorPreAllocated - vendorPlanned);
        const vendorExcess = Math.max(0, vendorPlanned - vendorPreAllocated);

        const doc = await generatePdfDocument(vendorName, { totalQty: vendorPreAllocated, balance: vendorBalance, excess: vendorExcess });
        const tableData = vendorSupplies.map(row => [row.week, row.date, Number(row.plannedQty).toLocaleString(), row.status]);

        autoTable(doc, {
            startY: 100,
            head: [['WEEK', 'EXPECTED DATE', 'PLANNED QTY', 'STATUS']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
            columnStyles: { 2: { halign: 'left', fontStyle: 'bold' } },
            styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });
        addPageNumbers(doc);
        doc.save(`Supply_Schedule_${vendorName}.pdf`);
        setShowVendorExportModal(false);
    };

    // --- Render ---
    return (
        <div className="font-display text-text-main selection:bg-primary selection:text-white bg-white min-h-screen flex flex-col pb-24 rounded-xl overflow-hidden shadow-sm border border-border-light">

            {/* Main Content */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-6 flex flex-col gap-6">

                {/* Page Header & Master Stats */}
                <div className="flex flex-col gap-6">
                    {/* Title & Metadata */}
                    <div className="flex flex-wrap justify-between items-end gap-4">
                        <div className="flex flex-col gap-1">
                            {/* Header Text removed as it is now in App.jsx Tab Header */}
                            {/* But we kept 'Supply Schedule' as h1 in previous, let's keep it as Section Title here? 
                                 Actually App.jsx shows header. Let's make this more dashboard-y internal header */}
                            <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-text-muted text-sm font-semibold">Customer:</span>
                                    <input
                                        type="text"
                                        value={poDetails.customerName}
                                        onChange={(e) => handlePoChange('customerName', e.target.value)}
                                        className="bg-transparent border-b border-border-light focus:border-primary text-text-main font-bold outline-none w-40 text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-text-muted text-sm font-semibold">PO #:</span>
                                    <input
                                        type="text"
                                        value={poDetails.poNumber}
                                        onChange={(e) => handlePoChange('poNumber', e.target.value)}
                                        className="bg-transparent border-b border-border-light focus:border-primary text-text-main font-bold outline-none w-32 text-sm"
                                    />
                                </div>
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Active</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowVendorModal(true)}
                                className="h-9 px-4 rounded-lg bg-white border border-border-light hover:bg-slate-50 text-text-muted hover:text-text-main text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[18px]">settings</span>
                                Manage Vendors
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Quantity */}
                        <div className="flex flex-col gap-3 rounded-xl p-5 border border-border-light bg-slate-50 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-6xl text-primary">inventory_2</span>
                            </div>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Total PO Quantity</p>
                            <div className="flex items-end gap-2">
                                <input
                                    type="number"
                                    value={poDetails.totalQty}
                                    onChange={(e) => handlePoChange('totalQty', Number(e.target.value))}
                                    className="text-text-main text-3xl font-bold leading-tight bg-transparent border-none outline-none w-full"
                                />
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                                <div className="bg-primary h-1.5 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        {/* Vendors Stats Dynamic */}
                        {vendors.map((vendor, index) => {
                            const allocPercent = poDetails.totalQty > 0 ? (vendor.allocatedQty / poDetails.totalQty) * 100 : 0;
                            const colorClass = vendorColors[index % vendorColors.length];
                            const textColorClass = vendorTextColors[index % vendorTextColors.length];

                            return (
                                <div key={vendor.name} className="flex flex-col gap-3 rounded-xl p-5 border border-border-light bg-slate-50 relative overflow-hidden hover:shadow-md transition-all">
                                    <div className="absolute right-0 top-0 p-3 opacity-5">
                                        <span className="material-symbols-outlined text-6xl text-slate-900">person</span>
                                    </div>
                                    <p className="text-text-muted text-xs font-bold uppercase tracking-wider flex justify-between">
                                        {vendor.name}
                                        <span className={`${textColorClass} text-xs`}>{Math.round(allocPercent)}%</span>
                                    </p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-text-main text-3xl font-bold leading-tight">{Number(vendor.allocatedQty).toLocaleString()}</p>
                                        <span className="text-xs font-semibold text-text-muted mb-1">Units</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                                        <div className={`${colorClass} h-1.5 rounded-full`} style={{ width: `${Math.min(100, allocPercent)}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex flex-col rounded-xl border border-border-light bg-white shadow-sm overflow-hidden flex-1 min-h-[500px]">
                    {/* Toolbar */}
                    <div className="flex flex-wrap justify-between items-center gap-3 px-4 py-3 border-b border-border-light bg-slate-50">
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-white border border-border-light text-xs font-semibold text-text-muted shadow-sm">
                                <span>Shown:</span>
                                <span className="text-text-main">{supplies.length} Rows</span>
                            </div>
                        </div>
                        <button
                            onClick={addSupplyRow}
                            className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 bg-primary hover:bg-primary/90 transition-colors text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] px-4 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span>Add Row</span>
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-border-light">
                                    <th className="px-6 py-3 text-xs font-bold text-text-muted uppercase tracking-wider w-48">Vendor</th>
                                    <th className="px-6 py-3 text-xs font-bold text-text-muted uppercase tracking-wider w-48">Delivery Date</th>
                                    <th className="px-6 py-3 text-xs font-bold text-text-muted uppercase tracking-wider w-32">Week #</th>
                                    <th className="px-6 py-3 text-xs font-bold text-text-muted uppercase tracking-wider w-48 text-right">Planned Qty</th>
                                    <th className="px-6 py-3 text-xs font-bold text-text-muted uppercase tracking-wider w-40">Status</th>
                                    <th className="px-6 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Notes</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {supplies.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                                        {/* Vendor Select */}
                                        <td className="px-6 py-3">
                                            <select
                                                value={row.vendor}
                                                onChange={(e) => updateSupply(row.id, 'vendor', e.target.value)}
                                                className="w-full bg-white border border-border-light text-text-main text-sm font-medium rounded px-2 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer shadow-sm"
                                            >
                                                {vendors.map(v => (
                                                    <option key={v.name} value={v.name}>{v.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        {/* Date Input */}
                                        <td className="px-6 py-3">
                                            <input
                                                type="date"
                                                value={row.date}
                                                onChange={(e) => updateSupply(row.id, 'date', e.target.value)}
                                                className="bg-white border border-border-light text-text-main text-sm font-medium rounded px-2 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary w-fit shadow-sm"
                                            />
                                        </td>
                                        {/* Week (Read only/Auto) */}
                                        <td className="px-6 py-3 text-text-muted text-sm font-mono whitespace-nowrap font-medium">{row.week}</td>
                                        {/* Qty Input */}
                                        <td className="px-6 py-3">
                                            <input
                                                type="number"
                                                value={row.plannedQty}
                                                onChange={(e) => updateSupply(row.id, 'plannedQty', e.target.value)}
                                                className="w-full text-right bg-white border border-border-light text-text-main text-sm font-bold rounded px-2 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary tabular-nums shadow-sm"
                                            />
                                        </td>
                                        {/* Status Select */}
                                        <td className="px-6 py-3">
                                            <select
                                                value={row.status}
                                                onChange={(e) => updateSupply(row.id, 'status', e.target.value)}
                                                className="bg-transparent text-xs font-bold border-none focus:ring-0 cursor-pointer"
                                                style={{
                                                    color: row.status === 'Confirmed' ? '#16a34a' :
                                                        row.status === 'Received' ? '#15803d' :
                                                            row.status === 'Pending' ? '#d97706' :
                                                                row.status === 'In Transit' ? '#2563eb' : '#64748b'
                                                }}
                                            >
                                                <option value="Planned">Planned</option>
                                                <option value="Confirmed">Confirmed</option>
                                                <option value="In Transit">In Transit</option>
                                                <option value="Received">Received</option>
                                                <option value="Draft">Draft</option>
                                            </select>
                                        </td>
                                        {/* Notes Input */}
                                        <td className="px-6 py-3">
                                            <input
                                                type="text"
                                                value={row.notes || ''}
                                                placeholder="Add notes..."
                                                onChange={(e) => updateSupply(row.id, 'notes', e.target.value)}
                                                className="w-full bg-transparent border-none text-text-main text-sm px-0 py-1 focus:ring-0 placeholder:text-slate-300 font-medium"
                                            />
                                        </td>
                                        {/* Delete Action */}
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => deleteSupplyRow(row.id)}
                                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Sticky Balance Tracker Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-border-light shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
                <div className="max-w-[1600px] mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Tracker Visualization */}
                        <div className="flex-1 w-full md:w-auto flex items-center gap-6">
                            <div className="flex flex-col gap-1 w-full max-w-2xl">
                                <div className="flex justify-between items-end mb-1">
                                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">analytics</span>
                                        Balance Tracker
                                    </h3>
                                    <div className="flex gap-4 text-sm font-medium">
                                        <span className="text-text-muted">Total Planned: <span className="text-text-main font-bold">{totalPlanned.toLocaleString()}</span></span>
                                        <span className="text-text-muted">/</span>
                                        <span className="text-text-muted">PO Limit: <span className="text-text-main font-bold">{Number(poDetails.totalQty).toLocaleString()}</span></span>
                                    </div>
                                </div>
                                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
                                    <div className={`absolute top-0 left-0 h-full ${excess > 0 ? 'bg-red-500' : 'bg-primary'} transition-all duration-300`} style={{ width: `${Math.min(100, (totalPlanned / poDetails.totalQty) * 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between mt-1 h-5">
                                    <span className={`text-xs font-bold ${balance === 0 ? 'text-emerald-600' : 'text-text-muted'}`}>
                                        {balance === 0 ? "Perfectly Balanced" : `Remaining: ${balance.toLocaleString()}`}
                                    </span>
                                    {excess > 0 && (
                                        <span className="text-xs font-bold text-red-500 flex items-center gap-1 animate-pulse">
                                            <span className="material-symbols-outlined text-[14px]">warning</span>
                                            EXCESS: +{excess.toLocaleString()} Units
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <button
                                onClick={() => setShowVendorExportModal(true)}
                                className="h-10 px-4 rounded-lg bg-white border border-border-light hover:bg-slate-50 text-text-muted text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                                Vendor PDF
                            </button>
                            <button
                                onClick={handleCustomerDownload}
                                className="h-10 px-4 rounded-lg bg-text-main text-white hover:bg-slate-800 text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-slate-900/20"
                            >
                                <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                                Customer PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Vendor Management Modal --- */}
            {showVendorModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-border-light rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-text-main">Manage Vendors</h3>
                            <button onClick={() => setShowVendorModal(false)} className="text-text-muted hover:text-text-main">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={newVendorName}
                                onChange={e => setNewVendorName(e.target.value)}
                                placeholder="Name"
                                className="bg-slate-50 border border-border-light text-text-main rounded px-3 py-2 flex-1 focus:ring-1 focus:ring-primary focus:border-primary text-sm font-medium"
                            />
                            <input
                                type="number"
                                value={newVendorAllocation}
                                onChange={e => setNewVendorAllocation(e.target.value)}
                                placeholder="Qty"
                                className="bg-slate-50 border border-border-light text-text-main rounded px-3 py-2 w-24 focus:ring-1 focus:ring-primary focus:border-primary text-sm font-medium"
                            />
                            <button onClick={addVendor} className="bg-primary text-white px-4 rounded hover:bg-primary/90 font-bold text-sm">Add</button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {vendors.map(v => (
                                <div key={v.name} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-border-light">
                                    <div>
                                        <div className="font-bold text-text-main text-sm">{v.name}</div>
                                        <div className="text-xs text-text-muted font-medium">{Number(v.allocatedQty).toLocaleString()} Units</div>
                                    </div>
                                    <button onClick={() => removeVendor(v.name)} className="text-text-muted hover:text-red-500">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Vendor Export Modal --- */}
            {showVendorExportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-border-light rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-text-main">Select Vendor</h3>
                            <button onClick={() => setShowVendorExportModal(false)} className="text-text-muted hover:text-text-main">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {vendors.map(v => (
                                <button
                                    key={v.name}
                                    onClick={() => handleVendorDownload(v.name)}
                                    className="p-3 text-left hover:bg-slate-50 rounded text-text-main flex justify-between items-center group font-medium"
                                >
                                    {v.name}
                                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary">download</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
