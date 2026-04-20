'use client'
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Initialize the standard client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
      setLoading(false)
    } else {
      setMessage('Success! Redirecting...')
      router.push('/')
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    setMessage('')
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) setMessage(`Error: ${error.message}`)
    else setMessage('Check your email for the confirmation link!')
    setLoading(false)
  }

  return (
    <main className="p-8 bg-slate-950 min-h-screen text-slate-100 font-sans flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <h1 className="text-3xl font-black italic mb-8 text-blue-500">ACCESS GRANTED</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all"
          >
            {loading ? 'PROCESSING...' : 'LOGIN'}
          </button>
        </form>

        <button 
          onClick={handleSignUp}
          className="w-full mt-4 text-slate-500 font-bold hover:text-slate-300 transition-all text-sm"
        >
          NEW ATHLETE? SIGN UP
        </button>

        {message && (
          <p className={`text-center font-bold text-sm mt-6 ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {message}
          </p>
        )}
      </div>
    </main>
  )
}