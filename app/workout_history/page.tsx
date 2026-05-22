  'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function WorkoutHistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [oldestWorkoutDate, setOldestWorkoutDate] = useState<Date | null>(null)
  
  // Maps YYYY-MM-DD strings to the detailed workout object
  const [workoutMap, setWorkoutMap] = useState<Record<string, any>>({})
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)

  useEffect(() => {
    fetchEntireHistory()
  }, [])

  const fetchEntireHistory = async () => {
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
      .order('created_at', { ascending: true })

    if (error) console.error("Supabase Error:", error)
    
    if (data && data.length > 0) {
      setOldestWorkoutDate(new Date(data[0].created_at))

      const mapping: Record<string, any> = {}
      data.forEach(w => {
        const localDateKey = new Date(w.created_at).toLocaleDateString('en-CA')
        mapping[localDateKey] = w
      })
      setWorkoutMap(mapping)
    }
    setLoading(false)
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonthIndex = new Date(year, month, 1).getDay()
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()

  const gridCells: (Date | null)[] = []
  for (let i = 0; i < firstDayOfMonthIndex; i++) gridCells.push(null)
  for (let day = 1; day <= totalDaysInMonth; day++) gridCells.push(new Date(year, month, day))

  const handlePrevMonth = () => {
    setSelectedDayKey(null)
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setSelectedDayKey(null)
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const isLeftDisabled = () => {
    if (!oldestWorkoutDate) return true
    return year <= oldestWorkoutDate.getFullYear() && month <= oldestWorkoutDate.getMonth()
  }

  const isRightDisabled = () => {
    const today = new Date()
    return year >= today.getFullYear() && month >= today.getMonth()
  }

  const getCellStyles = (dateString: string, isToday: boolean, workout: any, isSelected: boolean) => {
    if (isSelected) return 'bg-white text-black border-white shadow-xl scale-95'
    
    if (!workout) {
      if (isToday) return 'border border-blue-500 bg-blue-950/20 text-white'
      return 'border border-slate-900/60 bg-slate-950/40 text-slate-400 hover:border-slate-800'
    }

    switch (workout.type?.toLowerCase()) {
      case 'weight':
        return 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/10'
      case 'cardio':
        return 'bg-orange-600 border-orange-400 text-white shadow-lg shadow-orange-500/10'
      case 'relax':
        return 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
      case 'circuit':
        return 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
      default:
        return 'bg-slate-700 border-slate-500 text-white'
    }
  }

  const handleDayClick = (day: Date) => {
    const dateString = day.toLocaleDateString('en-CA')
    const hasWorkout = workoutMap[dateString]

    if (hasWorkout) {
      setSelectedDayKey(selectedDayKey === dateString ? null : dateString)
    } else {
      router.push(`/log_workout?date=${dateString}`)
    }
  }

  const activeWorkoutDetails = selectedDayKey ? workoutMap[selectedDayKey] : null

  return (
    <div className="bg-black min-h-screen w-full flex justify-center text-slate-100 font-sans">
      <main className="w-full max-w-md p-6 flex flex-col min-h-screen">
        
        <div className="flex justify-between items-center mt-4 mb-8">
          <Link href="/" className="text-blue-500 font-black text-[10px] uppercase tracking-widest hover:text-blue-400 transition-colors">
            ← Hub
          </Link>
          <h1 className="text-xl font-black italic uppercase tracking-tighter">Workout History</h1>
          <div className="w-10" />
        </div>

        {loading ? (
          <div className="flex-grow flex items-center justify-center py-20">
            <p className="text-slate-500 font-mono text-[10px] animate-pulse uppercase tracking-[0.4em]">Accessing Archive...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-900/10 border border-slate-900/80 rounded-[2rem] p-6 shadow-2xl">
              
              <div className="flex justify-between items-center mb-6 px-1">
                <span className="text-xl font-black italic uppercase text-blue-500 tracking-tight">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-2">
                  <button disabled={isLeftDisabled()} onClick={handlePrevMonth} className="w-8 h-8 bg-black border border-slate-800 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 disabled:opacity-20 active:scale-90 transition-all">◀</button>
                  <button disabled={isRightDisabled()} onClick={handleNextMonth} className="w-8 h-8 bg-black border border-slate-800 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 disabled:opacity-20 active:scale-90 transition-all">▶</button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center mb-3">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <span key={i} className="text-[10px] font-black text-slate-600 tracking-widest">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {gridCells.map((day, cellIndex) => {
                  if (day === null) return <div key={`empty-${cellIndex}`} className="aspect-square opacity-0" />

                  const dateString = day.toLocaleDateString('en-CA')
                  const workout = workoutMap[dateString]
                  const isToday = new Date().toLocaleDateString('en-CA') === dateString
                  const isSelected = selectedDayKey === dateString
                  const styleClasses = getCellStyles(dateString, isToday, workout, isSelected)

                  return (
                    <button
                      key={dateString}
                      onClick={() => handleDayClick(day)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 group ${styleClasses}`}
                    >
                      <span className="text-xs font-black tracking-tighter">{day.getDate()}</span>
                      {workout && !isSelected && (
                        <span className="absolute bottom-1 text-[7px] font-mono font-black opacity-60">
                          R{workout.overall_rpe}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-8 pt-5 border-t border-slate-900/60 flex flex-wrap justify-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500">
                  <div className="w-2 h-2 rounded bg-blue-600 border border-blue-400/30" /> Weights
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500">
                  <div className="w-2 h-2 rounded bg-orange-600 border border-orange-400/30" /> Cardio
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500">
                  <div className="w-2 h-2 rounded bg-emerald-600 border border-emerald-400/30" /> Relax
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500">
                  <div className="w-2 h-2 rounded bg-indigo-600 border border-indigo-400/30" /> Circuit
                </div>
              </div>

            </div>

            {/* DETAILS DRAWER WITH TIME AND DURATION */}
            {activeWorkoutDetails && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="flex justify-between items-start border-b border-slate-800/60 pb-4 mb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block leading-none">
                      {new Date(activeWorkoutDetails.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    
                    {/* Time & Duration row */}
                    <span className="text-[9px] font-mono font-black text-slate-600 uppercase mt-1 block">
                      @ {new Date(activeWorkoutDetails.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {activeWorkoutDetails.duration_minutes > 0 && ` • ${activeWorkoutDetails.duration_minutes} Mins`}
                    </span>
                    
                    <h3 className="text-2xl font-black italic uppercase text-blue-500 tracking-tight leading-none mt-2">
                      {activeWorkoutDetails.type}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Intensity</span>
                    <p className="text-xl font-black italic text-slate-200">RPE {activeWorkoutDetails.overall_rpe}</p>
                  </div>
                </div>

                <ul className="space-y-3">
                  {!activeWorkoutDetails.workout_logs || activeWorkoutDetails.workout_logs.length === 0 ? (
                    <p className="text-[10px] text-slate-600 font-bold uppercase italic text-center py-2">No Movement Records Found</p>
                  ) : (
                    activeWorkoutDetails.workout_logs.map((log: any) => (
                      <li key={log.id} className="flex justify-between items-center bg-black/30 border border-slate-900 p-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">{log.exercises?.name}</span>
                        <span className="text-[10px] font-mono text-blue-500 font-black">
                          {log.sets > 0 && `${log.sets}x${log.reps}`}
                          {log.weight > 0 && ` @ ${log.weight}LB`}
                          {log.duration_minutes > 0 && ` • ${log.duration_minutes}M`}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  )
}