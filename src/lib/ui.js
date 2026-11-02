// Mandatory shared classes (Spec §5) — exact strings.
export const INPUT = "w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-all block"
export const CARD = "bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md"
export const FIELD = "flex flex-col gap-2"
export const GRID2 = "grid grid-cols-1 md:grid-cols-2 gap-4"
const B = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white shadow-lg transition-all disabled:opacity-50 active:scale-[.98]"
export const BTN = `${B} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25`
export const BTN_OK = `${B} bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25 text-sm`
export const BTN_GHOST = "inline-flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-3 font-semibold text-slate-100 transition-all active:scale-[.98]"
export const LABEL = "text-sm font-medium text-slate-300"
export const STATUS_STYLE = {
  awaiting_guest: 'bg-slate-500/10 text-slate-300 ring-slate-500/30',
  pending_approval: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  verified: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  rejected: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
}
export const STATUS_DOT = { awaiting_guest: 'bg-slate-400', pending_approval: 'bg-amber-400', verified: 'bg-emerald-400', rejected: 'bg-rose-400' }
