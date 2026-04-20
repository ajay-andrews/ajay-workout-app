'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function FoundationPage() {
  const [history, setHistory] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('workouts')
        .select(`*, workout_logs(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (data) setHistory(data)
    }
    fetchHistory()
  }, [])

  return (
    <main className="p-6 bg-black min-h-screen text-slate-100 max-w-md mx-auto">
      <Link href="/" className="text-blue-500 font-bold text-xs mb-8 block uppercase tracking-tighter">← Back to Hub</Link>
      <h1 className="text-3xl font-black italic mb-10 border-b border-slate-800 pb-2">FOUNDATION</h1>

      <div className="space-y-4">
        {history.map((workout) => (
          <div key={workout.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <button 
              onClick={() => setExpandedId(expandedId === workout.id ? null : workout.id)}
              className="w-full p-5 flex justify-between items-center"
            >
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  {new Date(workout.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="font-black italic text-lg uppercase">{workout.type}</p>
              </div>
              <div className={`font-black ${workout.overall_rpe >= 8 ? 'text-red-500' : 'text-blue-500'}`}>
                RPE {workout.overall_rpe}
              </div>
            </button>
            
            {expandedId === workout.id && (
              <div className="px-5 pb-5 bg-black/40 border-t border-slate-800 pt-4 space-y-2">
                {workout.workout_logs?.map((log: any, i: number) => (
                  <div key={i} className="text-xs flex justify-between border-b border-slate-800/50 pb-1">
                    <span className="text-slate-400">Exercise {i+1}</span>
                    <span className="font-mono">{log.sets}x{log.reps} @ {log.weight}kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}