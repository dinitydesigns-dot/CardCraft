import { DEMO_MAX_TRIES } from '../types';
import { Zap, CheckCircle2, LogIn, Mail, MessageCircle, Star, X } from 'lucide-react';

interface Props {
  onSignIn: () => void;   // go to sign in page
  onClose: () => void;    // dismiss and stay in (expired) demo
}

const PERKS = [
  'Unlimited downloads — PNG & PDF',
  'Your own dedicated template',
  'All 5 built-in + custom templates',
  'Upload your brand logo',
  'Badge stickers & QR code',
  'Multiple card sizes',
  'Share links & PDF exports',
  'Password-protected access',
];

export function DemoExpiredModal({ onSignIn, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Dismiss button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top gradient header */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-6 pt-8 pb-10 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />

          {/* Icon */}
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4 ring-2 ring-white/30 shadow-lg">
            <Zap className="w-8 h-8 text-amber-300" />
          </div>

          <h2 className="text-2xl font-black text-white mb-1">
            You've used all {DEMO_MAX_TRIES} free tries!
          </h2>
          <p className="text-purple-200 text-sm leading-relaxed">
            Your demo session has ended. Sign in to unlock full access and download unlimited product cards.
          </p>

          {/* Stars */}
          <div className="flex items-center justify-center gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-300 text-amber-300" />
            ))}
            <span className="text-white/80 text-xs ml-1 font-medium">Loved by 500+ small businesses</span>
          </div>
        </div>

        {/* Perks list */}
        <div className="px-6 pt-5 pb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">What you'll get with full access</p>
          <div className="grid grid-cols-1 gap-2">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span className="text-sm text-gray-700">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="px-6 pb-6 pt-3 space-y-2.5">
          <button
            onClick={onSignIn}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-purple-500/25 transition-all"
          >
            <LogIn className="w-5 h-5" />
            Sign In to Continue
          </button>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="mailto:hello@cardcraft.app"
              className="flex items-center justify-center gap-1.5 py-2.5 border-2 border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-gray-600 hover:text-violet-700 rounded-xl text-sm font-semibold transition-all"
            >
              <Mail className="w-4 h-4" />
              Email Us
            </a>
            <a
              href="https://wa.me/2349167842902"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 bg-green-50 hover:bg-green-100 border-2 border-green-200 text-green-700 rounded-xl text-sm font-semibold transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Continue browsing (read-only)
          </button>
        </div>
      </div>
    </div>
  );
}
