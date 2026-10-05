"use client";

import { useState } from "form"; // standard react state
import React from "react";
import SearchBar from "@/components/SearchBar";
import VerseCard from "@/components/VerseCard";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleAsk = async (question: string) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("http://localhost:8000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, translation: "ESV" }),
      });

      if (!res.ok) throw new Error("Failed to fetch response from Baza Bible AI.");

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center p-6 md:p-24">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800">
          Baza Bible AI
        </h1>
        <p className="text-lg text-slate-600">
          Ask your life questions and discover guidance through the wisdom of Scripture.
        </p>

        {/* Search Input Component */}
        <SearchBar onSearch={handleAsk} loading={loading} />

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        {/* Result Display */}
        {result && (
          <div className="mt-8 text-left">
            <VerseCard 
              reference={result.verse_reference} 
              text={result.verse_text} 
              explanation={result.pastoral_explanation} 
            />
          </div>
        )}
      </div>
    </main>
  );
}