'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const supabase = createClientComponentClient()

  const handleSignUp = async () => {
    await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } })
    alert('Check your email for the login link!')
  }

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    else window.location.href = '/'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-900 text-white">
      <h1 className="text-4xl font-black mb-8 italic text-blue-500">DISCIPLINE EQUALS FREEDOM</h1>
      <div className="w-full max-w-sm space-y-4">
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-white"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-white"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleSignIn} className="w-full bg-blue-600 p-3 rounded font-bold hover:bg-blue-500">Log In</button>
        <button onClick={handleSignUp} className="w-full text-slate-400 text-sm">Create Account</button>
      </div>
    </div>
  )
}