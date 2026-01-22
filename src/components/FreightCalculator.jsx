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

export default function FreightCalculator({ inputs, onChange, bagWeight }) {
    const { unit, vehicleL, vehicleW, vehicleH, baleL, baleW, baleH, efficiency, palletCapacity, freightCharge, customCount } = inputs;

    // Helper to normalize visuals to CM
    const toCm = (val) => {
        const v = parseFloat(val) || 0;
        if (unit === 'm') return v * 100;
        if (unit === 'ft') return v * 30.48;
        if (unit === 'in') return v * 2.54;
        if (unit === 'mm') return v * 0.1;
        return v;
    };

    // Math
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
    const effPercent = parseFloat(efficiency) || 0;
    const effectiveBales = Math.floor(totalBales * (effPercent / 100));

    // Stats
    const bWeight = parseFloat(bagWeight) || 0; // grams
    const pCapacity = parseFloat(palletCapacity) || 0; // pcs per pallet or kg?
    // User requested "Pcs / Pallet" as a stat, so `palletCapacity` likely IS "Pcs / Pallet" input.
    // Confirmed from previous steps (line 30 in App.jsx: palletCapacity: 450).
    const pcsPerPallet = parseFloat(palletCapacity) || 0;

    const totalPieces = effectiveBales * pcsPerPallet;
    const fCharge = parseFloat(freightCharge) || 0;
    const freightPerPiece = totalPieces > 0 ? fCharge / totalPieces : 0;

    const renderDimInput = (label, name) => (
        <div>
            <label className="text-text-muted text-xs font-medium uppercase tracking-wider block mb-1.5">{label}</label>
            <div className="flex rounded-lg shadow-sm">
                <input
                    className="block w-full rounded-l-lg border border-r-0 border-border-light bg-slate-50 text-sm text-text-main focus:ring-primary focus:border-primary py-2.5 px-3 font-mono font-semibold"
                    type="number"
                    name={name}
                    value={inputs[name]}
                    onChange={onChange}
                    placeholder="0"
                />
                <div className="rounded-r-lg border border-l-0 border-border-light bg-slate-100 text-xs font-bold text-slate-500 py-2.5 px-3 flex items-center justify-center min-w-[3rem]">
                    {unit.toUpperCase()}
                </div>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full min-h-[420px]">

            {/* Left Col: Config (Span 1) */}
            <div className="bg-white border border-border-light rounded-xl p-6 flex flex-col gap-5 shadow-sm h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-1 pb-4 border-b border-border-light">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">local_shipping</span>
                        <h4 className="text-text-main font-semibold">Freight Configuration</h4>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Measurement Unit</span>
                        <select
                            name="unit"
                            value={unit}
                            onChange={onChange}
                            className="bg-slate-50 border border-border-light rounded px-2 py-1 text-xs text-text-main font-bold focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                            <option value="m">Meters (M)</option>
                            <option value="ft">Feet (FT)</option>
                            <option value="in">Inches (IN)</option>
                            <option value="cm">CM</option>
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
                            className="w-full bg-slate-50 border border-border-light rounded-lg py-2.5 px-3 text-text-main placeholder-slate-400 focus:ring-1 focus:ring-primary focus:border-primary font-mono text-sm font-semibold"
                            type="number"
                            name="palletCapacity"
                            value={palletCapacity}
                            onChange={onChange}
                            placeholder="0"
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Packing Efficiency</span>
                        <div className="flex items-center gap-3">
                            <input
                                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                type="range"
                                name="efficiency"
                                min="50"
                                max="100"
                                value={efficiency}
                                onChange={onChange}
                            />
                            <span className="bg-slate-50 border border-border-light rounded px-2 py-1 text-text-main font-mono text-sm w-12 text-center font-bold">{efficiency}%</span>
                        </div>
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Total Freight Cost</span>
                        <div className="flex rounded-lg shadow-sm">
                            <input
                                className="block w-full rounded-l-lg border border-r-0 border-border-light bg-slate-50 text-sm text-text-main focus:ring-primary focus:border-primary py-2.5 px-3 font-mono font-semibold"
                                type="number"
                                name="freightCharge"
                                value={freightCharge}
                                onChange={onChange}
                                placeholder="0"
                            />
                            <div className="rounded-r-lg border border-l-0 border-border-light bg-slate-100 text-xs font-bold text-slate-500 py-2.5 px-3 flex items-center justify-center min-w-[3rem]">
                                INR
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Right Col: Visualizer (Span 2) */}
            <div className="xl:col-span-2 bg-white border border-border-light rounded-xl p-1 flex flex-col relative overflow-hidden shadow-sm h-full min-h-[400px]">

                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button className="bg-primary hover:bg-primary/90 text-white rounded-lg p-2 transition-colors shadow-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">3d_rotation</span>
                    </button>
                </div>

                {/* 3D Canvas Area */}
                <div className="flex-1 bg-slate-50 rounded-lg relative overflow-hidden bale-pattern flex items-center justify-center border border-slate-100 m-1">
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
                        {inputs.vehicleL} x {inputs.vehicleW} x {inputs.vehicleH} {unit}
                    </div>
                </div>

                {/* Footer Stats - REPLACEMENT as requested */}
                <div className="h-20 bg-white border-t border-border-light flex flex-col justify-center px-6 rounded-b-lg">
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
