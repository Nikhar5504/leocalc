import React from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Settings({ onLogout }) {
    const handleLogout = async () => {
        // Attempt Supabase logout
        await supabase.auth.signOut();
        // Also trigger parent handler to clear master session if any
        if (onLogout) onLogout();
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Account</h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <strong style={{ display: 'block', color: '#334155' }}>Session Status</strong>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Currently Active</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            borderColor: '#ef4444',
                            color: '#ef4444'
                        }}
                    >
                        <LogOut size={16} /> Log Out
                    </button>
                </div>
            </div>

            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                v1.3
            </div>


        </div>
    );
}
