import React from 'react';
import BaleVisualizer from './BaleVisualizer';
import { Truck, Box, Settings } from 'lucide-react';

// Shared Unit Logic from previous
const convertValue = (val, fromUnit, toUnit) => {
    const v = parseFloat(val);
    if (isNaN(v)) return 0;
    if (fromUnit === toUnit) return v;
    const toMeters = { 'm': 1, 'ft': 0.3048, 'cm': 0.01, 'in': 0.0254, 'mm': 0.001 };
    const valInMeters = v * toMeters[fromUnit];
    return parseFloat((valInMeters / toMeters[toUnit]).toFixed(4));
};

const dimensionFields = ['vehicleL', 'vehicleW', 'vehicleH', 'baleL', 'baleW', 'baleH'];

const readDimension = (raw, fallbackUnit) => {
    if (raw && typeof raw === 'object') {
        return {
            value: raw.value ?? '',
            unit: raw.unit || fallbackUnit
        };
    }

    return {
        value: raw ?? '',
        unit: fallbackUnit
    };
};

export default function FreightCalculator({ inputs, onChange, bagWeight }) {
    const { unit, vehicleL, vehicleW, vehicleH, baleL, baleW, baleH, efficiency, palletCapacity, freightCharge, customCount, effectivePalletCount } = inputs;

    // Local Unit State for each dimension
    const [dimUnits, setDimUnits] = React.useState(() => {
        return dimensionFields.reduce((acc, name) => {
            acc[name] = readDimension(inputs[name], unit).unit;
            return acc;
        }, {});
    });

    const handleLocalValueChange = (e, name, localUnit) => {
        const val = e.target.value;
        onChange({ target: { name, value: { value: val, unit: localUnit } } });
    };

    const handleLocalUnitChange = (name, newUnit) => {
        setDimUnits(prev => ({ ...prev, [name]: newUnit }));
        const current = readDimension(inputs[name], unit);
        onChange({ target: { name, value: { value: current.value, unit: newUnit } } });
    };

    const toMasterUnit = (name) => {
        const dim = readDimension(inputs[name], dimUnits[name] || unit);
        return convertValue(dim.value, dim.unit, unit);
    };

    const toCm = (name) => {
        const dim = readDimension(inputs[name], dimUnits[name] || unit);
        return convertValue(dim.value, dim.unit, 'cm');
    };

    // Math
    const vL_cm = toCm('vehicleL');
    const vW_cm = toCm('vehicleW');
    const vH_cm = toCm('vehicleH');
    const bL_cm = toCm('baleL');
    const bW_cm = toCm('baleW');
    const bH_cm = toCm('baleH');

    const balesInLength = bL_cm > 0 ? Math.floor(vL_cm / bL_cm) : 0;
    const balesInWidth = bW_cm > 0 ? Math.floor(vW_cm / bW_cm) : 0;
    const balesInHeight = bH_cm > 0 ? Math.floor(vH_cm / bH_cm) : 0;
    const totalBales = balesInLength * balesInWidth * balesInHeight;

    // Use manual input if available, otherwise fallback to efficiency calculation (for legacy saves)
    // Actually, user wants MANUAL input to be the driver. 
    // If effectivePalletCount is undefined (old save), allow efficiency to drive it initially?
    // User requested "editor can edit the total effective pallets".
    // So `effectiveBales` IS `effectivePalletCount`.
    const effectiveBales = effectivePalletCount !== undefined ? (parseInt(effectivePalletCount) || 0) : Math.floor(totalBales * ((parseFloat(efficiency) || 92) / 100));

    // Stats
    const bWeight = parseFloat(bagWeight) || 0; // grams
    const pCapacity = parseFloat(palletCapacity) || 0; // pcs per pallet or kg?
    // User requested "Pcs / Pallet" as a stat, so `palletCapacity` likely IS "Pcs / Pallet" input.
    // Confirmed from previous steps (line 30 in App.jsx: palletCapacity: 450).
    const pcsPerPallet = parseFloat(palletCapacity) || 0;

    const totalPieces = effectiveBales * pcsPerPallet;
    const fCharge = parseFloat(freightCharge) || 0;
    const freightPerPiece = totalPieces > 0 ? fCharge / totalPieces : 0;

    const renderDimInput = (label, name) => {
        const storedDim = readDimension(inputs[name], dimUnits[name] || unit);
        const localUnit = storedDim.unit;
        const displayVal = storedDim.value;
        const masterVal = toMasterUnit(name);
        const isDifferent = localUnit !== unit;

        return (
            <div>
                <label className="text-text-muted text-xs font-medium uppercase tracking-wider block mb-1.5">{label}</label>
                <div className="flex rounded-lg shadow-sm">
                    <input
                        className="block w-full rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-sm text-text-main focus:ring-primary focus:border-primary py-2.5 px-3 font-mono font-semibold"
                        type="number"
                        value={displayVal}
                        onChange={(e) => handleLocalValueChange(e, name, localUnit)}
                        placeholder="0"
                    />
                    <div className="border border-l-0 border-slate-200 bg-slate-100 py-0 px-0 flex items-center justify-center min-w-[4rem] rounded-r-lg">
                        <select
                            value={localUnit}
                            onChange={(e) => handleLocalUnitChange(name, e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer h-full py-2.5 pl-2 pr-1 w-full text-center"
                        >
                            <option value="m">M</option>
                            <option value="ft">FT</option>
                            <option value="in">IN</option>
                            <option value="cm">CM</option>
                            <option value="mm">MM</option>
                        </select>
                    </div>
                </div>
                {isDifferent && (
                    <p className="text-[10px] text-primary mt-1 text-right font-medium">
                        Internally {masterVal} {unit.toUpperCase()}
                    </p>
                )}
            </div>
        );
    };

    const displayDim = (name) => {
        const dim = readDimension(inputs[name], dimUnits[name] || unit);
        return `${dim.value || 0} ${dim.unit}`;
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full min-h-[420px]">

            {/* Left Col: Config (Span 1) */}
            <div className="panel-surface rounded-2xl p-6 flex flex-col gap-5 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-1 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">local_shipping</span>
                        <h4 className="text-text-main font-black">Freight Configuration</h4>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Measurement Unit</span>
                        <select
                            name="unit"
                            value={unit}
                            onChange={onChange}
                            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-text-main font-bold focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                            <option value="m">Meters (M)</option>
                            <option value="ft">Feet (FT)</option>
                            <option value="in">Inches (IN)</option>
                            <option value="cm">CM</option>
                            <option value="mm">MM</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1">VEHICLE DIMENSIONS</h5>
                    {renderDimInput("Length (L)", "vehicleL")}
                    {renderDimInput("Width (W)", "vehicleW")}
                    {renderDimInput("Height (H)", "vehicleH")}
                </div>

                <div className="space-y-3 pt-2">
                    <h5 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1">PALLET DIMENSIONS</h5>
                    {/* Using baleL/W/H from state as "Pallet" dims */}
                    {renderDimInput("Length (L)", "baleL")}
                    {renderDimInput("Width (W)", "baleW")}
                    {renderDimInput("Height (H)", "baleH")}
                </div>

                <div className="space-y-3 pt-2">
                    <h5 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1">SETTINGS</h5>
                    <label className="flex flex-col gap-2">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Pallet Capacity (Pcs)</span>
                        <input
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-text-main placeholder-slate-400 focus:ring-1 focus:ring-primary focus:border-primary font-mono text-sm font-semibold"
                            type="number"
                            name="palletCapacity"
                            value={palletCapacity}
                            onChange={onChange}
                            placeholder="0"
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Effective Pallets (Fit in Vehicle)</span>
                        <input
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-text-main placeholder-slate-400 focus:ring-1 focus:ring-primary focus:border-primary font-mono text-sm font-semibold"
                            type="number"
                            name="effectivePalletCount"
                            value={effectivePalletCount ?? ''} // Handle undefined
                            onChange={onChange}
                            placeholder={Math.floor(totalBales * 0.9)} // Hint: 90% of max?
                        />
                        <p className="text-[10px] text-slate-400 text-right">Max Theoretical: {totalBales}</p>
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Total Freight Cost</span>
                        <div className="flex rounded-lg shadow-sm">
                            <input
                                className="block w-full rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-sm text-text-main focus:ring-primary focus:border-primary py-2.5 px-3 font-mono font-semibold"
                                type="number"
                                name="freightCharge"
                                value={freightCharge}
                                onChange={onChange}
                                placeholder="0"
                            />
                            <div className="rounded-r-lg border border-l-0 border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 py-2.5 px-3 flex items-center justify-center min-w-[3rem]">
                                INR
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Right Col: Visualizer (Span 2) */}
            <div className="panel-surface xl:col-span-2 rounded-2xl p-1 flex flex-col relative overflow-hidden h-full min-h-[400px]">

                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button className="pressable bg-primary hover:bg-primary/90 text-white rounded-xl p-2 transition-colors shadow-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">3d_rotation</span>
                    </button>
                </div>

                {/* 3D Canvas Area */}
                <div className="flex-1 bg-slate-50 rounded-xl relative overflow-hidden bale-pattern flex items-center justify-center border border-slate-100 m-1">
                    <div style={{ width: '100%', height: '100%' }}>
                        <BaleVisualizer
                            vehicleDims={{ l: vL_cm, w: vW_cm, h: vH_cm }}
                            baleDims={{ l: bL_cm, w: bW_cm, h: bH_cm }}
                            effectiveCount={effectiveBales}
                            displayData={{
                                unit,
                                vL: inputs.vehicleL, vW: inputs.vehicleW, vH: inputs.vehicleH,
                                bL: inputs.baleL, bW: inputs.baleW, bH: inputs.baleH
                            }}
                        />
                    </div>
                    {/* Debug Stats Overlay in Canvas */}
                    <div className="absolute bottom-4 left-4 font-mono text-xs text-slate-400 bg-white/80 px-2 py-1 rounded border border-slate-200 pointer-events-none">
                        {displayDim('vehicleL')} x {displayDim('vehicleW')} x {displayDim('vehicleH')}
                    </div>
                </div>

                {/* Footer Stats - REPLACEMENT as requested */}
                <div className="min-h-20 bg-white/80 border-t border-slate-200 flex flex-col justify-center px-6 py-4 rounded-b-2xl">
                    <div className="flex flex-wrap gap-x-8 gap-y-2 justify-between items-center w-full">

                        {/* Total Pallets (Physical) */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Total Pallets (Physical)</span>
                            <span className="text-text-main font-mono font-bold text-lg">{Math.ceil(totalBales)}</span>
                        </div>

                        {/* Effective Pallets */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Effective Pallets</span>
                            <span className="text-emerald-600 font-mono font-bold text-lg">{effectiveBales}</span>
                        </div>

                        {/* Pcs / Pallet */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Pcs / Pallet</span>
                            <span className="text-text-main font-mono font-bold text-lg">{pcsPerPallet.toLocaleString()}</span>
                        </div>

                        {/* Total Pieces */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Total Pieces</span>
                            <span className="text-text-main font-mono font-bold text-lg">{totalPieces.toLocaleString()}</span>
                        </div>

                        {/* Freight Per Piece */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Freight Per Piece</span>
                            <span className="text-primary font-mono font-bold text-lg">₹{freightPerPiece.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
