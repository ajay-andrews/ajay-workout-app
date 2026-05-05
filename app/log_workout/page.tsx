'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function LogWorkoutPage() {
  const [view, setView] = useState<'entry' | 'finalize'>('entry')
  const [exercises, setExercises] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExId, setSelectedExId] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [sessionLogs, setSessionLogs] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [currentInputs, setCurrentInputs] = useState({
    sets: '', reps: '', weight: '', duration: ''
  })

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
        .order('category', { ascending: true })
        .order('name', { ascending: true })
      if (data) setExercises(data)
    }
    fetchExercises()

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // --- SORTING & GROUPING LOGIC ---
  const getGroupedData = () => {
    const filtered = exercises.filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const groups: { [key: string]: any[] } = {}

    filtered.forEach(ex => {
      let groupName = ""
      const type = ex.type?.toLowerCase()
      
      if (type === 'weight') {
        groupName = ex.category || 'Other Weights'
      } else if (type === 'cardio') {
        groupName = 'Cardio'
      } else if (type === 'circuit') {
        groupName = 'Circuit'
      } else if (type === 'relax') {
        groupName = 'Relax'
      } else {
        groupName = 'Miscellaneous'
      }

      if (!groups[groupName]) groups[groupName] = []
      groups[groupName].push(ex)
    })

    const allGroups = Object.keys(groups)
    const weightGroups = allGroups.filter(g => 
      !['Cardio', 'Circuit', 'Relax', 'Miscellaneous'].includes(g)
    ).sort()

    // Explicit order: Weight Categories -> Cardio -> Circuit -> Relax
    const finalSortOrder = [...weightGroups, 'Cardio', 'Circuit', 'Relax', 'Miscellaneous']
    
    return finalSortOrder.filter(group => groups[group])
      .map(group => ({
        name: group,
        items: groups[group]
      }))
  }

  const groupedData = getGroupedData()
  const currentEx = exercises.find(ex => ex.id === selectedExId)
  
  const getFields = () => {
    if (!currentEx || !currentEx.tracking_fields) return []
    const raw = currentEx.tracking_fields
    return Object.keys(raw).filter(key => raw[key] === true).map(f => f.toLowerCase())
  }

  const fields = getFields()

  const handleSelect = (ex: any) => {
    setSelectedExId(ex.id)
    setIsOpen(false)
    setSearchTerm('')
  }

  const addToQueue = () => {
    if (!selectedExId) return
    setSessionLogs([...sessionLogs, {
      exercise_id: selectedExId,
      name: currentEx.name,
      ...currentInputs
    }])
    setSelectedExId('')
    setCurrentInputs({ sets: '', reps: '', weight: '', duration: '' })
  }

  const commitWorkout = async () => {
    setIsSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: workout } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        type: workoutMeta.type,
        overall_rpe: parseInt(workoutMeta.rpe),
        duration_minutes: parseInt(workoutMeta.duration_minutes) || 0
      })
      .select().single()

    const logsToInsert = sessionLogs.map(log => ({
      workout_id: workout.id,
      exercise_id: log.exercise_id,
      sets: log.sets ? parseInt(log.sets) : null,
      reps: log.reps ? parseInt(log.reps) : null,
      weight: log.weight ? parseFloat(log.weight) : null,
      duration_minutes: log.duration ? parseInt(log.duration) : null 
    }))

    await supabase.from('workout_logs').insert(logsToInsert)
    window.location.href = '/previous_workouts'
  }

  if (view === 'finalize') {
    return (
      <div className="bg-black min-h-screen w-full flex justify-center p-6 font-sans text-slate-100">
        <div className="w-full max-w-md space-y-10 flex flex-col pt-10">
          <button onClick={() => setView('entry')} className="text-blue-500 font-black text-[10px] uppercase tracking-widest text-left active:scale-95 transition-all">
            ← Back to Logging
          </button>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-center text-blue-500 animate-pulse">Summary</h1>
          <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-[2.5rem] space-y-8 shadow-2xl">
            <div className="grid grid-cols-2 gap-2">
              {['Weight', 'Cardio', 'Circuit', 'Relax'].map(t => (
                <button key={t} onClick={() => setWorkoutMeta({...workoutMeta, type: t})} className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${workoutMeta.type === t ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-black border-slate-800 text-slate-600'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="text-center border-y border-slate-800/50 py-6">
              <label className="text-[10px] font-black uppercase text-slate-600 mb-2 block tracking-widest">Total Duration (Mins)</label>
              <input type="number" value={workoutMeta.duration_minutes} onChange={(e) => setWorkoutMeta({...workoutMeta, duration_minutes: e.target.value})} placeholder="00" className="bg-transparent text-7xl font-black text-center outline-none text-blue-500 w-full" />
            </div>
            <button onClick={commitWorkout} disabled={isSubmitting} className="w-full bg-white text-black font-black py-6 rounded-[2rem] uppercase italic text-2xl tracking-tighter shadow-2xl active:scale-95 transition-all">
              {isSubmitting ? 'Syncing...' : 'End Workout'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen w-full flex justify-center p-4 sm:p-6 font-sans text-slate-100">
      <div className="w-full max-w-md flex flex-col pt-4">
        
        <div className="mb-8">
          <Link href="/" className="text-blue-500 font-black text-[10px] uppercase tracking-widest hover:text-blue-400 inline-block active:scale-95 transition-all">
            ← Back to Hub
          </Link>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Log Workout</h1>
          {sessionLogs.length > 0 && (
            <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase italic">
              {sessionLogs.length} Move{sessionLogs.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="space-y-4">
          
          {/* CUSTOM SEARCHABLE DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full bg-slate-900 border ${isOpen ? 'border-blue-500' : 'border-slate-800'} p-5 rounded-2xl cursor-pointer flex justify-between items-center transition-all shadow-xl`}
            >
              <span className={`font-bold italic uppercase tracking-tight ${currentEx ? 'text-white' : 'text-slate-500'}`}>
                {currentEx ? currentEx.name : '+ SELECT MOVEMENT'}
              </span>
              <span className={`text-blue-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>

            {isOpen && (
              <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 border-b border-slate-800 bg-slate-900/50">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="TYPE TO FILTER..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black border border-slate-800 p-3 rounded-xl text-[10px] font-black tracking-widest text-blue-500 outline-none focus:border-blue-500/50"
                  />
                </div>
                
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {groupedData.length > 0 ? (
                    groupedData.map((group) => (
                      <div key={group.name}>
                        <div className="bg-black/40 px-4 py-2 text-[9px] font-black text-blue-500/60 uppercase tracking-[0.2em] border-y border-slate-800/30">
                          {group.name}
                        </div>
                        {group.items.map(ex => (
                          <div 
                            key={ex.id}
                            onClick={() => handleSelect(ex)}
                            className="p-4 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer text-xs font-black uppercase italic tracking-tighter border-b border-slate-800/20 last:border-0 flex items-center"
                          >
                            {ex.focus && <span className="mr-2 text-blue-400 font-bold">*</span>}
                            {ex.name}
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-[10px] font-black text-slate-600 uppercase text-center italic">No movements found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedExId && (
            <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-[2.5rem] space-y-6 animate-in fade-in slide-in-from-top-4 mt-6 shadow-2xl">
              <div className="grid grid-cols-3 gap-3">
                {fields.includes('sets') && (
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-600 mb-1 block text-center">Sets</label>
                    <input type="number" value={currentInputs.sets} onChange={(e) => setCurrentInputs({...currentInputs, sets: e.target.value})} className="w-full bg-black border border-slate-800 p-4 rounded-xl text-center font-bold text-xl outline-none focus:border-blue-500 text-white" />
                  </div>
                )}
                {fields.includes('reps') && (
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-600 mb-1 block text-center">Reps</label>
                    <input type="number" value={currentInputs.reps} onChange={(e) => setCurrentInputs({...currentInputs, reps: e.target.value})} className="w-full bg-black border border-slate-800 p-4 rounded-xl text-center font-bold text-xl outline-none focus:border-blue-500 text-white" />
                  </div>
                )}
                {fields.includes('weight') && (
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-600 mb-1 block text-center">Lbs</label>
                    <input type="number" value={currentInputs.weight} onChange={(e) => setCurrentInputs({...currentInputs, weight: e.target.value})} className="w-full bg-black border border-slate-800 p-4 rounded-xl text-center font-bold text-xl outline-none focus:border-blue-500 text-white" />
                  </div>
                )}
              </div>
              {fields.includes('duration') && (
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-600 mb-1 block text-center tracking-widest">Duration (Mins)</label>
                  <input type="number" value={currentInputs.duration} onChange={(e) => setCurrentInputs({...currentInputs, duration: e.target.value})} className="w-full bg-black border border-slate-800 p-4 rounded-xl text-center font-mono font-bold text-3xl text-blue-500 outline-none focus:border-blue-500" />
                </div>
              )}
              <button onClick={addToQueue} className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase italic text-xs tracking-widest active:scale-95 transition-all shadow-xl">
                Save Exercise
              </button>
            </div>
          )}

          {sessionLogs.length > 0 && (
            <div className="pt-10 space-y-4 pb-20">
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
              <button onClick={() => setView('finalize')} className="w-full mt-6 bg-blue-600 text-white font-black py-6 rounded-[2rem] uppercase italic tracking-tighter text-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                Finish Workout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}