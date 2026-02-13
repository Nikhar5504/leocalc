import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const submitLock = React.useRef(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        // Prevent double submission via Ref Lock
        if (submitLock.current || loading) return;
        submitLock.current = true;

        setLoading(true);
        setMessage(null);



        // 1. Strict Email Access Control
        const ALLOWED_EMAIL = 'chhabhayanikhar@gmail.com';

        if (email.trim().toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
            setLoading(false);
            submitLock.current = false;
            setMessage({ type: 'error', text: 'Access Denied: This email is not authorized to access Leocalc.' });
            return;
        }

        try {
            // 2. Send Magic Link
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    // Redirect back to the app after clicking the link
                    emailRedirectTo: window.location.origin
                }
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Login link sent! Please check your email inbox.' });
        } catch (error) {
            console.error('Error logging in:', error);
            if (error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
                setMessage({ type: 'error', text: 'Too many attempts. Please wait 60 seconds before sending another link.' });
            } else {
                setMessage({ type: 'error', text: error.error_description || error.message });
            }
        } finally {
            setLoading(false);
            // Keep the lock for a short delay to prevent accidental double-clicks even after loading finishes
            setTimeout(() => {
                submitLock.current = false;
            }, 1000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-display">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
                    Sign in to Leocalc
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Authorized personnel only
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? 'Sending Link...' : 'Send Login Link'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-slate-500">Secure Access</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
