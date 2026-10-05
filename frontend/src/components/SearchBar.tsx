"use client";

import React, { useState } from "react";

interface SearchBarProps {
  onSearch: (question: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [input, setInput] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onSearch(input);
  };

  return (
    form onSubmit={onSubmit} className="flex gap-2 w-full shadow-lg rounded-xl overflow-hidden bg-white p-2 border border-slate-200"
  >
    <input
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="e.g., How do I overcome anxiety about the future?"
      className="flex-1 px-4 py-3 text-slate-800 focus:outline-none text-base"
      disabled={loading}
    />
    <button
      type="submit"
      disabled={loading}
      className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
    >
      {loading ? "Searching..." : "Ask Bible"}
    </button>
  </form>
}