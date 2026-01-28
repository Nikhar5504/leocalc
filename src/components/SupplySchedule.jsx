import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SupplySchedule({
    poDetails, setPoDetails,
    vendors, setVendors,
    supplies, setSupplies
}) {

    // Modal State
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showVendorExportModal, setShowVendorExportModal] = useState(false);

    // Vendor Form State
    const [newVendorName, setNewVendorName] = useState('');
    const [newVendorEmail, setNewVendorEmail] = useState('');
    const [newVendorAllocation, setNewVendorAllocation] = useState('');


    // --- Derived State (Calculations) ---
    const totalPlanned = useMemo(() => {
        return supplies.reduce((sum, item) => sum + (Number(item.plannedQty) || 0), 0);
    }, [supplies]);

    const excess = Math.max(0, totalPlanned - poDetails.totalQty);
    const balance = Math.max(0, poDetails.totalQty - totalPlanned);

    const vendorColors = ['bg-emerald-500', 'bg-purple-500', 'bg-blue-500', 'bg-amber-500', 'bg-pink-500'];
    const vendorTextColors = ['text-emerald-600', 'text-purple-600', 'text-blue-600', 'text-amber-600', 'text-pink-600'];

    const getWeekLabel = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const dayOfMonth = date.getDate();
        const weekNum = Math.ceil(dayOfMonth / 7);
        const ordinal = weekNum === 1 ? '1st' : weekNum === 2 ? '2nd' : weekNum === 3 ? '3rd' : '4th';
        const monthName = date.toLocaleString('default', { month: 'long' });
        return `${ordinal} week of ${monthName}`;
    };

    const dateStats = useMemo(() => {
        const dates = supplies.map(s => new Date(s.date)).filter(d => !isNaN(d));
        if (dates.length === 0) return { totalDays: 0, closureDate: '-' };
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const diffTime = Math.abs(maxDate - minDate);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return { totalDays, closureDate: maxDate.toISOString().split('T')[0] };
    }, [supplies]);

    const handlePoChange = (field, value) => {
        setPoDetails(prev => ({ ...prev, [field]: value }));
    };

    const updateSupply = (id, field, value) => {
        setSupplies(prev => {
            const updatedList = prev.map(item => {
                if (item.id !== id) return item;
                const updatedItem = { ...item, [field]: value };
                if (field === 'date') updatedItem.week = getWeekLabel(value);
                return updatedItem;
            });
            return updatedList.sort((a, b) => new Date(a.date || '9999-12-31') - new Date(b.date || '9999-12-31'));
        });
    };

    const addSupplyRow = () => {
        const newId = Math.max(...supplies.map(s => s.id), 0) + 1;
        const lastSupply = supplies[supplies.length - 1];
        let nextDate = new Date();
        if (lastSupply && lastSupply.date) {
            nextDate = new Date(lastSupply.date);
            nextDate.setDate(nextDate.getDate() + 7);
        }
        const dateStr = nextDate.toISOString().split('T')[0];
        setSupplies([...supplies, {
            id: newId, week: getWeekLabel(dateStr), vendor: vendors[0]?.name || '',
            plannedQty: 0, date: dateStr, status: 'Draft', notes: ''
        }]);
    };

    const deleteSupplyRow = (id) => {
        setSupplies(prev => prev.filter(s => s.id !== id));
    };

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

    const loadImage = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (e) { return null; }
    };

    const generatePdfDocument = async (recipientName, statsOverride = null) => {
        const doc = new jsPDF();
        const logoUrl = window.location.origin + '/leopack_logo.png';
        const logoImage = await loadImage(logoUrl);

        doc.setFillColor(0, 0, 128);
        doc.rect(14, 15, 70, 24, 'F');
        doc.setFillColor(0, 200, 83);
        doc.rect(84, 15, 2, 24, 'F');

        if (logoImage) {
            const imgProps = doc.getImageProperties(logoImage);
            const imgWidth = 50;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            doc.addImage(logoImage, 'PNG', 14 + (70 - imgWidth) / 2, 15 + (24 - imgHeight) / 2, imgWidth, imgHeight);
        } else {
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("LEOPACK", 49, 30, { align: "center" });
        }

        doc.setTextColor(51, 65, 85);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Supply Schedule", 196, 31, { align: 'right' });

        doc.setFillColor(248, 250, 252);
        const boxY = 55;
        doc.roundedRect(14, boxY, 182, 35, 3, 3, 'FD');

        doc.setFontSize(9);
        const recipientLabel = statsOverride ? "VENDOR:" : "CUSTOMER:";
        doc.setFont("helvetica", "bold"); doc.text(recipientLabel, 20, boxY + 10);
        doc.setFont("helvetica", "normal"); doc.text(recipientName || "N/A", 20, boxY + 15);
        doc.setFont("helvetica", "bold"); doc.text("PO REFERENCE:", 20, boxY + 25);
        doc.setFont("helvetica", "normal"); doc.text(poDetails.poNumber || "N/A", 20, boxY + 30);
        doc.setFont("helvetica", "bold"); doc.text("EST. CLOSURE:", 80, boxY + 10);
        doc.setFont("helvetica", "normal"); doc.text(dateStats.closureDate, 80, boxY + 15);
        doc.setFont("helvetica", "bold"); doc.text("DURATION:", 80, boxY + 25);
        doc.setFont("helvetica", "normal"); doc.text(`${dateStats.totalDays} Days`, 80, boxY + 30);

        const pTotal = statsOverride ? statsOverride.totalQty : poDetails.totalQty;
        const pBal = statsOverride ? statsOverride.balance : balance;
        const pExc = statsOverride ? statsOverride.excess : excess;

        doc.setFont("helvetica", "bold"); doc.text("TOTAL QTY:", 140, boxY + 10);
        doc.setFont("helvetica", "normal"); doc.text(Number(pTotal).toLocaleString(), 140, boxY + 15);
        doc.setFont("helvetica", "bold"); doc.text("BALANCE:", 140, boxY + 25);
        if (pExc > 0) {
            doc.setTextColor(220, 38, 38); doc.text(`EXCESS: +${pExc.toLocaleString()}`, 140, boxY + 30);
        } else {
            doc.text(pBal.toLocaleString(), 140, boxY + 30);
        }

        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFillColor(0, 0, 128); doc.rect(0, pageHeight - 15, 210, 15, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(9);
        doc.text("sales@leopack.in  |  Plot No.: 3002/F/1/S/113, GIDC Ankleshwar  |  +91 81285 99591", 105, pageHeight - 6, { align: 'center' });
        return doc;
    };

    const addPageNumbers = (doc) => {
        const pageCount = doc.internal.getNumberOfPages();
        const height = doc.internal.pageSize.getHeight();
        doc.setFontSize(8); doc.setTextColor(150);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i); doc.text(`Page ${i} of ${pageCount}`, 196, height - 18, { align: 'right' });
        }
    };

    const handleCustomerDownload = async () => {
        const doc = await generatePdfDocument(poDetails.customerName);
        const data = supplies.map(r => [r.week, r.date, "Leopack", Number(r.plannedQty).toLocaleString(), r.status]);
        autoTable(doc, {
            startY: 100, head: [['WEEK', 'DATE', 'SUPPLIER', 'QTY', 'STATUS']], body: data,
            theme: 'striped', headStyles: { fillColor: [0, 0, 128], halign: 'center', cellPadding: 5 },
            columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center', fontStyle: 'bold' }, 4: { halign: 'center' } },
            styles: { fontSize: 10, cellPadding: 4, lineWidth: 0 }, alternateRowStyles: { fillColor: [248, 250, 252] }, margin: { horizontal: 14 }
        });
        addPageNumbers(doc);
        const fileName = "Supply_Schedule_" + (poDetails.customerName || "Customer") + ".pdf";
        doc.save(fileName);
    };

    const handleVendorDownload = async (vendorName) => {
        const v = vendors.find(v => v.name === vendorName);
        const vSupp = supplies.filter(s => s.vendor === vendorName);
        const pQty = Number(v?.allocatedQty) || 0;
        const pPlan = vSupp.reduce((s, i) => s + (Number(i.plannedQty) || 0), 0);
        const doc = await generatePdfDocument(vendorName, { totalQty: pQty, balance: Math.max(0, pQty - pPlan), excess: Math.max(0, pPlan - pQty) });
        const data = vSupp.map(r => [r.week, r.date, Number(r.plannedQty).toLocaleString(), r.status]);
        autoTable(doc, {
            startY: 100, head: [['WEEK', 'DATE', 'QTY', 'STATUS']], body: data,
            theme: 'striped', headStyles: { fillColor: [0, 0, 128], halign: 'center', cellPadding: 5 },
            columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'center', fontStyle: 'bold' }, 3: { halign: 'center' } },
            styles: { fontSize: 10, cellPadding: 4, lineWidth: 0 }, alternateRowStyles: { fillColor: [248, 250, 252] }, margin: { horizontal: 14 }
        });
        addPageNumbers(doc);
        doc.save("Supply_Schedule_" + vendorName + ".pdf");
        setShowVendorExportModal(false);
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-tight">Supply Schedule</h1>
                    <p className="text-slate-500 text-base font-normal">Production timeline, vendor allocations & delivery tracking</p>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap justify-between items-end gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Customer:</span>
                                <input type="text" value={poDetails.customerName} onChange={(e) => handlePoChange('customerName', e.target.value)} className="bg-transparent border-b border-slate-300 focus:border-primary text-text-main font-bold outline-none w-40 text-sm" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">PO #:</span>
                                <input type="text" value={poDetails.poNumber} onChange={(e) => handlePoChange('poNumber', e.target.value)} className="bg-transparent border-b border-slate-300 focus:border-primary text-text-main font-bold outline-none w-32 text-sm" />
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">Active</span>
                        </div>
                    </div>
                    <button onClick={() => setShowVendorModal(true)} className="h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">settings</span> Manage Vendors
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 bg-slate-50 relative overflow-hidden group shadow-sm">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total PO Quantity</p>
                        <input type="number" value={poDetails.totalQty} onChange={(e) => handlePoChange('totalQty', Number(e.target.value))} className="text-text-main text-2xl font-black bg-transparent border-none outline-none w-full" />
                        <div className="w-full bg-slate-200 rounded-full h-1 mt-1"><div className="bg-primary h-1 rounded-full" style={{ width: '100%' }}></div></div>
                    </div>
                    {vendors.map((v, i) => (
                        <div key={v.name} className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 bg-slate-50 relative overflow-hidden shadow-sm">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex justify-between">{v.name} <span>{Math.round(poDetails.totalQty > 0 ? (v.allocatedQty / poDetails.totalQty) * 100 : 0)}%</span></p>
                            <p className="text-text-main text-2xl font-black">{Number(v.allocatedQty).toLocaleString()}</p>
                            <div className="w-full bg-slate-200 rounded-full h-1 mt-1"><div className={`${vendorColors[i % 5]} h-1 rounded-full`} style={{ width: `${Math.min(100, poDetails.totalQty > 0 ? (v.allocatedQty / poDetails.totalQty) * 100 : 0)}%` }}></div></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex-1 min-h-[400px]">
                <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{supplies.length} Scheduled Entries</span>
                    <button onClick={addSupplyRow} className="h-9 px-4 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add</span> Add Row
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Qty</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">Status</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {supplies.map(row => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-3">
                                        <select value={row.vendor} onChange={e => updateSupply(row.id, 'vendor', e.target.value)} className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0">
                                            {vendors.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-3">
                                        <input type="date" value={row.date} onChange={e => updateSupply(row.id, 'date', e.target.value)} className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0" />
                                    </td>
                                    <td className="px-6 py-3">
                                        <input type="number" value={row.plannedQty} onChange={e => updateSupply(row.id, 'plannedQty', e.target.value)} className="w-full text-right bg-transparent border-none text-sm font-black text-slate-800 focus:ring-0" />
                                    </td>
                                    <td className="px-6 py-3">
                                        <select value={row.status} onChange={e => updateSupply(row.id, 'status', e.target.value)} className="bg-transparent text-[10px] font-black uppercase border-none focus:ring-0 cursor-pointer" style={{ color: row.status === 'Confirmed' ? '#16a34a' : row.status === 'Pending' ? '#d97706' : '#64748b' }}>
                                            <option value="Planned">Planned</option><option value="Confirmed">Confirmed</option><option value="In Transit">In Transit</option><option value="Received">Received</option><option value="Draft">Draft</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-3">
                                        <input type="text" value={row.notes || ''} placeholder="Notes..." onChange={e => updateSupply(row.id, 'notes', e.target.value)} className="w-full bg-transparent border-none text-xs font-medium text-slate-500 focus:ring-0" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => deleteSupplyRow(row.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Balance Tracker Footer - Light Mode */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 text-slate-900 z-40 transform translate-y-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1 w-full flex flex-col gap-1">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-primary text-[14px]">analytics</span> Balance Tracker</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Planned: {totalPlanned.toLocaleString()} / PO: {poDetails.totalQty.toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div className={`h-full ${excess > 0 ? 'bg-red-500' : 'bg-primary'} transition-all`} style={{ width: `${Math.min(100, (totalPlanned / poDetails.totalQty) * 100)}%` }}></div>
                        </div>
                        <span className={`text-[10px] font-bold mt-1 font-mono ${excess > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{excess > 0 ? `EXCESS: +${excess.toLocaleString()}` : `REMAINING: ${balance.toLocaleString()}`}</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowVendorExportModal(true)} className="h-10 px-6 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">file_download</span> Vendor PDF
                        </button>
                        <button onClick={handleCustomerDownload} className="h-10 px-6 rounded-lg bg-primary hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Customer PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showVendorModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-900">Manage Vendors</h3>
                            <button onClick={() => setShowVendorModal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="flex flex-col gap-3 mb-6">
                            <input type="text" value={newVendorName} onChange={e => setNewVendorName(e.target.value)} placeholder="Vendor Name" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold" />
                            <div className="flex gap-2">
                                <input type="number" value={newVendorAllocation} onChange={e => setNewVendorAllocation(e.target.value)} placeholder="Allocation Qty" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 text-sm font-bold" />
                                <button onClick={addVendor} className="bg-primary text-white px-6 rounded-lg font-black text-xs uppercase tracking-widest">Add</button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {vendors.map(v => (
                                <div key={v.name} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <div><p className="font-bold text-slate-900 text-sm">{v.name}</p><p className="text-[10px] text-slate-500 font-bold uppercase">{Number(v.allocatedQty).toLocaleString()} Allocated</p></div>
                                    <button onClick={() => removeVendor(v.name)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showVendorExportModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-900">Export Vendor Schedule</h3>
                            <button onClick={() => setShowVendorExportModal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {vendors.map(v => (
                                <button key={v.name} onClick={() => handleVendorDownload(v.name)} className="p-4 text-left hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-700 flex justify-between items-center group font-bold text-sm transition-all">
                                    {v.name} <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">downloading</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
