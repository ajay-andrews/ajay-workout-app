'use client'
import Link from 'next/link'

export default function HubPage() {
  return (
    <div className="bg-black min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        
        {/* Pulsing Header Message */}
        <h1 className="text-center text-slate-100 text-3xl font-black italic uppercase tracking-tighter mb-8 sm:mb-10 animate-pulse">
          Forge your Future
        </h1>

        <div className="space-y-3">
          {/* 1. Inspiration (Full Width) */}
          <Link 
            href="/inspiration" 
            className="flex items-center justify-center w-full h-20 bg-slate-900 border border-slate-800 rounded-[1.5rem] group hover:border-blue-500 active:scale-95 transition-all shadow-xl"
          >
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-blue-500 transition-colors">
              Inspiration
            </h2>
          </Link>

          {/* 2. Weight (Full Width) */}
          <Link 
            href="/weight" 
            className="flex items-center justify-center w-full h-20 bg-slate-900 border border-slate-800 rounded-[1.5rem] group hover:border-blue-500 active:scale-95 transition-all shadow-xl"
          >
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-blue-500 transition-colors">
              Weight
            </h2>
          </Link>

          {/* 3. Nutrition Pair (Side-by-Side) */}
          <div className="flex gap-3">
            <Link 
              href="/log_nutrition" 
              className="flex-1 flex items-center justify-center h-24 bg-slate-900 border border-slate-800 rounded-[1.5rem] group hover:border-blue-500 active:scale-95 transition-all shadow-xl text-center px-2"
            >
              <h2 className="text-sm font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-blue-500 transition-colors leading-tight">
                Log<br/>Nutrition
              </h2>
            </Link>
            <Link 
              href="/nutrition_history" 
              className="flex-1 flex items-center justify-center h-24 bg-slate-900 border border-slate-800 rounded-[1.5rem] group hover:border-blue-500 active:scale-95 transition-all shadow-xl text-center px-2"
            >
              <h2 className="text-sm font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-blue-500 transition-colors leading-tight">
                Nutrition<br/>History
              </h2>
            </Link>
          </div>

          {/* 4. Workout Pair (Side-by-Side) */}
          <div className="flex gap-3">
            <Link 
              href="/log_workout" 
              className="flex-1 flex items-center justify-center h-24 bg-slate-900 border border-slate-800 rounded-[1.5rem] group hover:border-blue-500 active:scale-95 transition-all shadow-xl text-center px-2"
            >
              <h2 className="text-sm font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-blue-500 transition-colors leading-tight">
                Log<br/>Workout
              </h2>
            </Link>
            <Link 
              href="/workout_history" 
              className="flex-1 flex items-center justify-center h-24 bg-slate-900 border border-slate-800 rounded-[1.5rem] group hover:border-blue-500 active:scale-95 transition-all shadow-xl text-center px-2"
            >
              <h2 className="text-sm font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-blue-500 transition-colors leading-tight">
                Workout<br/>History
              </h2>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}