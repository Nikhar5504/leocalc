import React, { useState, useMemo } from 'react';
import { Plus, Trash2, FileDown, Settings, X, Download, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SupplySchedule() {
    // --- State ---
    const [poDetails, setPoDetails] = useState({
        customerName: '',
        customerEmail: '',
        poNumber: '',
        totalQty: 10000,
    });

    // Vendor State now stores objects: { name, email }
    const [vendors, setVendors] = useState([
        { name: 'Vendor A', email: '' },
        { name: 'Vendor B', email: '' },
        { name: 'Vendor C', email: '' }
    ]);
    const [showVendorModal, setShowVendorModal] = useState(false);

    // Vendor Form State
    const [newVendorName, setNewVendorName] = useState('');
    const [newVendorEmail, setNewVendorEmail] = useState('');

    const [supplies, setSupplies] = useState([
        { id: 1, week: 'Week 1', vendor: 'Vendor A', plannedQty: 2500, receivedQty: 0, date: '2023-10-23', status: 'Received' },
        { id: 2, week: 'Week 2', vendor: 'Vendor B', plannedQty: 3000, receivedQty: 0, date: '2023-10-30', status: 'Planned' },
        { id: 3, week: 'Week 3', vendor: 'Vendor C', plannedQty: 2000, receivedQty: 0, date: '2023-11-06', status: 'Planned' },
    ]);

    const [selectedVendorForExport, setSelectedVendorForExport] = useState(''); // Stores vendor NAME

    // --- Derived State (Calculations) ---
    const totalSupplied = useMemo(() => {
        return supplies.reduce((sum, item) => sum + (Number(item.receivedQty) || 0), 0);
    }, [supplies]);

    const balance = Math.max(0, poDetails.totalQty - totalSupplied);
    const progressPercent = Math.min(100, (totalSupplied / poDetails.totalQty) * 100) || 0;

    // --- Handlers ---
    const handlePoChange = (e) => {
        const { name, value } = e.target;
        setPoDetails(prev => ({ ...prev, [name]: value }));
    };

    const updateSupply = (id, field, value) => {
        setSupplies(prev => prev.map(item => {
            if (item.id !== id) return item;

            const updated = { ...item, [field]: value };
            if (field === 'receivedQty') {
                if (Number(value) > 0 && Number(value) >= item.plannedQty) updated.status = 'Received';
                else if (Number(value) > 0) updated.status = 'Partial';
                else updated.status = 'Planned';
            }
            return updated;
        }));
    };

    const addSupplyRow = () => {
        const newId = Math.max(...supplies.map(s => s.id), 0) + 1;
        setSupplies([...supplies, {
            id: newId,
            week: `Week ${supplies.length + 1}`,
            vendor: vendors[0]?.name || '',
            plannedQty: 0,
            receivedQty: 0,
            date: '',
            status: 'Planned'
        }]);
    };

    const deleteSupplyRow = (id) => {
        setSupplies(prev => prev.filter(s => s.id !== id));
    };

    // --- Vendor Management ---
    const addVendor = () => {
        if (newVendorName.trim() && !vendors.find(v => v.name === newVendorName.trim())) {
            setVendors([...vendors, { name: newVendorName.trim(), email: newVendorEmail.trim() }]);
            setNewVendorName('');
            setNewVendorEmail('');
        }
    };

    const removeVendor = (vendorName) => {
        setVendors(vendors.filter(v => v.name !== vendorName));
    };

    // --- PDF & Email Logic ---

    // Helper: Header Design
    const drawHeader = (doc, title, subtitle) => {
        // Brand Color Strip
        doc.setFillColor(37, 99, 235); // Blue
        doc.rect(0, 0, 210, 40, 'F');

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("LEOPACK", 14, 20);

        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text(title, 200, 20, { align: 'right' });

        if (subtitle) {
            doc.setFontSize(10);
            doc.setTextColor(226, 232, 240);
            doc.text(subtitle, 200, 28, { align: 'right' });
        }
    };

    // 1. Customer Export
    const handleCustomerAction = () => {
        const doc = new jsPDF();

        drawHeader(doc, "SUPPLY SCHEDULE", poDetails.customerName);

        // Info Block
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(10);
        doc.text(`Customer: ${poDetails.customerName}`, 14, 50);
        if (poDetails.customerEmail) doc.text(`Email: ${poDetails.customerEmail}`, 14, 55);
        doc.text(`PO Number: ${poDetails.poNumber}`, 14, 60);

        // Summary Block
        doc.text(`Total Qty: ${poDetails.totalQty.toLocaleString()}`, 140, 50);
        doc.text(`Supplied: ${totalSupplied.toLocaleString()}`, 140, 55);
        doc.setFont("helvetica", "bold");
        doc.text(`Balance: ${balance.toLocaleString()}`, 140, 60);

        // Table
        const tableData = supplies.map(row => [
            row.week,
            row.date,
            "Leopack", // Static
            Number(row.plannedQty).toLocaleString(),
            row.status
        ]);

        autoTable(doc, {
            startY: 70,
            head: [['Week', 'Date', 'Supplier', 'Planned Qty', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        // Save PDF
        const filename = `Supply_Schedule_${poDetails.customerName || 'Customer'}.pdf`;
        doc.save(filename);

        // Open Email Draft
        if (poDetails.customerEmail) {
            const subject = encodeURIComponent(`Supply Schedule Update: PO ${poDetails.poNumber}`);
            const body = encodeURIComponent(
                `Dear ${poDetails.customerName},

Please find attached the latest supply schedule for PO ${poDetails.poNumber}.

Summary:
- Total PO Quantity: ${poDetails.totalQty.toLocaleString()}
- Total Supplied: ${totalSupplied.toLocaleString()}
- Pending Balance: ${balance.toLocaleString()}

(Please drag and drop the downloaded "${filename}" into this email)

Best regards,
Leopack Team`
            );
            window.location.href = `mailto:${poDetails.customerEmail}?subject=${subject}&body=${body}`;
        }
    };

    // 2. Vendor Export
    const handleVendorAction = () => {
        if (!selectedVendorForExport) return;

        const vendorData = vendors.find(v => v.name === selectedVendorForExport);
        const vendorSupplies = supplies.filter(s => s.vendor === selectedVendorForExport);

        const doc = new jsPDF();

        drawHeader(doc, "PURCHASE ORDER", selectedVendorForExport);

        // Info
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(10);
        doc.text(`To: ${selectedVendorForExport}`, 14, 50);
        if (vendorData?.email) doc.text(`Email: ${vendorData.email}`, 14, 55);
        doc.text(`Ref PO: ${poDetails.poNumber}`, 14, 60);

        // Table
        const tableData = vendorSupplies.map(row => [
            row.week,
            row.date,
            "Jumbo Bags", // Generic Item
            Number(row.plannedQty).toLocaleString(),
        ]);

        autoTable(doc, {
            startY: 70,
            head: [['Week', 'Expected Date', 'Item Description', 'Quantity']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105] }, // Slate
        });

        // Save PDF
        const filename = `PO_Schedule_${selectedVendorForExport}.pdf`;
        doc.save(filename);

        // Open Email
        if (vendorData?.email) {
            const subject = encodeURIComponent(`New Supply Plan: ${selectedVendorForExport}`);
            const body = encodeURIComponent(
                `Dear Team at ${selectedVendorForExport},

Please see the attached supply schedule for our upcoming orders against PO ${poDetails.poNumber}.

Please confirm receipt and delivery dates.

(Note: Attach "${filename}" manually)

Best,
Leopack Procurement`
            );
            window.location.href = `mailto:${vendorData.email}?subject=${subject}&body=${body}`;
        }
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

            {/* Top Actions */}
            <div className="action-bar mobile-flex-col">
                <button
                    onClick={() => setShowVendorModal(true)}
                    className="btn-secondary"
                >
                    <Settings size={16} /> Manage Vendors
                </button>

                <div className="flex gap-4 items-center mobile-flex-col w-full-mobile">
                    {/* Customer Export */}
                    <button
                        onClick={handleCustomerAction}
                        className="btn-primary flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full-mobile justify-center"
                        title="Download PDF & Draft Email"
                    >
                        <Mail size={18} /> Export & Email Customer
                    </button>

                    <div className="h-6 w-px bg-slate-300 hidden-mobile"></div>

                    {/* Vendor Export */}
                    <div className="flex gap-2 items-center w-full-mobile">
                        <select
                            value={selectedVendorForExport}
                            onChange={(e) => setSelectedVendorForExport(e.target.value)}
                            className="glass-input py-2 text-sm w-full-mobile"
                        >
                            <option value="">Select Vendor...</option>
                            {vendors.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                        </select>
                        <button
                            onClick={handleVendorAction}
                            disabled={!selectedVendorForExport}
                            className="btn-secondary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed w-full-mobile justify-center"
                            title="Download PDF & Draft Email"
                        >
                            <Mail size={18} /> Email Vendor
                        </button>
                    </div>
                </div>
            </div>

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
                    {/* NEW: Customer Email */}
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
                        <span className="stat-label">Supplied</span>
                        <span className="stat-value text-slate-700">{totalSupplied.toLocaleString()}</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-box">
                        <span className="stat-label">Balance</span>
                        <span className={`stat-value ${getBalanceColor()}`}>{balance.toLocaleString()}</span>
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
                <div className="table-header">
                    <h3>Supply Plan</h3>
                    <button onClick={addSupplyRow} className="btn-secondary btn-sm">
                        <Plus size={16} /> Add Supply
                    </button>
                </div>

                <div className="table-wrapper">
                    <table className="supply-table">
                        <thead>
                            <tr>
                                <th width="12%">Week</th>
                                <th width="12%">Date</th>
                                <th width="20%">Vendor</th>
                                <th width="15%" className="text-right">Planned</th>
                                <th width="15%" className="text-right">Received</th>
                                <th width="15%">Status</th>
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
                                        {/* VENDOR DROPDOWN */}
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
                                    <td className="text-right">
                                        <input
                                            type="number"
                                            value={row.receivedQty}
                                            onChange={(e) => updateSupply(row.id, 'receivedQty', e.target.value)}
                                            className="table-input text-right font-mono"
                                            style={{ color: row.receivedQty > 0 ? '#10b981' : 'inherit', fontWeight: row.receivedQty > 0 ? '600' : 'normal' }}
                                        />
                                    </td>
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
                    {supplies.length === 0 && (
                        <div className="empty-state">
                            <p>No supplies planned yet.</p>
                            <button onClick={addSupplyRow} className="btn-text">Add your first supply</button>
                        </div>
                    )}
                </div>
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

                        {/* ADD VENDOR FORM */}
                        <div className="flex flex-col gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <h4 className="text-sm font-semibold text-slate-500 uppercase">Add New Vendor</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newVendorName}
                                    onChange={(e) => setNewVendorName(e.target.value)}
                                    placeholder="Vendor Name"
                                    className="glass-input flex-1"
                                />
                                <input
                                    type="email"
                                    value={newVendorEmail}
                                    onChange={(e) => setNewVendorEmail(e.target.value)}
                                    placeholder="Email (optional)"
                                    className="glass-input flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && addVendor()}
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
                                        {vendor.email && <span className="text-xs text-slate-500">{vendor.email}</span>}
                                    </div>
                                    <button
                                        onClick={() => removeVendor(vendor.name)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {vendors.length === 0 && (
                                <p className="text-center text-slate-400 italic text-sm">No vendors added.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
