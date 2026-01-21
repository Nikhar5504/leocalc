import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function SupplySchedule() {
    // --- State ---
    const [poDetails, setPoDetails] = useState({
        customerName: '',
        poNumber: '',
        totalQty: 10000, // Default text from example
    });

    const [supplies, setSupplies] = useState([
        { id: 1, week: 'Week 1', vendor: 'Vendor A', plannedQty: 2500, receivedQty: 0, date: '2023-10-23', status: 'Received' },
        { id: 2, week: 'Week 2', vendor: 'Vendor B', plannedQty: 3000, receivedQty: 0, date: '2023-10-30', status: 'Planned' },
        { id: 3, week: 'Week 3', vendor: 'Vendor C', plannedQty: 2000, receivedQty: 0, date: '2023-11-06', status: 'Planned' },
    ]);

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

            // Auto-update status logic (simple heuristic)
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
            vendor: '',
            plannedQty: 0,
            receivedQty: 0,
            date: '',
            status: 'Planned'
        }]);
    };

    const deleteSupplyRow = (id) => {
        setSupplies(prev => prev.filter(s => s.id !== id));
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
                                        <input
                                            type="text"
                                            value={row.vendor}
                                            onChange={(e) => updateSupply(row.id, 'vendor', e.target.value)}
                                            placeholder="Vendor Name"
                                            className="table-input"
                                        />
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
                                            // Highlight if received > 0 for quick visibility
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
        </div>
    );
}
