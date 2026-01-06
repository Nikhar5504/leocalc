import React from 'react';
import { Truck } from 'lucide-react';
import BaleVisualizer from './BaleVisualizer';

export default function FreightCalculator({ inputs, onChange, bagWeight }) {
    const { unit, vehicleL, vehicleW, vehicleH, baleL, baleW, baleH, freightCharge, efficiency, palletCapacity } = inputs;

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
    const effMultiplier = !isNaN(effPercent) ? effPercent / 100 : 0;

    const effectiveBales = Math.floor(totalBales * effMultiplier);

    // Calculate Pieces per Pallet (baleSize) using Pallet Capacity and Bag Weight
    const pCapacity = parseFloat(palletCapacity) || 0;
    const bWeight = parseFloat(bagWeight) || 0;
    // Calculate pieces: Capacity / Bag Weight. Use floor to avoid partial bags on a pallet.
    const calculatedPcsPerPallet = bWeight > 0 ? Math.floor(pCapacity / bWeight) : 0;

    // We update the 'baleSize' concept to be this calculated value for downstream logic
    const bSize = calculatedPcsPerPallet;

    const formatCurrency = (val) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

    // Determine the count to use: Custom Override or Calculated
    const finalBaleCount = inputs.customCount && inputs.customCount !== '' ? parseFloat(inputs.customCount) : effectiveBales;

    // Derived total pieces based on final count. Ensure no NaN.
    const totalPieces = !isNaN(finalBaleCount) && !isNaN(bSize) ? finalBaleCount * bSize : 0;

    // Safety check for freight charge
    const fCharge = parseFloat(freightCharge) || 0;
    const freightPerPiece = totalPieces > 0 ? fCharge / totalPieces : 0;

    // --- Unit Helper ---
    // We need to convert FROM local unit TO main unit
    const convertValue = (val, fromUnit, toUnit) => {
        const v = parseFloat(val);
        if (isNaN(v)) return 0;
        if (fromUnit === toUnit) return v;

        // Base unit is cm? Or we just convert ratios.
        // Let's standardise everything to meters first, then to target.
        // Factors to Meters
        const toMeters = {
            'm': 1,
            'ft': 0.3048,
            'cm': 0.01,
            'in': 0.0254,
            'mm': 0.001
        };

        const valInMeters = v * toMeters[fromUnit];
        const valInTarget = valInMeters / toMeters[toUnit];
        return parseFloat(valInTarget.toFixed(4)); // Avoid weird float rounding
    };

    // --- Smart Input Component ---
    const DimensionInput = ({ label, name, value, mainUnit, onChange }) => {
        const [localUnit, setLocalUnit] = React.useState(mainUnit);
        const [localValue, setLocalValue] = React.useState(value);

        // Sync local value when external value OR mainUnit changes (and we aren't editing ideally, 
        // but for now let's just sync if localUnit matches mainUnit)
        React.useEffect(() => {
            if (localUnit === mainUnit) {
                setLocalValue(value);
            }
        }, [value, mainUnit, localUnit]);

        // When local unit changes, we don't necessarily convert the value *yet*?
        // User wants: "if I put value in inches... it should convert"
        // So simply changing the dropdown shouldn't change the number, just the interpretation?
        // Wait, regular usage:
        // 1. I see "10 ft".
        // 2. I change dropdown to "in".
        // 3. Current "10" is now treated as "10 inches"? Or does it convert "10 ft" to "120 in"?
        // User said: "if I have dimension in inches, and if I put value in inches, so that it should convert that inch to feet"
        // This implies: Select Inch -> Type Value -> Converts to Feet.
        // So when I select "Inch", the input can probably clear or user overwrites it.

        const handleBlur = () => {
            if (localUnit !== mainUnit) {
                // Convert LocalValue (in LocalUnit) -> MainValue (in MainUnit)
                const converted = convertValue(localValue, localUnit, mainUnit);

                // Update Parent
                onChange({ target: { name, value: converted } });

                // Reset Logal
                setLocalUnit(mainUnit);
                setLocalValue(converted);
            } else {
                // Just update parent with current value
                onChange({ target: { name, value: localValue } });
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') handleBlur();
        };

        return (
            <div className="form-group">
                <label style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>{label.toUpperCase()}</label>
                <div className="input-wrapper" style={{ display: 'flex', gap: '0' }}>
                    <input
                        type="number"
                        name={name}
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="inputField"
                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none', flex: 1 }}
                    />
                    <select
                        value={localUnit}
                        onChange={(e) => setLocalUnit(e.target.value)}
                        style={{
                            width: '4.5rem',
                            padding: '0 0.2rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderColor: '#e2e8f0',
                            backgroundColor: localUnit !== mainUnit ? '#fef3c7' : '#f8fafc',
                            color: localUnit !== mainUnit ? '#d97706' : '#64748b'
                        }}
                    >
                        <option value="m">m</option>
                        <option value="ft">ft</option>
                        <option value="in">in</option>
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                    </select>
                </div>
            </div>
        );
    };

    const renderStandardInput = (label, name, suffix, props = {}) => (
        <div className="form-group">
            <label style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>{label.toUpperCase()}</label>
            <div className="input-wrapper">
                <input
                    type="number"
                    name={name}
                    value={inputs[name]}
                    onChange={onChange}
                    className="inputField"
                    {...props}
                />
                {suffix && <span className="unit-suffix" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{suffix}</span>}
            </div>
        </div>
    );

    const renderDimensionInput = (label, name) => (
        <DimensionInput
            label={label}
            name={name}
            value={inputs[name]}
            mainUnit={unit}
            onChange={onChange}
        />
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Vehicle Section */}
                    <div>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem' }}>
                            Vehicle Dimensions
                        </h4>
                        <div className="form-grid" style={{ gap: '0.75rem' }}>
                            {renderDimensionInput("Length", "vehicleL")}
                            {renderDimensionInput("Width", "vehicleW")}
                            {renderDimensionInput("Height", "vehicleH")}
                        </div>
                    </div>

                    {/* Pallet Section (Renamed from Bale) */}
                    <div>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem' }}>
                            Pallet Dimensions
                        </h4>
                        <div className="form-grid" style={{ gap: '0.75rem' }}>
                            {renderDimensionInput("Length", "baleL")}
                            {renderDimensionInput("Width", "baleW")}
                            {renderDimensionInput("Height", "baleH")}

                            <div className="form-group">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>PALLET CAPACITY</label>
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
                            {renderStandardInput("Efficiency", "efficiency", "%")}
                            {renderStandardInput("Freight Cost", "freightCharge", "INR")}
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
