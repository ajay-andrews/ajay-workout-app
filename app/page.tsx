'use client'
import Link from 'next/link'

export default function HubPage() {
  return (
    // min-h-screen ensures full height; p-4/p-6 handles mobile vs desktop spacing
    <div className="bg-black min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        
        {/* Pulsing Header Message (Standardized italic/uppercase for the vibe) */}
        <h1 className="text-center text-slate-100 text-3xl font-black titlecase tracking-tighter mb-10 sm:mb-12 animate-pulse">
          Forge your Future
        </h1>

        <div className="space-y-3">
          {/* Inspiration */}
          <Link 
            href="/inspiration" 
            className="flex items-center justify-center w-full h-24 sm:h-28 bg-slate-900 border border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] group hover:border-blue-500 active:scale-95 transition-all shadow-xl"
          >
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-blue-500 transition-colors">
              Inspiration
            </h2>
          </Link>

          {/* Log Workout */}
          <Link 
            href="/log_workout" 
            className="flex items-center justify-center w-full h-24 sm:h-28 bg-slate-900 border border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] group hover:border-blue-500 active:scale-95 transition-all shadow-xl"
          >
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-blue-500 transition-colors">
              Log Workout
            </h2>
          </Link>

          {/* Previous Workouts */}
          <Link 
            href="/previous_workouts" 
            className="flex items-center justify-center w-full h-24 sm:h-28 bg-slate-900 border border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] group hover:border-blue-500 active:scale-95 transition-all shadow-xl"
          >
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-blue-500 transition-colors">
              Previous Workouts
            </h2>
          </Link>
        </div>

      </div>
    </div>
  )
}