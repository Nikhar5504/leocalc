import { Truck, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import BaleVisualizer from './BaleVisualizer';

export default function FreightCalculator({ inputs, onChange, bagWeight }) {
    const { unit, vehicleL, vehicleW, vehicleH, baleL, baleW, baleH, freightCharge, efficiency, palletCapacity } = inputs;

    // Track local unit selection for each dimension
    const [localUnits, setLocalUnits] = useState({
        vehicleL: unit,
        vehicleW: unit,
        vehicleH: unit,
        baleL: unit,
        baleW: unit,
        baleH: unit
    });

    // Update local units when master unit changes (sync by default)
    useEffect(() => {
        setLocalUnits({
            vehicleL: unit,
            vehicleW: unit,
            vehicleH: unit,
            baleL: unit,
            baleW: unit,
            baleH: unit
        });
    }, [unit]);

    const handleLocalUnitChange = (name, newUnit) => {
        setLocalUnits(prev => ({ ...prev, [name]: newUnit }));
    };

    const convertToCm = (val, fromUnit) => {
        const v = parseFloat(val) || 0;
        if (fromUnit === 'm') return v * 100;
        if (fromUnit === 'ft') return v * 30.48;
        if (fromUnit === 'in') return v * 2.54;
        return v; // cm
    };

    const vL_cm = convertToCm(vehicleL, localUnits.vehicleL);
    const vW_cm = convertToCm(vehicleW, localUnits.vehicleW);
    const vH_cm = convertToCm(vehicleH, localUnits.vehicleH);
    const bL_cm = convertToCm(baleL, localUnits.baleL);
    const bW_cm = convertToCm(baleW, localUnits.baleW);
    const bH_cm = convertToCm(baleH, localUnits.baleH);

    const balesInLength = bL_cm > 0 ? Math.floor(vL_cm / bL_cm) : 0;
    const balesInWidth = bW_cm > 0 ? Math.floor(vW_cm / bW_cm) : 0;
    const balesInHeight = bH_cm > 0 ? Math.floor(vH_cm / bH_cm) : 0;
    const totalBales = balesInLength * balesInWidth * balesInHeight;

    const effPercent = efficiency === '' ? 0 : parseFloat(efficiency);
    const effMultiplier = !isNaN(effPercent) ? effPercent / 100 : 0;
    const effectiveBales = Math.floor(totalBales * effMultiplier);

    const pCapacity = parseFloat(palletCapacity) || 0;
    const bWeight = parseFloat(bagWeight) || 0;
    const calculatedPcsPerPallet = bWeight > 0 ? Math.floor(pCapacity / bWeight) : 0;
    const bSize = calculatedPcsPerPallet;

    const formatCurrency = (val) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
    const finalBaleCount = inputs.customCount && inputs.customCount !== '' ? parseFloat(inputs.customCount) : effectiveBales;
    const totalPieces = !isNaN(finalBaleCount) && !isNaN(bSize) ? finalBaleCount * bSize : 0;
    const fCharge = parseFloat(freightCharge) || 0;
    const freightPerPiece = totalPieces > 0 ? fCharge / totalPieces : 0;

    const renderInput = (label, name, currentUnit, isDimension = false) => (
        <div className="form-group">
            <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>{label.toUpperCase()}</label>
            <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                <input
                    type="number"
                    name={name}
                    value={inputs[name]}
                    onChange={onChange}
                    className="inputField"
                    style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                />
                {isDimension ? (
                    <select
                        value={localUnits[name]}
                        onChange={(e) => handleLocalUnitChange(name, e.target.value)}
                        style={{
                            width: '45px',
                            padding: '0.2rem',
                            fontSize: '0.7rem',
                            border: '1px solid #e2e8f0',
                            borderLeft: 'none',
                            background: '#f8fafc',
                            borderTopRightRadius: '6px',
                            borderBottomRightRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="m">m</option>
                        <option value="ft">ft</option>
                        <option value="in">in</option>
                        <option value="cm">cm</option>
                    </select>
                ) : (
                    <span className="unit-suffix" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{currentUnit}</span>
                )}
            </div>
        </div>
    );

    return (
        <div className="freight-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 1fr', gap: '2rem', alignItems: 'start' }}>
            {/* Left: Inputs Section */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Truck size={18} /> Freight Optimization
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>MASTER UNIT:</span>
                        <select name="unit" value={unit} onChange={onChange} style={{ width: 'auto', padding: '0.4rem', fontSize: '0.85rem', borderColor: '#cbd5e1', borderRadius: '4px', fontWeight: 600 }}>
                            <option value="m">Meters (m)</option>
                            <option value="ft">Feet (ft)</option>
                            <option value="cm">Centimeters (cm)</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Vehicle Section */}
                    <div>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem' }}>
                            Vehicle Dimensions
                        </h4>
                        <div className="form-grid" style={{ gap: '0.75rem' }}>
                            {renderInput("Length", "vehicleL", unit, true)}
                            {renderInput("Width", "vehicleW", unit, true)}
                            {renderInput("Height", "vehicleH", unit, true)}
                        </div>
                    </div>

                    {/* Pallet Section */}
                    <div>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem' }}>
                            Pallet Dimensions
                        </h4>
                        <div className="form-grid" style={{ gap: '0.75rem' }}>
                            {renderInput("Length", "baleL", unit, true)}
                            {renderInput("Width", "baleW", unit, true)}
                            {renderInput("Height", "baleH", unit, true)}

                            <div className="form-group">
                                <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>PALLET CAPACITY</label>
                                <div className="input-wrapper">
                                    <input
                                        type="number"
                                        name="palletCapacity"
                                        value={inputs.palletCapacity}
                                        onChange={onChange}
                                        className="inputField"
                                    />
                                    <span className="unit-suffix" style={{ fontSize: '0.75rem', fontWeight: 600 }}>kg</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Optimization Section */}
                    <div>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem' }}>
                            Settings
                        </h4>
                        <div className="form-grid" style={{ gap: '0.75rem' }}>
                            {renderInput("Efficiency", "efficiency", "%")}
                            {renderInput("Freight Cost", "freightCharge", "INR")}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>

                    {/* 1. Total Pallets */}
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Pallets (Physical)</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{totalBales}</div>
                    </div>

                    {/* 2. Effective Pallets */}
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Effective Pallets</div>
                        <div className="input-wrapper" style={{ maxWidth: '100px' }}>
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

                    {/* 3. Pcs / Pallet */}
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Pcs / Pallet</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569' }}>
                            {calculatedPcsPerPallet.toLocaleString()}
                        </div>
                        {bWeight === 0 && <div style={{ fontSize: '0.6rem', color: '#ef4444', marginTop: '2px' }}>* Set Bag Wt (Pricing)</div>}
                    </div>

                    {/* 4. Total Pieces */}
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Total Pieces</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                            {totalPieces.toLocaleString()}
                        </div>
                    </div>

                    {/* 5. Freight / Piece */}
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Freight Per Piece</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5' }}>{formatCurrency(freightPerPiece)}</div>
                    </div>
                </div>
            </div>

            {/* Right: Visualizer */}
            <div className="card" style={{ overflow: 'hidden', height: '100%' }}>
                <h3 style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase' }}>3D Visualization</h3>
                <div style={{ height: '400px', width: '100%', background: '#f1f5f9', borderRadius: '4px' }}>
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
