import React from 'react';
import { IndianRupee, Percent, Weight, Truck } from 'lucide-react';

export default function PricingCalculator({ inputs, onChange }) {
    const ppRate = parseFloat(inputs.ppRate) || 0;
    const conversionCost = parseFloat(inputs.conversionCost) || 0;
    const bagWeight = parseFloat(inputs.bagWeight) || 0;
    const transportPerBag = parseFloat(inputs.transportPerBag) || 0;
    const profitMargin = parseFloat(inputs.profitMargin) || 0;

    // 1. Adjusted Conversion
    // Logic Fix: Direct addition as per user request (Conversion + Transport)
    const adjustedConversion = conversionCost + transportPerBag;

    // 2. Costs
    const materialCostPerBag = ppRate * bagWeight;
    const conversionCostPerBag = adjustedConversion * bagWeight;
    const effectiveVendorCost = materialCostPerBag + conversionCostPerBag;

    // 3. Pricing
    const bagPrice = effectiveVendorCost * (1 + profitMargin / 100);
    const customerPricePerKg = bagWeight > 0 ? bagPrice / bagWeight : 0;

    // 4. Metrics
    const netProfit = bagPrice - effectiveVendorCost;
    const calculatedProfitPercent = effectiveVendorCost > 0 ? (netProfit / effectiveVendorCost) * 100 : 0;

    // 5. Customer Conversion (Implied)
    // Logic: Customer Price/kg - PP Rate
    const customerConversionPerKg = customerPricePerKg - ppRate;

    // 6. Diff
    const conversionDiff = customerConversionPerKg - adjustedConversion;

    // Formatting helpers
    const formatCurrency = (val) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
    const formatRate = (val) => val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 }); // 4 decimals for rates often useful, but sticking to 4 as per request usually
    const formatNum = (val) => val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const renderInput = (label, name, icon) => (
        <div className="form-group">
            <label>{label}</label>
            <div className="input-wrapper">
                <input type="number" name={name} value={inputs[name]} onChange={onChange} step="any" placeholder="0" />
                <span className="unit-suffix">{icon}</span>
            </div>
        </div>
    );

    return (
        <div className="pricing-page">
            <div className="card mb-4">
                <h3 className="card-header">
                    <CalculatorIcon /> Calculator Inputs
                </h3>
                <div className="form-grid">
                    {renderInput("PP Rate", "ppRate", "INR/kg")}
                    {renderInput("Conversion", "conversionCost", "INR/kg")}
                    {renderInput("Bag Weight", "bagWeight", "kg")}
                    {renderInput("Transport Per Bag", "transportPerBag", "INR")}
                    {renderInput("Profit Margin", "profitMargin", "%")}
                </div>
            </div>

            <div className="results-grid">
                {/* Card 1: Vendor Cost (Blue/Indigo) */}
                <div className="result-card bg-indigo-600 text-white">
                    <div className="flex-1">
                        <label className="text-white/70 text-xs font-semibold uppercase block mb-1">
                            Vendor Cost
                        </label>
                        <div className="text-sm text-white/90 mb-1">Effective Vendor Cost</div>
                        <div className="text-3xl font-bold tracking-tight">{formatCurrency(effectiveVendorCost)}</div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/20">
                        <div className="text-xs text-white/70">Adj. Conversion</div>
                        <div className="text-lg font-bold">{formatRate(adjustedConversion)} <span className="text-sm font-medium">/kg</span></div>
                    </div>
                </div>

                {/* Card 2: Customer Pricing (Green/Emerald) */}
                <div className="result-card bg-emerald-600 text-white">
                    <div className="flex-1">
                        <label className="text-white/70 text-xs font-semibold uppercase block mb-1">
                            Customer Pricing
                        </label>
                        <div className="text-sm text-white/90 mb-1">Bag Price (Total)</div>
                        <div className="text-3xl font-bold tracking-tight">{formatCurrency(bagPrice)}</div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/20 flex justify-between">
                        <div>
                            <div className="text-xs text-white/70">Conversion Cost</div>
                            <div className="text-lg font-bold">{formatRate(customerConversionPerKg)} <span className="text-sm font-medium">/kg</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-white/70">Customer Price / kg</div>
                            <div className="text-lg font-bold">{formatNum(customerPricePerKg)}</div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Profit (Purple) */}
                <div className="result-card bg-purple-600 text-white">
                    <div className="flex-1">
                        <label className="text-white/70 text-xs font-semibold uppercase block mb-1">
                            Profit & Comparison
                        </label>
                        <div className="text-sm text-white/90 mb-1">Net Profit</div>
                        <div className="text-3xl font-bold tracking-tight">{formatCurrency(netProfit)}</div>
                        <div className="text-sm text-white/80">({formatNum(calculatedProfitPercent)}%)</div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/20">
                        <div className="text-xs text-white/70">Conversion Diff / kg</div>
                        <div className="text-lg font-bold">{formatRate(conversionDiff)} <span className="text-sm font-medium">/kg</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CalculatorIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" />
        </svg>
    )
}
