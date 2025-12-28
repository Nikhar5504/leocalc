import { Truck } from 'lucide-react';
import BaleVisualizer from './BaleVisualizer';

export default function FreightCalculator({ inputs, onChange }) {
    const { unit, vehicleL, vehicleW, vehicleH, baleL, baleW, baleH, baleSize, freightCharge, efficiency } = inputs;

    const toCm = (val) => {
        const v = parseFloat(val) || 0;
        if (unit === 'm') return v * 100;
        if (unit === 'ft') return v * 30.48;
        return v; // cm
    };

    const vL_cm = toCm(vehicleL);
    const vW_cm = toCm(vehicleW);
    const vH_cm = toCm(vehicleH);
    const bL_cm = toCm(baleL);
    const bW_cm = toCm(baleW);
    const bH_cm = toCm(baleH);

    const balesInLength = bL_cm > 0 ? Math.floor(vL_cm / bL_cm) : 0;
    const balesInWidth = bW_cm > 0 ? Math.floor(vW_cm / bW_cm) : 0;
    const balesInHeight = bH_cm > 0 ? Math.floor(vH_cm / bH_cm) : 0;
    const totalBales = balesInLength * balesInWidth * balesInHeight;

    // Ensure efficiency is treated as a number
    const effPercent = efficiency === '' ? 0 : parseFloat(efficiency);
    // Default to 100 if invalid? No, likely 0 or just whatever user typed. User complained "efficiency not working". 
    // If it was text, calculation would be NaN.
    const effMultiplier = !isNaN(effPercent) ? effPercent / 100 : 0;

    const effectiveBales = Math.floor(totalBales * effMultiplier);
    // Note: Usually we floor bales because you can't have 0.5 bale usually? 
    // Or do we keep decimals? User prompt said "Effective Bales = Total Bales x (Packing Efficiency / 100)".
    // I will keep decimals if they result in fractional, or maybe floor?
    // Let's float it to 2 decimals for display, but keep precision for pieces?
    // Actually, usually you pack whole bales. I'll floor it for pieces check logic unless user wants partial.
    // Prompt said "Total Pieces = Effective Bales x Bale Size". 
    // Let's use exact float for math but display clean.

    const bSize = parseFloat(baleSize) || 0;
    const formatCurrency = (val) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

    // Determine the count to use: Custom Override or Calculated
    const finalBaleCount = inputs.customCount && inputs.customCount !== '' ? parseFloat(inputs.customCount) : effectiveBales;

    // Derived total pieces based on final count. Ensure no NaN.
    const totalPieces = !isNaN(finalBaleCount) && !isNaN(bSize) ? finalBaleCount * bSize : 0;

    // Safety check for freight charge
    const fCharge = parseFloat(freightCharge) || 0;
    const freightPerPiece = totalPieces > 0 ? fCharge / totalPieces : 0;

    const renderInput = (label, name, suffix) => (
        <div className="form-group">
            <label style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>{label.toUpperCase()}</label>
            <div className="input-wrapper">
                <input type="number" name={name} value={inputs[name]} onChange={onChange} className="inputField" />
                {suffix && <span className="unit-suffix" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{suffix}</span>}
            </div>
        </div>
    );

    return (
        <div className="freight-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '2rem', alignItems: 'start' }}>
            {/* Left: Inputs Section */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Truck size={18} /> Freight Inputs
                    </h3>
                    <select name="unit" value={unit} onChange={onChange} style={{ width: 'auto', padding: '0.4rem', fontSize: '0.85rem', borderColor: '#cbd5e1', borderRadius: '4px' }}>
                        <option value="m">Meters (m)</option>
                        <option value="ft">Feet (ft)</option>
                        <option value="cm">Centimeters (cm)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Vehicle Section */}
                    <div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
                            Vehicle Dimensions
                        </h4>
                        <div className="form-grid">
                            {renderInput("Length", "vehicleL", unit)}
                            {renderInput("Width", "vehicleW", unit)}
                            {renderInput("Height", "vehicleH", unit)}
                        </div>
                    </div>

                    {/* Bale Section */}
                    <div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
                            Bale Dimensions
                        </h4>
                        <div className="form-grid">
                            {renderInput("Length", "baleL", unit)}
                            {renderInput("Width", "baleW", unit)}
                            {renderInput("Height", "baleH", unit)}
                            {renderInput("Pcs / Bale", "baleSize", "pcs")}
                        </div>
                    </div>

                    {/* Optimization Section */}
                    <div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
                            Settings
                        </h4>
                        <div className="form-grid">
                            {renderInput("Efficiency", "efficiency", "%")}
                            {renderInput("Freight Cost", "freightCharge", "INR")}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Bales (Physical)</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{totalBales}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Effective Bales (Editable)</div>
                        <div className="input-wrapper" style={{ maxWidth: '120px' }}>
                            <input
                                type="number"
                                name="customCount"
                                value={inputs.customCount ?? ''}
                                onChange={onChange}
                                placeholder={effectiveBales.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                className="inputField"
                                style={{ fontWeight: 700, padding: '4px 8px', borderColor: inputs.customCount ? '#fbbf24' : '#e2e8f0' }}
                            />
                        </div>
                        {inputs.customCount && <div style={{ fontSize: '0.7rem', color: '#fbbf24' }}>* Overridden</div>}
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Freight Per Piece</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4f46e5' }}>{formatCurrency(freightPerPiece)}</div>
                    </div>
                </div>
            </div>

            {/* Right: Visualizer */}
            <div className="card" style={{ overflow: 'hidden', height: '100%' }}>
                <h3 style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>3D Visualization</h3>
                <div style={{ height: '500px', width: '100%', background: '#f1f5f9', borderRadius: '4px' }}>
                    <BaleVisualizer
                        vehicleDims={{ l: vL_cm, w: vW_cm, h: vH_cm }}
                        baleDims={{ l: bL_cm, w: bW_cm, h: bH_cm }}
                        effectiveCount={finalBaleCount}
                        displayData={{
                            unit,
                            vL: inputs.vehicleL, vW: inputs.vehicleW, vH: inputs.vehicleH,
                            bL: inputs.baleL, bW: inputs.baleW, bH: inputs.baleH
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
