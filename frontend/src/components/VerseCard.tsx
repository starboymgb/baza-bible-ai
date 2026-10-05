import React from "react";

interface VerseCardProps {
  reference: string;
  text: string;
  explanation: string;
}

export default function VerseCard({ reference, text, explanation }: VerseCardProps) {
  return (
    <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-6 space-y-4">
      <div>
        <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">
          Scripture Guidance
        </span>
        <h3 className="text-xl font-bold text-slate-800 mt-1">{reference}</h3>
        <blockquote className="italic text-slate-700 mt-2 border-l-4 border-indigo-500 pl-4 py-1">
          "{text}"
        </blockquote>
      </div>

      <hr className="border-slate-100" />

      <div>
        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-1">
          The Bible Way
        </h4>
        <p className="text-slate-600 leading-relaxed text-base">
          {explanation}
        </p>
      </div>
    </div>
  );
}