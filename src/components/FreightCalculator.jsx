import React from 'react';
import { Truck } from 'lucide-react';
import BaleVisualizer from './BaleVisualizer';

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
    const [localValue, setLocalValue] = React.useState('');

    // 1. Sync Local Unit if Global Unit changes (Reset behavior)
    React.useEffect(() => {
        setLocalUnit(mainUnit);
    }, [mainUnit]);

    // 2. Sync Local Value from Parent (Physical Constancy)
    // We convert the incoming parent value (in mainUnit) to our current localUnit
    React.useEffect(() => {
        const converted = convertValue(value, mainUnit, localUnit);

        const currentImplied = convertValue(localValue, localUnit, mainUnit);
        const incoming = parseFloat(value) || 0;
        const implied = parseFloat(currentImplied) || 0;

        // Tolerance for float comparison
        if (Math.abs(incoming - implied) > 0.0001) {
            setLocalValue(converted);
        }
    }, [value, mainUnit, localUnit]);

    const handleChange = (e) => {
        const newVal = e.target.value;
        setLocalValue(newVal);

        // Real-time update to parent
        if (newVal === '' || isNaN(parseFloat(newVal))) {
            onChange({ target: { name, value: 0 } });
            return;
        }

        const converted = convertValue(newVal, localUnit, mainUnit);
        onChange({ target: { name, value: converted } });
    };

    const handleUnitChange = (e) => {
        const newUnit = e.target.value;
        setLocalUnit(newUnit);
        // When unit changes, we want to keep the PHYSICAL size, so we update the number.
        // Current value in Main Unit is `value`.
        // New Display Value = convert `value` (Main) -> `newUnit`
        // We rely on the useEffect [value, mainUnit, localUnit] to trigger?
        // Yes, because we changed `localUnit`, the effect will fire, re-convert proper value to new unit.
    };

    return (
        <div className="form-group">
            <label>{label}</label>
            <div className="input-group-joined">
                <input
                    type="number"
                    name={name}
                    value={localValue}
                    onChange={handleChange}
                    onWheel={(e) => e.target.blur()}
                    className="glass-input input-joined"
                />
                <select
                    value={localUnit}
                    onChange={handleUnitChange}
                    className="select-joined"
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

export default function FreightCalculator({ inputs, onChange, bagWeight }) {
    const { unit, vehicleL, vehicleW, vehicleH, baleL, baleW, baleH, freightCharge, efficiency, palletCapacity } = inputs;

    const toCm = (val) => {
        const v = parseFloat(val) || 0;
        if (unit === 'm') return v * 100;
        if (unit === 'ft') return v * 30.48;
        if (unit === 'in') return v * 2.54;
        if (unit === 'mm') return v * 0.1;
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

    const renderStandardInput = (label, name, suffix, props = {}) => (
        <div className="form-group">
            <label>{label}</label>
            <div className="input-wrapper">
                <input
                    type="number"
                    name={name}
                    value={inputs[name]}
                    onChange={onChange}
                    className="glass-input"
                    {...props}
                />
                {suffix && <span className="unit-suffix">{suffix}</span>}
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
        <div className="freight-layout">
            {/* Left: Inputs Section */}
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="card-header">
                        <Truck size={18} /> Freight Inputs
                    </h3>
                    <select name="unit" value={unit} onChange={onChange} className="glass-input" style={{ width: 'auto' }}>
                        <option value="m">Meters (m)</option>
                        <option value="ft">Feet (ft)</option>
                        <option value="cm">Centimeters (cm)</option>
                        <option value="in">Inches (in)</option>
                        <option value="mm">Millimeters (mm)</option>
                    </select>
                </div>

                <div className="flex flex-col gap-6">

                    {/* Vehicle Section */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-200 pb-1">
                            Vehicle Dimensions
                        </h4>
                        <div className="form-grid">
                            {renderDimensionInput("Length", "vehicleL")}
                            {renderDimensionInput("Width", "vehicleW")}
                            {renderDimensionInput("Height", "vehicleH")}
                        </div>
                    </div>

                    {/* Pallet Section */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-200 pb-1">
                            Pallet Dimensions
                        </h4>
                        <div className="form-grid">
                            {renderDimensionInput("Length", "baleL")}
                            {renderDimensionInput("Width", "baleW")}
                            {renderDimensionInput("Height", "baleH")}

                            <div className="form-group">
                                <label>PALLET CAPACITY</label>
                                <div className="input-wrapper">
                                    <input
                                        type="number"
                                        name="palletCapacity"
                                        value={inputs.palletCapacity}
                                        onChange={onChange}
                                        className="glass-input"
                                    />
                                    <span className="unit-suffix">kg</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Optimization Section */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-200 pb-1">
                            Settings
                        </h4>
                        <div className="form-grid">
                            {renderStandardInput("Efficiency", "efficiency", "%")}
                            {renderStandardInput("Freight Cost", "freightCharge", "INR")}
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 md:grid-cols-5 gap-4">

                    {/* 1. Total Pallets */}
                    <div>
                        <div className="text-xs text-slate-500">Total Pallets (Physical)</div>
                        <div className="font-bold text-lg text-slate-800">{totalBales}</div>
                    </div>

                    {/* 2. Effective Pallets */}
                    <div>
                        <div className="text-xs text-slate-500">Effective Pallets</div>
                        <div className="input-wrapper" style={{ maxWidth: '100px' }}>
                            <input
                                type="number"
                                name="customCount"
                                value={inputs.customCount ?? ''}
                                onChange={onChange}
                                placeholder={effectiveBales.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                className="glass-input font-bold py-1 px-2 border-amber-300"
                            />
                        </div>
                        {inputs.customCount && <div className="text-xs text-amber-500 mt-1">* Overridden</div>}
                    </div>

                    {/* 3. Pcs / Pallet */}
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Pcs / Pallet</div>
                        <div className="text-lg font-bold text-slate-700">
                            {calculatedPcsPerPallet.toLocaleString()}
                        </div>
                        {bWeight === 0 && <div className="text-xs text-red-500 mt-1">* Set Bag Wt (Pricing)</div>}
                    </div>

                    {/* 4. Total Pieces */}
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Total Pieces</div>
                        <div className="text-lg font-bold text-slate-900">
                            {totalPieces.toLocaleString()}
                        </div>
                    </div>

                    {/* 5. Freight / Piece */}
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Freight Per Piece</div>
                        <div className="text-xl font-bold text-indigo-600">{formatCurrency(freightPerPiece)}</div>
                    </div>
                </div>
            </div>

            {/* Right: Visualizer */}
            <div className="card h-full min-h-[400px] overflow-hidden flex flex-col">
                <h3 className="card-header border-b-0 mb-4 text-xs">3D Visualization</h3>
                <div className="flex-1 bg-slate-50 rounded-lg overflow-hidden">
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
