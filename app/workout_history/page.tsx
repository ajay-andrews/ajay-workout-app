'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function WorkoutHistoryPageContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'calendar' | 'stats'>('calendar')
  
  const [allWorkouts, setAllWorkouts] = useState<any[]>([])
  const [workoutMap, setWorkoutMap] = useState<Record<string, any>>({})
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)

  // Track Focus Movements data
  const [focusExercises, setFocusExercises] = useState<any[]>([])
  // Track which specific rows are currently toggled open
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchEntireHistory()
  }, [])

  const fetchEntireHistory = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return; }

    const { data: workoutsData, error: wError } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_logs (
          id,
          sets,
          reps,
          weight,
          duration_minutes,
          exercise_id,
          exercises (
            id,
            name,
            type,
            focus
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (wError) {
      console.error("Supabase Database Retrieval Error:", wError)
      setLoading(false)
      return;
    }
    
    if (workoutsData) {
      setAllWorkouts(workoutsData)

      // Calendar mapping setup
      const mapping: Record<string, any> = {}
      const chronological = [...workoutsData].reverse()
      chronological.forEach(w => {
        const localDateKey = new Date(w.created_at).toLocaleDateString('en-CA')
        mapping[localDateKey] = w
      })
      setWorkoutMap(mapping)

      // Pre-compile and fetch all data directly into each movement row structure
      const trackingMap: Record<string, any> = {}
      
      workoutsData.forEach((workout: any) => {
        if (!workout.workout_logs) return
        
        workout.workout_logs.forEach((log: any) => {
          const ex = log.exercises
          if (!ex) return
          
          if (ex.focus === true) {
            const normalizedName = (ex.name || 'Unnamed Movement').trim()
            if (!normalizedName) return

            if (!trackingMap[normalizedName]) {
              trackingMap[normalizedName] = {
                name: normalizedName,
                lastDate: new Date(workout.created_at),
                lastWeight: log.weight || 0,
                history: []
              }
            }

            trackingMap[normalizedName].history.push({
              id: log.id,
              date: workout.created_at,
              sets: log.sets,
              reps: log.reps,
              weight: log.weight,
              duration_minutes: log.duration_minutes
            })
          }
        })
      })
      
      // Sort each compiled history array from newest to oldest
      Object.keys(trackingMap).forEach(key => {
        trackingMap[key].history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      })

      // Sort focus list by most recently performed movement
      const sortedStatsList = Object.values(trackingMap).sort((a: any, b: any) => 
        b.lastDate.getTime() - a.lastDate.getTime()
      )
      
      setFocusExercises(sortedStatsList)
    }

    setLoading(false)
  }

  const toggleRowExpand = (rowName: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowName]: !prev[rowName]
    }))
  }

  const getGridCells = () => {
    const cells: Date[] = []
    const viewingSunday = new Date(currentDate)
    viewingSunday.setDate(currentDate.getDate() - currentDate.getDay())
    
    const gridStart = new Date(viewingSunday)
    gridStart.setDate(viewingSunday.getDate() - 28)

    for (let i = 0; i < 35; i++) {
      const nextDay = new Date(gridStart)
      nextDay.setDate(gridStart.getDate() + i)
      cells.push(nextDay)
    }
    return cells
  }

  const gridCells = getGridCells()

  const getCalendarHeaderLabel = () => {
    if (gridCells.length === 0) return ''
    const firstMonth = gridCells[0].toLocaleDateString('en-US', { month: 'short' })
    const lastMonth = gridCells[gridCells.length - 1].toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    return firstMonth === gridCells[gridCells.length - 1].toLocaleDateString('en-US', { month: 'short' })
      ? gridCells[gridCells.length - 1].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : `${firstMonth} - ${lastMonth}`
  }

  const handlePrevWeek = () => {
    setSelectedDayKey(null)
    const updated = new Date(currentDate)
    updated.setDate(currentDate.getDate() - 7)
    setCurrentDate(updated)
  }

  const handleNextWeek = () => {
    setSelectedDayKey(null)
    const updated = new Date(currentDate)
    updated.setDate(currentDate.getDate() + 7)
    setCurrentDate(updated)
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

  const getDaysAgoText = (targetDate: Date) => {
    const today = new Date()
    today.setHours(0,0,0,0)
    const target = new Date(targetDate)
    target.setHours(0,0,0,0)
    
    const diffTime = today.getTime() - target.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24 ?? 1))
    
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  const activeWorkoutDetails = selectedDayKey ? workoutMap[selectedDayKey] : null

  return (
    <div className="bg-black min-h-screen w-full flex justify-center text-slate-100 font-sans">
      <main className="w-full max-w-md p-4 sm:p-6 flex flex-col min-h-screen">
        
        {/* LINE-STRATIFIED HEADER LAYOUT */}
        <div className="flex flex-col gap-4 mt-4 mb-6">
          {/* Line 1: Hub Back Button Only */}
          <div>
            <Link href="/" className="text-blue-500 font-black text-[10px] uppercase tracking-widest hover:text-blue-400 transition-colors inline-block">
              ← BACK TO HUB
            </Link>
          </div>
          
          {/* Line 2: Workout History Heading Title */}
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter">WORKOUT HISTORY</h1>
          </div>
          
          {/* Line 3: Navigation Segmented Tabs */}
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 self-start">
            {(['calendar', 'stats'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded text-[8px] font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Line 4+: Content Data Panels */}
        {loading ? (
          <div className="flex-grow flex items-center justify-center py-20">
            <p className="text-slate-500 font-mono text-[10px] animate-pulse uppercase tracking-[0.4em]">Accessing Archive...</p>
          </div>
        ) : activeTab === 'calendar' ? (
          /* CALENDAR TAB */
          <div className="space-y-4">
            <div className="bg-slate-900/10 border border-slate-900 rounded-[2rem] p-6 shadow-2xl">
              
              <div className="flex justify-between items-center mb-6 px-1">
                <span className="text-xs font-black italic uppercase text-blue-500 tracking-tight">
                  {getCalendarHeaderLabel()}
                </span>
                <div className="flex gap-2">
                  <button onClick={handlePrevWeek} className="w-8 h-8 bg-black border border-slate-800 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 active:scale-90 transition-all">◀</button>
                  <button onClick={handleNextWeek} className="w-8 h-8 bg-black border border-slate-800 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 active:scale-90 transition-all">▶</button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center mb-3">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <span key={i} className="text-[10px] font-black text-slate-600 tracking-widest">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {gridCells.map((day) => {
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

            {/* EXPANDED BOTTOM CALENDAR DRAWER */}
            {activeWorkoutDetails && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="flex justify-between items-start border-b border-slate-800/60 pb-4 mb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block leading-none">
                      {new Date(activeWorkoutDetails.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
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
        ) : (
          /* FOCUS MOVEMENTS TAB */
          <div className="bg-slate-900/10 border border-slate-900 rounded-[2rem] p-6 shadow-2xl">
            <h2 className="text-base font-black italic uppercase text-blue-500 tracking-tight mb-4">Focus Movements</h2>
            
            {focusExercises.length === 0 ? (
              <p className="text-[10px] text-slate-600 font-black uppercase italic text-center py-8">No matching tracked parameters found</p>
            ) : (
              <div className="space-y-3">
                {focusExercises.map((ex) => {
                  const isExpanded = !!expandedRows[ex.name]

                  return (
                    <div 
                      key={ex.name} 
                      className="border-b border-slate-900/60 pb-3 last:border-none last:pb-0"
                    >
                      {/* HEADER ROW */}
                      <div 
                        onClick={() => toggleRowExpand(ex.name)}
                        className="flex justify-between items-center cursor-pointer py-1 hover:text-blue-400 group transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black font-mono text-blue-500 transition-transform duration-150 block ${isExpanded ? 'rotate-90' : ''}`}>
                            ▶
                          </span>
                          <span className="text-xs font-bold uppercase tracking-tight text-slate-300 group-hover:text-blue-400">
                            {ex.name}
                          </span>
                        </div>
                        
                        <div className="text-right flex items-center gap-4">
                          <div className="text-[10px] text-slate-400 font-medium">
                            {ex.lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            <span className="text-slate-600 text-[8px] block font-mono text-right">({getDaysAgoText(ex.lastDate)})</span>
                          </div>
                          <span className="text-xs font-black font-mono text-blue-500 min-w-[50px] text-right">
                            {ex.lastWeight > 0 ? `${ex.lastWeight} lb` : '—'}
                          </span>
                        </div>
                      </div>

                      {/* INLINE EXPANDED HISTORICAL DROPDOWN LIST */}
                      {isExpanded && (
                        <div className="mt-2 pl-5 pr-1 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                          {!ex.history || ex.history.length === 0 ? (
                            <p className="text-[9px] text-slate-700 italic uppercase">No logs discovered</p>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
                              {ex.history.map((log: any) => (
                                <div 
                                  key={log.id} 
                                  className="flex justify-between items-center bg-black/40 border border-slate-900/80 px-3 py-2 rounded-xl"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">
                                      {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <span className="text-[7px] font-mono text-slate-600 uppercase mt-0.5">
                                      ({getDaysAgoText(new Date(log.date))})
                                    </span>
                                  </div>
                                  
                                  <div className="text-right">
                                    <span className="text-[11px] font-mono font-black text-blue-500">
                                      {log.sets > 0 ? `${log.sets}x${log.reps ?? 0}` : ''}
                                      {log.duration_minutes > 0 ? `${log.duration_minutes} mins` : ''}
                                    </span>
                                    {log.weight > 0 && (
                                      <span className="text-[9px] font-mono font-black text-slate-400 ml-2">
                                        @{log.weight}LB
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function WorkoutHistoryPage() {
  return (
    <Suspense fallback={
      <div className="bg-black min-h-screen p-6 text-slate-500 font-black italic uppercase flex items-center justify-center">
        Loading Archive Database...
      </div>
    }>
      <WorkoutHistoryPageContent />
    </Suspense>
  )
}