'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function LogWorkoutPage() {
  const [view, setView] = useState<'entry' | 'finalize'>('entry')
  const [exercises, setExercises] = useState<any[]>([])
  const [selectedExId, setSelectedExId] = useState('')
  const [sessionLogs, setSessionLogs] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Individual exercise input state
  const [currentInputs, setCurrentInputs] = useState({
    sets: '', reps: '', weight: '', duration: ''
  })

  // Final workout-level metadata state
  const [workoutMeta, setWorkoutMeta] = useState({
    type: 'Weight',
    rpe: '5',
    duration_minutes: ''
  })

  useEffect(() => {
    const fetchExercises = async () => {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true })
      if (data) setExercises(data)
    }
    fetchExercises()
  }, [])

  const currentEx = exercises.find(ex => ex.id === selectedExId)
  
  // Logic to detect which fields to show based on your specific JSONB structure
  const getFields = () => {
    if (!currentEx || !currentEx.tracking_fields) return []
    
    const raw = currentEx.tracking_fields
    
    // Extract keys where the value is true (e.g., {reps: true} -> "reps")
    return Object.keys(raw).filter(key => raw[key] === true).map(f => f.toLowerCase())
  }

  const fields = getFields()

  const addToQueue = () => {
    if (!selectedExId) return
    setSessionLogs([...sessionLogs, {
      exercise_id: selectedExId,
      name: currentEx.name,
      ...currentInputs
    }])
    // Reset inputs for the next movement
    setSelectedExId('')
    setCurrentInputs({ sets: '', reps: '', weight: '', duration: '' })
  }

  const commitWorkout = async () => {
    setIsSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Create the parent Workout record
    const { data: workout, error: wError } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        type: workoutMeta.type,
        overall_rpe: parseInt(workoutMeta.rpe),
        duration_minutes: parseInt(workoutMeta.duration_minutes) || 0
      })
      .select().single()

    if (wError) { 
      console.error("Workout insert failed:", wError)
      setIsSubmitting(false)
      return 
    }

    // 2. Prepare and insert all exercise logs
    const logsToInsert = sessionLogs.map(log => ({
      workout_id: workout.id,
      exercise_id: log.exercise_id,
      sets: log.sets ? parseInt(log.sets) : null,
      reps: log.reps ? parseInt(log.reps) : null,
      weight: log.weight ? parseFloat(log.weight) : null,
      duration_minutes: log.duration ? parseInt(log.duration) : null // Matches your DB change
    }))

    const { error: lError } = await supabase.from('workout_logs').insert(logsToInsert)

    if (!lError) {
      window.location.href = '/previous_workouts'
    } else {
      console.error("Logs insert failed:", lError)
      setIsSubmitting(false)
    }
  }

  // --- FINAL SUMMARY VIEW ---
  if (view === 'finalize') {
    return (
      <div className="bg-black min-h-screen w-full flex justify-center p-6 font-sans text-slate-100">
        <div className="w-full max-w-md space-y-10 flex flex-col justify-center">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-center animate-pulse text-blue-500">Summary</h1>
          
          <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-[2.5rem] space-y-8 shadow-2xl">
            <div className="grid grid-cols-2 gap-2">
              {['Weight', 'Cardio', 'Circuit', 'Relax'].map(t => (
                <button 
                  key={t}
                  onClick={() => setWorkoutMeta({...workoutMeta, type: t})}
                  className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${workoutMeta.type === t ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-black border-slate-800 text-slate-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="text-center">
              <label className="text-[10px] font-black uppercase text-slate-600 mb-2 block tracking-widest">Total Duration (Mins)</label>
              <input 
                type="number" 
                value={workoutMeta.duration_minutes}
                onChange={(e) => setWorkoutMeta({...workoutMeta, duration_minutes: e.target.value})}
                placeholder="00"
                className="bg-transparent text-7xl font-black text-center outline-none text-blue-500 w-full"
              />
            </div>

            <div className="px-4">
              <label className="text-[10px] font-black uppercase text-slate-600 mb-4 block text-center tracking-widest">RPE: {workoutMeta.rpe}</label>
              <input 
                type="range" min="1" max="10" 
                value={workoutMeta.rpe}
                onChange={(e) => setWorkoutMeta({...workoutMeta, rpe: e.target.value})}
                className="w-full accent-blue-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button 
              onClick={commitWorkout}
              disabled={isSubmitting}
              className="w-full bg-white text-black font-black py-6 rounded-[2rem] uppercase italic text-2xl tracking-tighter shadow-2xl active:scale-95 transition-all"
            >
              {isSubmitting ? 'Syncing...' : 'End Workout'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- LOGGING VIEW ---
  return (
    <div className="bg-black min-h-screen w-full flex justify-center p-4 sm:p-6 font-sans text-slate-100">
      <div className="w-full max-w-md">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Log Workout</h1>
          {sessionLogs.length > 0 && (
            <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase italic">
              {sessionLogs.length} Move{sessionLogs.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <select 
            value={selectedExId}
            onChange={(e) => setSelectedExId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 p-5 rounded-2xl text-slate-100 font-bold italic appearance-none outline-none focus:border-blue-500"
          >
            <option value="">+ SELECT MOVEMENT</option>
            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>

          {selectedExId && (
            <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-[2.5rem] space-y-6 animate-in fade-in slide-in-from-top-4">
              <div className="grid grid-cols-3 gap-3">
                {fields.includes('sets') && (
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-600 mb-1 block text-center">Sets</label>
                    <input type="number" value={currentInputs.sets} onChange={(e) => setCurrentInputs({...currentInputs, sets: e.target.value})} className="w-full bg-black border border-slate-800 p-4 rounded-xl text-center font-bold text-xl outline-none focus:border-blue-500" />
                  </div>
                )}
                {fields.includes('reps') && (
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-600 mb-1 block text-center">Reps</label>
                    <input type="number" value={currentInputs.reps} onChange={(e) => setCurrentInputs({...currentInputs, reps: e.target.value})} className="w-full bg-black border border-slate-800 p-4 rounded-xl text-center font-bold text-xl outline-none focus:border-blue-500" />
                  </div>
                )}
                {fields.includes('weight') && (
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-600 mb-1 block text-center">Lbs</label>
                    <input type="number" value={currentInputs.weight} onChange={(e) => setCurrentInputs({...currentInputs, weight: e.target.value})} className="w-full bg-black border border-slate-800 p-4 rounded-xl text-center font-bold text-xl outline-none focus:border-blue-500" />
                  </div>
                )}
              </div>

              {fields.includes('duration') && (
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-600 mb-1 block text-center tracking-widest">Duration (Mins)</label>
                  <input type="number" value={currentInputs.duration} onChange={(e) => setCurrentInputs({...currentInputs, duration: e.target.value})} className="w-full bg-black border border-slate-800 p-4 rounded-xl text-center font-mono font-bold text-3xl text-blue-500 outline-none focus:border-blue-500" />
                </div>
              )}

              <button 
                onClick={addToQueue} 
                className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase italic text-xs tracking-widest active:scale-95 transition-all shadow-xl"
              >
                Save Exercise
              </button>
            </div>
          )}

          {/* Progress list showing what's added so far */}
          {sessionLogs.length > 0 && (
            <div className="pt-10 space-y-4">
              <div className="space-y-2">
                {sessionLogs.map((log, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-900/10 border-l-2 border-blue-500 p-4 rounded-r-xl">
                    <span className="font-black italic uppercase text-sm text-slate-300">{log.name}</span>
                    <span className="text-[10px] font-mono text-slate-600">
                      {log.sets && `${log.sets}x${log.reps}`} {log.weight && `@${log.weight}lb`} {log.duration && `${log.duration}m`}
                    </span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setView('finalize')} 
                className="w-full mt-6 bg-blue-600 text-white font-black py-6 rounded-[2rem] uppercase italic tracking-tighter text-2xl shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
              >
                Finish Workout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}