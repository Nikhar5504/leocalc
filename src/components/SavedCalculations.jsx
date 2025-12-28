import React from 'react';
import { Trash2, FolderOpen } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SavedCalculations({ onLoad }) {
    const [savedItems, setSavedItems] = React.useState([]);

    React.useEffect(() => {
        fetchCalculations();
    }, []);

    const fetchCalculations = async () => {
        try {
            console.log("Fetching calculations...");
            const { data, error } = await supabase
                .from('calculations')
                .select('*')
                .order('date', { ascending: false });

            if (error) {
                console.error("Supabase Error fetching calculations:", error);
                throw error;
            }

            console.log("Fetched calculations data:", data);

            if (data) setSavedItems(data);
        } catch (error) {
            console.error('Catch Error fetching calculations:', error);
        }
    };

    const handleEmail = (item) => {
        const metrics = getDisplayMetrics(item);
        const rate = metrics.custPricePerKg.toFixed(2);
        // Clean up date for subject
        const dateStr = new Date(item.date).toLocaleDateString();

        const subject = `Pricing Quote for ${item.name} (${dateStr}) - Leopack`;
        const body = `Dear Customer,

Please find below the requested pricing quote for ${item.name}.

------------------------------------------
FINAL RATE:  ** ${rate} / kg **
------------------------------------------

This rate is inclusive of all standard terms.

Best Regards,
Sales Team
Leopack`;

        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this?")) return;
        try {
            const { error } = await supabase.from('calculations').delete().eq('id', id);
            if (error) throw error;
            setSavedItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            alert("Error deleting: " + error.message);
        }
    };

    if (savedItems.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FolderOpen size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                <h3 style={{ border: 'none', marginBottom: '0.5rem', color: '#64748b' }}>No Saved Calculations</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Calculations you save will appear here for quick access.
                </p>
            </div>
        );
    }

    // Helper to re-calculate display metrics from saved inputs
    const getDisplayMetrics = (item) => {
        const pp = item.pricing || {};
        const fr = item.freight || {};

        const bagWeight = parseFloat(pp.bagWeight) || 0;
        const ppRate = parseFloat(pp.ppRate) || 0;
        const conversionCost = parseFloat(pp.conversionCost) || 0;
        const transport = parseFloat(pp.transportPerBag) || 0;
        const margin = parseFloat(pp.profitMargin) || 0;

        const adjConv = conversionCost + transport;
        const matCost = ppRate * bagWeight;
        const convCost = adjConv * bagWeight;
        const effVendor = matCost + convCost;
        const bagPrice = effVendor * (1 + margin / 100);
        const custPricePerKg = bagWeight > 0 ? bagPrice / bagWeight : 0;

        const freightTotal = parseFloat(fr.freightCharge) || 0;

        return {
            bagPrice,
            custPricePerKg,
            freightTotal
        };
    };

    return (
        <div className="saved-list" style={{ display: 'grid', gap: '1rem' }}>
            {savedItems.map((item) => {
                const metrics = getDisplayMetrics(item);

                return (
                    <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Company</div>
                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', color: '#1e293b', fontWeight: 700 }}>{item.name}</h4>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                    <span>•</span>
                                    {new Date(item.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="icon-btn" onClick={() => handleEmail(item)} title="Email Quote" style={{ color: '#000080', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px 8px' }}>
                                    ✉️
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Customer Facing Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>

                            {/* Left: Material/Pricing */}
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pricing Quote</div>
                                <div style={{ marginBottom: '0.25rem' }}>
                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Bag Price: </span>
                                    <span style={{ fontWeight: 600, color: '#059669' }}>₹{metrics.bagPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Price / kg: </span>
                                    <span style={{ fontWeight: 600 }}>₹{metrics.custPricePerKg.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {/* Right: Freight */}
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Freight Details</div>
                                <div style={{ marginBottom: '0.25rem' }}>
                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Charge: </span>
                                    <span style={{ fontWeight: 600 }}>₹{metrics.freightTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                    Load to check Pieces & Bales
                                </div>
                            </div>
                        </div>

                        <button className="primary" onClick={() => onLoad(item)} style={{ width: '100%', padding: '0.6rem' }}>
                            <FolderOpen size={16} /> Load Logic & Full Details
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
