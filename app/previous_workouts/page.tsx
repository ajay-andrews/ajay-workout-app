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
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_logs (
          id,
          sets,
          reps,
          weight,
          duration_minutes,
          exercises (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) console.error("Supabase Error:", error)
    if (data) setWorkouts(data)
    setLoading(false)
  }

  return (
    <div className="bg-black min-h-screen w-full flex justify-center text-slate-100 font-sans">
      <main className="w-full max-w-md p-6 flex flex-col min-h-screen">
        <Link href="/" className="text-blue-500 font-bold text-xs mb-12 block uppercase tracking-tighter mt-4 hover:text-blue-400 transition-colors">
          ← Back to Hub
        </Link>

        <h1 className="text-3xl font-black italic mb-10 border-b border-slate-800 pb-2 uppercase tracking-tighter">
          Foundation
        </h1>

        {loading ? (
          <div className="flex-grow flex items-center justify-center py-20">
            <p className="text-slate-500 font-mono text-[10px] animate-pulse uppercase tracking-[0.4em]">Accessing Archive...</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {workouts.map((w) => (
              <div key={w.id} className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40">
                <button 
                  onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-800/30 transition-all"
                >
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                      {/* Added weekday: 'short' here */}
                      {new Date(w.created_at).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <h2 className="text-xl font-black italic uppercase text-blue-600 tracking-tight">{w.type}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-600 uppercase italic">RPE</p>
                    <p className={`text-xl font-black ${w.overall_rpe >= 8 ? 'text-red-500' : 'text-slate-100'}`}>
                      {w.overall_rpe}
                    </p>
                  </div>
                </button>

                {expandedId === w.id && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-800 bg-black/60">
                    <ul className="space-y-4 mt-4">
                      {(!w.workout_logs || w.workout_logs.length === 0) ? (
                        <li className="text-[10px] text-slate-600 uppercase tracking-widest italic text-center py-4">
                          No Movement Data Captured
                        </li>
                      ) : (
                        w.workout_logs.map((log: any) => (
                          <li key={log.id} className="flex justify-between items-center border-b border-slate-800/50 pb-2 last:border-0">
                            <span className="text-sm font-bold text-slate-300">
                              {log.exercises?.name || "Movement"}
                            </span>
                            <span className="text-[11px] font-mono text-blue-500 font-bold">
                              {log.sets > 0 && `${log.sets}x${log.reps}`}
                              {log.weight > 0 && ` @ ${log.weight}LB`}
                              {log.duration_minutes > 0 && `${log.duration_minutes}M`}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}