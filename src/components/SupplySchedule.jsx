import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, FileDown, Settings, X, Download } from 'lucide-react';
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
        customerName: '',
        customerEmail: '',
        poNumber: '',
        totalQty: 10000,
    }));

    const [vendors, setVendors] = useState(() => loadState('leocalc_vendors', [
        { name: 'Vendor A', email: '', allocatedQty: 0 },
        { name: 'Vendor B', email: '', allocatedQty: 0 },
        { name: 'Vendor C', email: '', allocatedQty: 0 }
    ]));
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showVendorExportModal, setShowVendorExportModal] = useState(false);

    // Vendor Form State
    const [newVendorName, setNewVendorName] = useState('');
    const [newVendorEmail, setNewVendorEmail] = useState('');
    const [newVendorAllocation, setNewVendorAllocation] = useState('');

    const [supplies, setSupplies] = useState(() => loadState('leocalc_supplies', [
        { id: 1, week: '4th week of October', vendor: 'Vendor A', plannedQty: 2500, date: '2023-10-23', status: 'Received' },
        { id: 2, week: '1st week of November', vendor: 'Vendor B', plannedQty: 3000, date: '2023-11-01', status: 'Planned' },
        { id: 3, week: '2nd week of November', vendor: 'Vendor C', plannedQty: 2000, date: '2023-11-08', status: 'Planned' },
    ]));

    // --- Persistence Effects ---
    useEffect(() => { localStorage.setItem('leocalc_poDetails', JSON.stringify(poDetails)); }, [poDetails]);
    useEffect(() => { localStorage.setItem('leocalc_vendors', JSON.stringify(vendors)); }, [vendors]);
    useEffect(() => { localStorage.setItem('leocalc_supplies', JSON.stringify(supplies)); }, [supplies]);

    const [selectedVendorForExport, setSelectedVendorForExport] = useState('');

    // --- Derived State (Calculations) ---
    // CHANGED: Logic now focuses on Planned Qty only
    const totalPlanned = useMemo(() => {
        return supplies.reduce((sum, item) => sum + (Number(item.plannedQty) || 0), 0);
    }, [supplies]);

    // Excess Calculation
    const excess = Math.max(0, totalPlanned - poDetails.totalQty);

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

    // Balance = PO Total - Total Planned
    const balance = Math.max(0, poDetails.totalQty - totalPlanned);
    const progressPercent = Math.min(100, (totalPlanned / poDetails.totalQty) * 100) || 0;

    // Date Calculations
    const dateStats = useMemo(() => {
        const dates = supplies.map(s => new Date(s.date)).filter(d => !isNaN(d));
        if (dates.length === 0) return { totalDays: 0, closureDate: '-' };

        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        // Approx days difference
        const diffTime = Math.abs(maxDate - minDate);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

        return {
            totalDays,
            closureDate: maxDate.toISOString().split('T')[0]
        };
    }, [supplies]);


    // --- Handlers ---
    const handlePoChange = (e) => {
        const { name, value } = e.target;
        setPoDetails(prev => ({ ...prev, [name]: value }));
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
            status: 'Planned'
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

    // Helper: Load Image to Base64
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

    // Helper: Premium Header & Watermark
    // statsOverride: { totalQty, balance, excess, closureDate, totalDays }
    const generatePdfDocument = async (recipientName, statsOverride = null) => {
        const doc = new jsPDF();
        const logoFull = await loadImage('/leopack-logo-white.png');
        const logoIcon = await loadImage('/leopack-logo-icon.png');

        // --- Watermark (Big Icon, Transparent) ---
        if (logoIcon) {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const imgWidth = 100;
            const imgHeight = 100;
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            // Transparency
            doc.setGState(new doc.GState({ opacity: 0.1 }));
            doc.addImage(logoIcon, 'PNG', x, y, imgWidth, imgHeight);
            doc.setGState(new doc.GState({ opacity: 1.0 })); // Reset
        }

        // --- HEADER REDESIGN ---
        // 1. Blue Brand Box (Navy Blue)
        // Reduced Height: 30 -> 24
        doc.setFillColor(0, 0, 128);
        doc.rect(14, 15, 70, 24, 'F');

        // 2. Green Accent Strip
        // Reduced Height: 30 -> 24
        doc.setFillColor(0, 200, 83); // Bright Green
        doc.rect(84, 15, 2, 24, 'F');

        // Logo (Centered in Blue Box)
        if (logoFull) {
            // Fit within the blue box (70x24).
            // Centered: x = 14 + (70 - 50)/2, y = 15 + (24 - 12)/2
            const w = 50;
            const h = 12; // Approximation for wide logo
            const lx = 14 + (70 - w) / 2;
            const ly = 15 + (24 - h) / 2; // Recalculated vertical center
            doc.addImage(logoFull, 'PNG', lx, ly, w, h);
        } else {
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("LEOPACK", 49, 30, { align: "center" }); // Approx center y=30
        }

        // 3. Title "Supply Schedule" (Right side)
        doc.setTextColor(51, 65, 85); // Slate 700 / Dark Grey
        doc.setFontSize(24); // Size 24
        doc.setFont("helvetica", "bold");
        // Align Right (x=196 matches table border right edge)
        // Vertical Center: 15 + 12 - 2 (baseline) ~ 25 or 30? 
        // Box is at y=15, h=24. Middle is y=27. Text baseline ~ +1/3 fontsize(8) -> 35?
        // Let's guess y=31 for visually centered text in 24px height starting at 15
        doc.text("Supply Schedule", 196, 31, { align: 'right' });

        // --- Metadata Box ---
        // Moved down to accomodate taller header (y = 15 + 30 + gap) -> y=55
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
        // Use overridden stats if provided (Vendor Export), otherwise global (Customer Export)
        const pdfTotalQty = statsOverride ? statsOverride.totalQty : poDetails.totalQty;
        const pdfBalance = statsOverride ? statsOverride.balance : balance;
        const pdfExcess = statsOverride ? statsOverride.excess : excess;
        // Dates usually same, but could be specific if computed. Using global for date/duration simplicity unless override needed.
        // Vendor export might have subset dates, but usually overall closure date is relevant.
        // Let's stick to global dates OR passed dates. 
        // For simplicity, we use global dates unless passed. 
        // Note: handleVendorDownload currently doesn't compute specific closureDate, so we use global.

        doc.setFont("helvetica", "bold");
        doc.text("TOTAL QTY:", 140, boxY + 10);
        doc.setFont("helvetica", "normal");
        doc.text(Number(pdfTotalQty).toLocaleString(), 140, boxY + 15);

        doc.setFont("helvetica", "bold");
        doc.text("BALANCE:", 140, boxY + 25);

        if (pdfExcess > 0) {
            doc.setTextColor(220, 38, 38); // Red
            doc.text(`EXCESS: +${pdfExcess.toLocaleString()}`, 140, boxY + 30);
        } else {
            doc.setTextColor(220, 38, 38);
            doc.text(pdfBalance.toLocaleString(), 140, boxY + 30);
        }

        // --- Footer ---
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFillColor(0, 0, 128); // Navy Blue
        doc.rect(0, pageHeight - 15, 210, 15, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        // Added lots of space as requested
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
            // Place above the blue footer bar
            doc.text(`Page ${i} of ${pageCount}`, 196, pageHeight - 18, { align: 'right' });
        }
    };

    // 1. Customer Export
    const handleCustomerDownload = async () => {
        const doc = await generatePdfDocument(poDetails.customerName);

        const tableData = supplies.map(row => [
            row.week,
            row.date,
            "Leopack",
            Number(row.plannedQty).toLocaleString(),
            row.status
        ]);

        autoTable(doc, {
            // Increased startY due to moved metadata box (y=55 + 35 + gap=10) -> 100
            startY: 100,
            head: [['WEEK', 'SUPPLY DATE', 'SUPPLIER', 'PLANNED QTY', 'STATUS']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
            columnStyles: {
                3: { halign: 'left', fontStyle: 'bold' } // Planned Qty Left & Bold
            },
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        addPageNumbers(doc);

        const filename = `Supply_Schedule_${poDetails.customerName || 'Customer'}.pdf`;
        doc.save(filename);
    };

    // 2. Vendor Export
    const handleVendorDownload = async (vendorName) => {
        if (!vendorName) return;

        const vendorObj = vendors.find(v => v.name === vendorName);
        const vendorSupplies = supplies.filter(s => s.vendor === vendorName);

        // Compute Vendor Specific Stats
        const vendorPreAllocated = Number(vendorObj?.allocatedQty) || 0;
        const vendorPlanned = vendorSupplies.reduce((sum, item) => sum + (Number(item.plannedQty) || 0), 0);
        const vendorBalance = Math.max(0, vendorPreAllocated - vendorPlanned);
        const vendorExcess = Math.max(0, vendorPlanned - vendorPreAllocated);

        // Pass these stats to PDF Generator
        const doc = await generatePdfDocument(vendorName, {
            totalQty: vendorPreAllocated,
            balance: vendorBalance,
            excess: vendorExcess
        });

        const tableData = vendorSupplies.map(row => [
            row.week,
            row.date,
            Number(row.plannedQty).toLocaleString(),
            row.status
        ]);

        autoTable(doc, {
            startY: 100,
            head: [['WEEK', 'EXPECTED DATE', 'PLANNED QTY', 'STATUS']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
            columnStyles: {
                2: { halign: 'left', fontStyle: 'bold' } // Planned Qty Left & Bold (Index 2 now)
            },
            styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        addPageNumbers(doc);

        const filename = `Supply_Schedule_${vendorName}.pdf`;
        doc.save(filename);
        setShowVendorExportModal(false);
    };


    // --- Color Logic ---
    const getBalanceColor = () => {
        if (balance === 0) return 'text-green-600';
        if (balance < poDetails.totalQty * 0.2) return 'text-amber-600';
        return 'text-red-600';
    };

    const getStatusBadgeStyles = (status) => {
        switch (status) {
            case 'Received': return 'bg-green-100 text-green-700 border-green-200';
            case 'Partial': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'In Transit': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="supply-container fade-in">

            {/* --- 1. PO Summary Section --- */}
            <div className="po-summary-card">
                <div className="po-grid">
                    <div className="input-group">
                        <label>Customer Name</label>
                        <input
                            type="text"
                            name="customerName"
                            value={poDetails.customerName}
                            onChange={handlePoChange}
                            placeholder="Enter Customer..."
                            className="glass-input"
                        />
                    </div>
                    <div className="input-group">
                        <label>Customer Email</label>
                        <input
                            type="email"
                            name="customerEmail"
                            value={poDetails.customerEmail}
                            onChange={handlePoChange}
                            placeholder="client@company.com"
                            className="glass-input"
                        />
                    </div>
                    <div className="input-group">
                        <label>PO Number</label>
                        <input
                            type="text"
                            name="poNumber"
                            value={poDetails.poNumber}
                            onChange={handlePoChange}
                            placeholder="#PO-12345"
                            className="glass-input"
                        />
                    </div>
                    <div className="input-group">
                        <label>Total PO Qty</label>
                        <input
                            type="number"
                            name="totalQty"
                            value={poDetails.totalQty}
                            onChange={handlePoChange}
                            className="glass-input font-mono font-bold"
                        />
                    </div>
                </div>

                <div className="po-stats">
                    <div className="stat-box">
                        <span className="stat-label">Planned</span> {/* Renamed from Supplied */}
                        <span className="stat-value text-slate-700">{totalPlanned.toLocaleString()}</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-box">
                        <span className="stat-label">Balance after planning</span>
                        {excess > 0 ? (
                            <span className="stat-value text-red-600 flex items-center gap-2">
                                0 <span className="text-sm bg-red-100 px-2 py-0.5 rounded-full border border-red-200">Excess: +{excess.toLocaleString()} ⚠️</span>
                            </span>
                        ) : (
                            <span className={`stat-value ${getBalanceColor()}`}>{balance.toLocaleString()}</span>
                        )}
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-box">
                        <span className="stat-label">Closure Date</span>
                        <span className="stat-value text-slate-600 text-2xl">{dateStats.closureDate}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-container">
                    <div className="progress-labels">
                        <span>Progress</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* --- 2. Supply Planning Table --- */}
            <div className="table-card">
                <div className="table-header flex justify-between items-center">
                    <h3>Supply Plan</h3>

                    <div className="flex flex-row items-center gap-2">
                        <button onClick={() => setShowVendorModal(true)} className="btn-secondary btn-sm whitespace-nowrap" title="Manage Vendors">
                            <Settings size={14} /> Manage Vendors
                        </button>
                        <button onClick={addSupplyRow} className="btn-secondary btn-sm whitespace-nowrap">
                            <Plus size={16} /> Add Supply
                        </button>
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="supply-table">
                        <thead>
                            <tr>
                                <th width="15%">Week</th>
                                <th width="15%">Date</th>
                                <th width="25%">Vendor</th>
                                <th width="20%" className="text-right">Planned</th>
                                {/* Removed Received Column */}
                                <th width="20%">Status</th>
                                <th width="5%"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplies.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <input
                                            type="text"
                                            value={row.week}
                                            onChange={(e) => updateSupply(row.id, 'week', e.target.value)}
                                            className="table-input"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="date"
                                            value={row.date}
                                            onChange={(e) => updateSupply(row.id, 'date', e.target.value)}
                                            className="table-input"
                                        />
                                    </td>
                                    <td>
                                        <select
                                            value={row.vendor}
                                            onChange={(e) => updateSupply(row.id, 'vendor', e.target.value)}
                                            className="table-input"
                                        >
                                            <option value="" disabled>Select Vendor</option>
                                            {vendors.map(v => (
                                                <option key={v.name} value={v.name}>{v.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="text-right">
                                        <input
                                            type="number"
                                            value={row.plannedQty}
                                            onChange={(e) => updateSupply(row.id, 'plannedQty', e.target.value)}
                                            className="table-input text-right font-mono"
                                        />
                                    </td>
                                    {/* Removed Received Input */}
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeStyles(row.status)}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <button
                                            onClick={() => deleteSupplyRow(row.id)}
                                            className="icon-btn-danger"
                                            title="Remove"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- 3. Bottom Actions --- */}
            <div className="flex flex-row justify-between items-center mt-4 mb-8 w-full gap-4">
                <button
                    onClick={handleCustomerDownload}
                    className="btn-primary flex items-center gap-2 bg-slate-900 flex-shrink-0"
                >
                    <FileDown size={18} /> Download Customer Schedule
                </button>
                <button
                    onClick={() => setShowVendorExportModal(true)}
                    className="btn-secondary flex items-center gap-2 flex-shrink-0"
                >
                    <Download size={18} /> Download Vendor Schedule
                </button>
            </div>

            {/* --- Vendor Management Modal --- */}
            {showVendorModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Manage Vendors</h3>
                            <button
                                onClick={() => setShowVendorModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newVendorName}
                                    onChange={(e) => setNewVendorName(e.target.value)}
                                    placeholder="Vendor Name"
                                    className="glass-input flex-1"
                                />
                                <input
                                    type="number"
                                    value={newVendorAllocation}
                                    onChange={(e) => setNewVendorAllocation(e.target.value)}
                                    placeholder="Qty"
                                    className="glass-input w-24"
                                />
                                <button
                                    onClick={addVendor}
                                    className="bg-slate-800 text-white px-4 rounded-md font-medium hover:bg-slate-700 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {vendors.map(vendor => (
                                <div key={vendor.name} className="flex justify-between items-center bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-800">{vendor.name}</span>
                                        <span className="text-xs text-slate-500">Allocated: {Number(vendor.allocatedQty || 0).toLocaleString()}</span>
                                    </div>
                                    <button
                                        onClick={() => removeVendor(vendor.name)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Vendor Export Selection Modal --- */}
            {showVendorExportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Select Vendor</h3>
                            <button onClick={() => setShowVendorExportModal(false)} className="text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Choose a vendor to download their specific schedule.</p>
                        <div className="space-y-2">
                            {vendors.map(v => (
                                <button
                                    key={v.name}
                                    onClick={() => handleVendorDownload(v.name)}
                                    className="w-full text-left p-3 rounded-md border border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium transition-all"
                                >
                                    {v.name}
                                </button>
                            ))}
                            {vendors.length === 0 && <p className="text-center italic text-slate-400 py-4">No vendors found.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
