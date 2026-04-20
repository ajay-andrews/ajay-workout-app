'use client'
// 1. Using the standard library instead of auth-helpers
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'

// 2. Initialize outside the component or inside with state
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function WorkoutDashboard() {
  const [type, setType] = useState('Strength')
  const [rpe, setRpe] = useState(7)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const logWorkout = async () => {
    setLoading(true)
    setStatus('Syncing...')
    
    // Check for user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setStatus('Error: Please login first!')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('workouts').insert({
      user_id: user.id,
      type: type,
      overall_rpe: rpe,
      intensity_level: rpe >= 8 ? 'High' : rpe >= 5 ? 'Medium' : 'Low',
      duration_minutes: 60,
      created_at: new Date().toISOString()
    })

    setLoading(false)
    if (error) setStatus(`Error: ${error.message}`)
    else setStatus('Session Logged. STAY HARD.')
  }

  return (
    <main className="p-8 bg-slate-950 min-h-screen text-slate-100 font-sans flex flex-col items-center">
      <div className="w-full max-w-md">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black italic tracking-tighter text-blue-500">TRAINING LOG</h1>
        </header>
        
        <div className="space-y-8 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-3">Modality</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 text-lg font-bold outline-none"
            >
              <option value="Strength">Strength Training</option>
              <option value="Cardio">Cardio / Zone 2</option>
              <option value="Mobility">Mobility & Yoga</option>
              <option value="Hiking">Urban Hiking</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-3">Intensity (RPE)</label>
            <input 
              type="range" min="1" max="10" step="1"
              value={rpe}
              onChange={(e) => setRpe(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-4 items-center">
              <span className="text-5xl font-black text-white">{rpe}</span>
            </div>
          </div>

          <button 
            onClick={logWorkout}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl text-xl"
          >
            {loading ? 'UPLOADING...' : 'COMMIT SESSION'}
          </button>

          {status && (
            <p className={`text-center font-bold text-sm mt-4 ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {status}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}