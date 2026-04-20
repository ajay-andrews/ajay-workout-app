'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function FoundationPage() {
  const [workouts, setWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // This query now joins the exercise table to get the names
    const { data } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_logs (
          *,
          exercises (name)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setWorkouts(data)
    setLoading(false)
  }

  return (
    <main className="p-6 bg-black min-h-screen text-slate-100 max-w-md mx-auto">
      <Link href="/" className="text-blue-500 font-bold text-xs mb-12 block uppercase tracking-tighter">
        ← Back to Hub
      </Link>

      <h1 className="text-3xl font-black italic mb-10 border-b border-slate-800 pb-2 uppercase tracking-tighter">
        Foundation
      </h1>

      {loading ? (
        <p className="text-slate-500 font-mono text-xs animate-pulse uppercase tracking-widest text-center">Reading Logs...</p>
      ) : (
        <div className="space-y-4">
          {workouts.map((w) => (
            <div key={w.id} className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/50">
              <button 
                onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                className="w-full p-6 text-left flex justify-between items-center"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <h2 className="text-xl font-black italic uppercase text-blue-500">{w.type}</h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">RPE</p>
                  <p className={`text-xl font-black ${w.overall_rpe >= 8 ? 'text-red-500' : 'text-slate-100'}`}>
                    {w.overall_rpe}
                  </p>
                </div>
              </button>

              {expandedId === w.id && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-800 bg-black/40">
                  <ul className="space-y-3">
                    {w.workout_logs.map((log: any) => (
                      <li key={log.id} className="flex justify-between items-center border-b border-slate-800/50 pb-2 last:border-0">
                        <span className="text-sm font-bold text-slate-300">
                          {log.exercises?.name || 'Unknown Exercise'}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {log.sets && `${log.sets}x${log.reps}`} 
                          {log.weight > 0 && ` @ ${log.weight}lb`}
                          {log.duration_seconds && `${Math.floor(log.duration_seconds / 60)}m`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}