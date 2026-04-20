'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState, useEffect } from 'react'

export default function WorkoutDashboard() {
  const supabase = createClientComponentClient()
  const [type, setType] = useState('Strength')
  const [rpe, setRpe] = useState(7)
  const [loading, setLoading] = useState(false)

  const logWorkout = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert("Please login first!")
      return
    }

    const { error } = await supabase.from('workouts').insert({
      user_id: user.id,
      type: type,
      overall_rpe: rpe,
      intensity_level: rpe > 8 ? 'High' : rpe > 4 ? 'Medium' : 'Low',
      duration_minutes: 60 // Default for now
    })

    setLoading(false)
    if (error) alert(error.message)
    else alert("Session Logged. STAY HARD.")
  }

  return (
    <main className="p-6 bg-slate-900 min-h-screen text-white font-sans">
      <h1 className="text-3xl font-black italic mb-8 border-b-4 border-blue-600 inline-block">LOG SESSION</h1>
      
      <div className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-bold mb-2">WORKOUT TYPE</label>
          <select 
            className="w-full bg-slate-800 p-4 rounded border border-slate-700"
            onChange={(e) => setType(e.target.value)}
          >
            <option>Strength</option>
            <option>Cardio</option>
            <option>Mobility</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">RPE (1-10)</label>
          <input 
            type="range" min="1" max="10" 
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            onChange={(e) => setRpe(parseInt(e.target.value))}
          />
          <div className="text-center font-black text-2xl mt-2">{rpe}</div>
        </div>

        <button 
          onClick={logWorkout}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
        >
          {loading ? 'SYNCING...' : 'FINISH WORKOUT'}
        </button>
      </div>
    </main>
  )
}