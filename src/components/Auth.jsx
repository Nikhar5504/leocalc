import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth({ onMasterLogin }) {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState(null)

    const handleLogin = async (e) => {
        e.preventDefault()

        setLoading(true)
        setMessage(null)

        // Master Password Bypass
        if (email.trim() === "5504") {
            // Mock user object
            onMasterLogin({ id: 'master-bypass', email: 'master@leopack.in' });
            return;
        }

        const authorizedEmails = ["sales@leopack.in", "chhabhayanikhar@gmail.com"];
        if (!authorizedEmails.includes(email.trim().toLowerCase())) {
            setMessage("Access Restricted: This application is for authorized personnel only.")
            setLoading(false)
            return
        }

        try {
            console.log("Attempting login for:", email);
            const { data, error } = await supabase.auth.signInWithOtp({ email })

            console.log("Supabase Response:", { data, error });

            if (error) {
                console.error("Supabase Login Error:", error);
                throw error
            }

            setMessage('Magic link sent! Check your email.')
        } catch (error) {
            console.error("Catch Block Error:", error);
            setMessage(error.error_description || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'Open Sans', fontWeight: '800', color: '#1e293b' }}>
                    Login
                </h1>
                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2rem' }}>Authentication Required</p>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        className="inputField"
                        type="text"
                        placeholder="Your email or code"
                        value={email}
                        required={true}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                    />
                    <button
                        className="primary"
                        disabled={loading}
                        style={{ padding: '0.75rem', borderRadius: '0.5rem' }}
                    >
                        {loading ? <span>Sending...</span> : <span>Send Magic Link</span>}
                    </button>
                </form>

                {message && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '0.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}
