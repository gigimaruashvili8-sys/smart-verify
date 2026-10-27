// Mandatory shared classes (Spec §5) — exact strings.
export const INPUT = "w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-all block"
export const CARD = "bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md"
export const FIELD = "flex flex-col gap-2"
export const GRID2 = "grid grid-cols-1 md:grid-cols-2 gap-4"
export const BTN = "bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl px-4 py-3 font-semibold text-white transition-all"
export const BTN_GHOST = "bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-3 font-semibold text-white transition-all"
export const STATUS_STYLE = {
  awaiting_guest: 'bg-slate-700/60 text-slate-300',
  pending_approval: 'bg-amber-500/15 text-amber-300',
  verified: 'bg-emerald-500/15 text-emerald-300',
  rejected: 'bg-rose-500/15 text-rose-300',
}
