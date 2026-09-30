import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  RotateCcw, 
  Flame, 
  Sparkles, 
  Award,
  Crown
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const GameOverScreen = () => {
  const { teams, resetGame } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef(null);

  // Trigger celebration confetti on mount
  useEffect(() => {
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.4 } });
    const timer = setTimeout(() => {
      confetti({ particleCount: 100, spread: 120, origin: { y: 0.5 } });
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Sort teams descending by score
  const sortedTeams = [...(teams || [])].sort((a, b) => b.score - a.score);
  const winner = sortedTeams[0] || { name: 'الفريق الفائز', score: 0 };
  const runnerUp = sortedTeams[1] || { name: 'الفريق المنافس', score: 0 };
  const scoreDiff = Math.abs((winner.score || 0) - (runnerUp.score || 0));

  // Determine match title / badge
  const matchTitle = scoreDiff >= 800 
    ? '🔥 اكتساح ساحق' 
    : scoreDiff >= 400 
    ? '⚡ فوز مستحق' 
    : '⚔️ ملحمة حتى الرمق الأخير';

  // Share message text for WhatsApp and Clipboard
  const shareText = `🏆 بطل جلسة اليوم: فريق [${winner.name}]!
🥇 المركز الأول: [${winner.name}] - ${winner.score} نقطة
🥈 المركز الثاني: [${runnerUp.name}] - ${runnerUp.score} نقطة
${matchTitle}
العب معنا وتحدى أصدقاءك في لعبة جلسة! 🔥`;

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  // High-Resolution Native HTML5 Canvas Exporter for the Result Card
  const handleDownloadCard = () => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = 1080;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;

      // 1. Background Gradient (Luxury Deep Purple to Indigo)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#1e1035');
      bgGrad.addColorStop(0.5, '#130924');
      bgGrad.addColorStop(1, '#0b0417');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Decorative Top Glowing Sphere
      const glowGrad = ctx.createRadialGradient(width / 2, 350, 50, width / 2, 350, 450);
      glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, 800);

      // 3. Golden Border Card Frame
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(40, 40, width - 80, height - 80, 40);
      ctx.stroke();

      // Inner subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(55, 55, width - 110, height - 110, 30);
      ctx.stroke();

      // 4. Header: Logo & Title
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.direction = 'rtl';
      ctx.fillText('✨ جــلــســة  •  بطاقة النتيجة الرسمية ✨', width / 2, 140);

      // 5. Winner Crown / Trophy Symbol
      ctx.font = '90px sans-serif';
      ctx.fillText('👑', width / 2, 280);

      // 6. Winner Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText('بـــطـــل الـــجـــلـــســـة', width / 2, 380);

      // Winner Name (Highlighted in Gold Gradient)
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'black 72px sans-serif';
      ctx.fillText(winner.name, width / 2, 480);

      // Match Title Badge (e.g. اكتساح ساحق)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.beginPath();
      ctx.roundRect(width / 2 - 200, 530, 400, 60, 30);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(matchTitle, width / 2, 572);

      // 7. Scores Podium Section
      // Box 1: Winner (1st place)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.beginPath();
      ctx.roundRect(100, 650, width - 200, 180, 30);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`🥇 المركز الأول: ${winner.name}`, width - 150, 755);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'black 64px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${winner.score} نقطة`, 150, 760);

      // Box 2: Runner Up (2nd place)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.roundRect(100, 870, width - 200, 160, 30);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`🥈 المركز الثاني: ${runnerUp.name}`, width - 150, 965);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'black 54px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${runnerUp.score} نقطة`, 150, 970);

      // 8. Footer Watermark
      const today = new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`تاريخ المواجهة: ${today}  •  تم الإنشاء عبر منصة جلسة`, width / 2, 1180);

      ctx.fillStyle = '#8b5cf6';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('jalsa.app', width / 2, 1230);

      // Download triggered
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `jalsah-result-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 text-center select-none" dir="rtl">
      {/* Trophy and Crown Header */}
      <div className="relative inline-block mb-4">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-500 mx-auto flex items-center justify-center text-5xl sm:text-6xl shadow-xl shadow-amber-500/30 animate-bounce">
          🏆
        </div>
        <span className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-900 text-amber-400 shadow-md">
          <Crown className="w-5 h-5 fill-amber-400" />
        </span>
      </div>

      <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-2">
        مبروك الفوز لفريق [{winner.name}]! 🎉
      </h2>
      <p className="text-slate-500 text-sm sm:text-base mb-6 max-w-lg mx-auto font-medium">
        انتهت الجولة بمنافسة شرسة وأسئلة تكتيكية ملحمية! إليكم كرت النتيجة الرسمي للمباراة:
      </p>

      {/* ================= THE SHAREABLE CARD (كرت النتيجة) ================= */}
      <div 
        ref={cardRef}
        className="w-full max-w-xl mx-auto mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 text-white shadow-2xl border-2 border-amber-400/80 relative overflow-hidden text-center"
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-32 bg-amber-500/20 blur-3xl pointer-events-none rounded-full" />

        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-300">لعبة جلسة • بطاقة النتيجة الرسمية</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
            {matchTitle}
          </span>
        </div>

        {/* Winner Highlight */}
        <div className="my-4">
          <span className="text-xs font-bold text-slate-300 block mb-1">👑 بطل الجلسة الأول</span>
          <h3 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200">
            {winner.name}
          </h3>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
            {winner.score} <span className="text-xs text-amber-400 font-bold">نقطة</span>
          </div>
        </div>

        {/* Comparison Bars */}
        <div className="space-y-2.5 my-6 max-w-md mx-auto">
          {sortedTeams.map((team, idx) => (
            <div
              key={team.id || idx}
              className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all ${
                idx === 0
                  ? 'bg-amber-500/15 border-amber-400/50 shadow-md shadow-amber-500/10'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{idx === 0 ? '🥇' : '🥈'}</span>
                <span className="font-bold text-sm text-slate-100">{team.name}</span>
              </div>
              <div className="font-black text-base text-amber-300">
                {team.score} <span className="text-[10px] text-slate-400">ن</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 font-medium pt-3 border-t border-white/10 flex items-center justify-between">
          <span>فارق النقاط: {scoreDiff} نقطة</span>
          <span>jalsa.app</span>
        </div>
      </div>

      {/* ================= ACTION BUTTONS: DOWNLOAD & SHARE ================= */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8 max-w-xl mx-auto">
        {/* Download Card as Image */}
        <button
          type="button"
          onClick={handleDownloadCard}
          disabled={isGenerating}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isGenerating ? 'جارٍ الإنشاء...' : 'تحميل كرت النتيجة (صورة)'}</span>
        </button>

        {/* Share via WhatsApp */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>مشاركة عبر واتساب</span>
        </button>

        {/* Copy Text Summary */}
        <button
          type="button"
          onClick={handleCopySummary}
          className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-black text-sm shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
          <span>{copied ? 'تم نسخ النتيجة!' : 'نسخ الملخص'}</span>
        </button>
      </div>

      {/* Restart Game Button */}
      <button
        onClick={resetGame}
        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-base shadow-xl shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
      >
        <RotateCcw className="w-5 h-5" />
        <span>بدء جلسة وتحدي جديد 🔄</span>
      </button>
    </div>
  );
};
