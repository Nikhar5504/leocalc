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
            <label style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>{label.toUpperCase()}</label>
            <div className="input-wrapper">
                <input type="number" name={name} value={inputs[name]} onChange={onChange} step="any" placeholder="0" style={{ fontWeight: 500 }} />
                <span className="unit-suffix" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{icon}</span>
            </div>
        </div>
    );

    return (
        <div className="pricing-page">
            <div className="card" style={{ marginBottom: '2rem', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                <div className="result-card" style={{ background: '#4f46e5', minColors: 'white' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                            Vendor Cost
                        </label>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.25rem' }}>Effective Vendor Cost</div>
                        <div className="value" style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{formatCurrency(effectiveVendorCost)}</div>
                    </div>

                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.1rem' }}>Adj. Conversion</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatRate(adjustedConversion)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>/kg</span></div>
                    </div>
                </div>

                {/* Card 2: Customer Pricing (Green/Emerald) */}
                <div className="result-card" style={{ background: '#059669' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                            Customer Pricing
                        </label>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.25rem' }}>Bag Price (Total)</div>
                        <div className="value" style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{formatCurrency(bagPrice)}</div>
                    </div>

                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.1rem' }}>Conversion Cost</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatRate(customerConversionPerKg)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>/kg</span></div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.1rem' }}>Customer Price / kg</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatNum(customerPricePerKg)}</div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Profit (Purple) */}
                <div className="result-card" style={{ background: '#9333ea' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                            Profit & Comparison
                        </label>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.25rem' }}>Net Profit</div>
                        <div className="value" style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{formatCurrency(netProfit)}</div>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>({formatNum(calculatedProfitPercent)}%)</div>
                    </div>

                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.1rem' }}>Conversion Diff / kg</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatRate(conversionDiff)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>/kg</span></div>
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
