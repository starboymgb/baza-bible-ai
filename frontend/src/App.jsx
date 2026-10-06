import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Send, Loader2, Heart, History, Trash2, Bookmark, Volume2, VolumeX, Tag, Sun, Moon, Copy, Check, Globe, MessageCircle } from 'lucide-react';

const QUICK_TOPICS = {
  English: [
    "Overcoming anxiety and fear",
    "How to pray effectively",
    "Finding strength in difficult times",
    "Dealing with temptation",
    "Seeking God's guidance for the future",
    "Finding peace when overwhelmed"
  ],
  Kinyarwanda: [
    "Gutsinda ubwoba n'impungenge",
    "Uko wakisunga Imana mu masengesho",
    "Kubona imbaraga mu bihe bikomeye",
    "Kurwanya ibishuko",
    "Gushaka ubuyobozi bw'Imana mu hazaza",
    "Kubona amahoro y'umutima"
  ],
  Français: [
    "Surmonter l'anxiété et la peur",
    "Comment prier efficacement",
    "Trouver la force dans les épreuves",
    "Faire face à la tentation",
    "Chercher la direction de Dieu",
    "Trouver la paix intérieure"
  ]
};

const UI_TEXT = {
  English: {
    title: "Baza Bible AI",
    subtitle: "Find scriptural wisdom and pastoral guidance for life's moments.",
    dailyTitle: "Daily Scripture & Devotional",
    historyTitle: "Recent Questions",
    placeholder: "What's on your heart or mind today?",
    quickTopics: "Quick Topics:",
    translation: "Translation:",
    language: "Language:",
    askButton: "Ask the Word",
    searching: "Searching...",
    guidance: "The Bible Way & Pastoral Guidance",
    listen: "Listen",
    stop: "Stop",
    copy: "Copy",
    copied: "Copied!",
    whatsapp: "WhatsApp",
    noHistory: "No past questions yet."
  },
  Kinyarwanda: {
    title: "Baza Bible AI",
    subtitle: "Shakisha ubwenge bwa Bibiliya n'ubuyobozi bw'abashumba mu buzima bwawe.",
    dailyTitle: "Ijambo ry'Umunsi n'Ubutumwa",
    historyTitle: "Ibibazo Bimaze Kubazwa",
    placeholder: "Ni iki cyo ku mutima wawe cyangwa icyo wifuza gusobanukirwa uyu munsi?",
    quickTopics: "Insanganyamatsiko zihuse:",
    translation: "Bibiliya:",
    language: "Ururimi:",
    askButton: "Baza Ijambo",
    searching: "Birimo gushakisha...",
    guidance: "Ubuyobozi bushingiye kuri Bibiliya",
    listen: "Umva",
    stop: "Hagarika",
    copy: "Koporora",
    copied: "Byakoporowe!",
    whatsapp: "WhatsApp",
    noHistory: "Nta bibazo birabikwa."
  },
  Français: {
    title: "Baza Bible AI",
    subtitle: "Trouvez la sagesse biblique et des conseils pastoraux pour votre vie.",
    dailyTitle: "Verset du Jour & Méditation",
    historyTitle: "Questions Récentes",
    placeholder: "Qu'avez-vous sur le cœur ou l'esprit aujourd'hui ?",
    quickTopics: "Sujets Rapides :",
    translation: "Traduction :",
    language: "Langue :",
    askButton: "Consulter la Parole",
    searching: "Recherche...",
    guidance: "La Voie Biblique & Orientation Pastorale",
    listen: "Écouter",
    stop: "Arrêter",
    copy: "Copier",
    copied: "Copié !",
    whatsapp: "WhatsApp",
    noHistory: "Aucune question récente."
  }
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function App() {
  const [question, setQuestion] = useState('');
  const [translation, setTranslation] = useState('ESV');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('baza_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('baza_theme', theme);
  }, [theme]);

  const [dailyDevo, setDailyDevo] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(true);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('baza_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('baza_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    setDailyLoading(true);
    fetch(`${BACKEND_URL}/api/daily?language=${language}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setDailyDevo(data);
      })
      .catch(err => console.error("Failed to load daily devotional", err))
      .finally(() => setDailyLoading(false));
  }, [language]);

  // Automatically re-query if language changes and we have an active question displayed
  useEffect(() => {
    if (result && result.question) {
      handleAsk(null, result.question, language);
    }
  }, [language]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const t = UI_TEXT[language] || UI_TEXT.English;
  const topics = QUICK_TOPICS[language] || QUICK_TOPICS.English;

  const handleAsk = async (e, overrideQuestion = null, targetLang = language) => {
    if (e) e.preventDefault();
    const query = overrideQuestion || question;
    if (!query.trim()) return;

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    if (!overrideQuestion) setQuestion(query);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, translation, language: targetLang }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Something went wrong');

      const newItem = { question: query, translation, language: targetLang, ...data, id: Date.now() };
      setResult(newItem);
      setHistory(prev => [newItem, ...prev.filter(item => item.question !== query)]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic) => {
    setQuestion(topic);
    handleAsk(null, topic, language);
  };

  const handleSpeak = (textToRead) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;

    if (language === 'Français') utterance.lang = 'fr-FR';
    else utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `✨ "${result.verse_text}"\n— ${result.verse_reference} (${result.translation || translation})\n\n🙏 ${t.guidance}:\n${result.pastoral_explanation}\n\nShared via Baza Bible AI`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!result) return;
    const shareText = `✨ *"${result.verse_text}"*\n— *${result.verse_reference}* (${result.translation || translation})\n\n🙏 *${t.guidance}:*\n${result.pastoral_explanation}\n\n_Shared via Baza Bible AI_`;
    const encodedText = encodeURIComponent(shareText);
    window.open(`[https://api.whatsapp.com/send?text=$](https://api.whatsapp.com/send?text=$){encodedText}`, '_blank');
  };

  const clearHistory = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setHistory([]);
    localStorage.removeItem('baza_history');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col items-center p-4 sm:p-8 transition-colors duration-200`}>
      <header className="w-full max-w-4xl flex items-center justify-between mb-6 mt-4">
        <div className="w-10"></div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <BookOpen className="w-8 h-8 text-amber-500"/>
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          </div>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>{t.subtitle}</p>
        </div>
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`p-2.5 rounded-xl border transition ${isDark ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-amber-600 hover:bg-slate-100 shadow-sm'}`}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
        </button>
      </header>

      <div className={`w-full max-w-4xl mb-6 ${isDark ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border-amber-500/20' : 'bg-gradient-to-r from-white via-amber-50/50 to-amber-100/40 border-amber-500/30 shadow-sm'} border rounded-2xl p-5 relative overflow-hidden transition-colors duration-200`}>
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500"/>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">{t.dailyTitle}</span>
          </div>
          {dailyDevo && language !== 'Kinyarwanda' && (
            <button
              onClick={() => handleSpeak(`${dailyDevo.verse_reference}. "${dailyDevo.verse_text}". ${dailyDevo.devotional}`)}
              className={`text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1 ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} px-2.5 py-1 rounded-lg border transition`}
            >
              <Volume2 className="w-3.5 h-3.5"/> {t.listen}
            </button>
          )}
        </div>

        {dailyLoading ? (
          <div className="flex items-center justify-center py-4 text-slate-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500"/> ...
          </div>
        ) : dailyDevo ? (
          <div>
            <p className={`text-sm italic font-serif ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-1`}>"{dailyDevo.verse_text}" — <span className="font-sans not-italic font-semibold text-amber-500">{dailyDevo.verse_reference}</span></p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed mt-2`}>{dailyDevo.devotional}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Could not load daily verse.</p>
        )}
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`md:col-span-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-4 flex flex-col h-[520px] transition-colors duration-200`}>
          <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'} mb-3`}>
            <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-amber-500"/> {t.historyTitle}
            </h2>
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-slate-400 hover:text-red-500 transition" title="Clear History">
                <Trash2 className="w-4 h-4"/>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center mt-10">{t.noHistory}</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                    setQuestion(item.question);
                    setTranslation(item.translation || 'ESV');
                    if (item.language) setLanguage(item.language);
                    setResult(item);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl ${isDark ? 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800/60 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'} border text-xs transition truncate block`}
                >
                  <span className="font-medium text-amber-500 block truncate">{item.question}</span>
                  <span className="text-[10px] text-slate-400">{item.verse_reference}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`md:col-span-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-6 shadow-xl flex flex-col transition-colors duration-200`}>
          <form onSubmit={(e) => handleAsk(e)} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-1`}>
                {t.placeholder}
              </label>
              <textarea
                rows="3"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={language === 'Kinyarwanda' ? "Urugero: Nabona nte amahoro mu mpungenge zikomeye?" : language === 'Français' ? "Ex: Comment trouver la paix face à l'anxiété ?" : "e.g., How do I find peace when dealing with overwhelming anxiety?"}
                className={`w-full ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} border rounded-xl p-3 focus:outline-none focus:border-amber-500 transition text-sm`}
              />
            </div>

            <div>
              <div className={`flex items-center gap-1 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-1.5`}>
                <Tag className="w-3 h-3 text-amber-500"/> {t.quickTopics}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topics.map((topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTopicClick(topic)}
                    className={`text-[11px] ${isDark ? 'bg-slate-950/80 hover:bg-amber-500/10 hover:text-amber-300 text-slate-300 border-slate-800' : 'bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 border-slate-200'} border px-2.5 py-1 rounded-lg transition`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className={`flex flex-wrap items-center justify-between gap-3 pt-2 ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'} p-3 rounded-xl border transition-colors duration-200`}>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-500"/>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} font-medium`}>{t.language}</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`bg-transparent border ${isDark ? 'border-slate-700 text-amber-400' : 'border-slate-300 text-amber-600'} rounded-lg px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer`}
                >
                  <option value="English" className={isDark ? 'bg-slate-900' : 'bg-white'}>English</option>
                  <option value="Kinyarwanda" className={isDark ? 'bg-slate-900' : 'bg-white'}>Kinyarwanda</option>
                  <option value="Français" className={isDark ? 'bg-slate-900' : 'bg-white'}>Français</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} font-medium`}>{t.translation}</span>
                <select
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  className={`bg-transparent border ${isDark ? 'border-slate-700 text-amber-400' : 'border-slate-300 text-amber-600'} rounded-lg px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer`}
                >
                  <option value="ESV" className={isDark ? 'bg-slate-900' : 'bg-white'}>ESV</option>
                  <option value="NIV" className={isDark ? 'bg-slate-900' : 'bg-white'}>NIV</option>
                  <option value="NKJV" className={isDark ? 'bg-slate-900' : 'bg-white'}>NKJV</option>
                  <option value="KJV" className={isDark ? 'bg-slate-900' : 'bg-white'}>KJV</option>
                  <option value="NLT" className={isDark ? 'bg-slate-900' : 'bg-white'}>NLT</option>
                  <option value="Bibiliya Yera" className={isDark ? 'bg-slate-900' : 'bg-white'}>Bibiliya Yera (RW)</option>
                  <option value="Louis Segond" className={isDark ? 'bg-slate-900' : 'bg-white'}>Louis Segond (FR)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 transition disabled:opacity-50 text-sm shadow-lg cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                {loading ? t.searching : t.askButton}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-950/50 border border-red-900 text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className={`mt-6 space-y-6 animate-fade-in border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} pt-6 flex-1 overflow-y-auto`}>
              <div className={`${isDark ? 'bg-slate-950/60 border-amber-500/30' : 'bg-amber-50/50 border-amber-500/40'} border rounded-xl p-5 relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                    {result.verse_reference} ({result.translation || translation})
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={handleWhatsAppShare}
                      className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-800' : 'bg-white text-emerald-600 border-slate-200 hover:bg-slate-50 shadow-sm'} transition flex items-center gap-1 text-xs`}
                      title="Share to WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-500"/>
                      <span className="hidden sm:inline">{t.whatsapp}</span>
                    </button>

                    <button
                      onClick={handleCopy}
                      className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900 text-amber-400 border-slate-800 hover:bg-slate-800' : 'bg-white text-amber-600 border-slate-200 hover:bg-slate-50 shadow-sm'} transition flex items-center gap-1 text-xs`}
                      title={t.copy}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500"/> : <Copy className="w-4 h-4"/>}
                      <span className="hidden sm:inline">{copied ? t.copied : t.copy}</span>
                    </button>

                    {language !== 'Kinyarwanda' && (
                      <button
                        onClick={() => handleSpeak(`${result.verse_reference}. "${result.verse_text}". ${result.pastoral_explanation}`)}
                        className={`p-1.5 rounded-lg border transition flex items-center gap-1 text-xs ${
                          isSpeaking 
                            ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse' 
                            : isDark ? 'bg-slate-900 text-amber-400 border-slate-800 hover:bg-slate-800' : 'bg-white text-amber-600 border-slate-200 hover:bg-slate-50 shadow-sm'
                        }`}
                        title={isSpeaking ? t.stop : t.listen}
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
                        <span className="hidden sm:inline">{isSpeaking ? t.stop : t.listen}</span>
                      </button>
                    )}
                    <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500/20"/>
                  </div>
                </div>
                <p className={`text-base italic font-serif ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>"{result.verse_text}"</p>
              </div>

              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-2 flex items-center gap-1.5`}>
                  <Sparkles className="w-4 h-4 text-amber-500"/>
                  {t.guidance}
                </h3>
                <p className={`${isDark ? 'text-slate-300 bg-slate-950/40 border-slate-800/60' : 'text-slate-700 bg-slate-50 border-slate-200'} leading-relaxed p-4 rounded-xl border text-sm`}>
                  {result.pastoral_explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className={`mt-8 text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'} flex items-center gap-1`}>
        Built with faith and code <Heart className="w-3 h-3 text-red-500 fill-red-500"/>
      </footer>
    </div>
  );
}