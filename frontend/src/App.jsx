import React, { useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { GameSetup } from './components/GameSetup';
import { GameBoard } from './components/GameBoard';
import { GameOverScreen } from './components/GameOverScreen';
import { AdminLayout } from './components/admin/AdminLayout';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const GameContainer = () => {
  const { gameStage, currentUser, currentRoute, setCurrentRoute, logout } = useGame();

  // Sync state with browser location path
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        setCurrentRoute('admin');
      } else if (path === '/board') {
        setCurrentRoute('board');
      } else {
        setCurrentRoute('setup');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentRoute]);

  const isAdmin = currentUser?.role === 'admin';

  // ====================================================================
  // RBAC 1: If current user is ADMIN, lock to Admin Dashboard
  // Completely prevents admin from entering player routes (/setup and /board)
  // ====================================================================
  if (isAdmin || currentRoute === 'admin') {
    // If a non-admin user navigates to /admin, block access
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center font-sans dir-rtl" dir="rtl">
          <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-red-100">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800">منطقة محظورة (403 Forbidden)</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              عذراً، لوحة التحكم مخصصة لمدير المنصة فقط. يتطلب الوصول حساباً يمتلك صلاحية المدير (Admin).
            </p>
            <button
              onClick={() => setCurrentRoute('setup')}
              className="mt-6 w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2"
            >
              العودة إلى شاشة اللعب الرئيسية <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // Admin view
    return <AdminLayout onLogout={logout} />;
  }

  // ====================================================================
  // PLAYER EXPERIENCE (Non-admin)
  // ====================================================================

  // 1. Setup Wizard Screen (Light vibrant theme)
  if (gameStage === 'setup' && currentRoute !== 'board') {
    return <GameSetup />;
  }

  // 2. Victory / Game Over Podium Screen
  if (gameStage === 'game_over') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <GameOverScreen />
      </div>
    );
  }

  // 3. Main Game Board (Jeopardy-style Grid, Turn-based, Question Modal)
  return <GameBoard />;
};

export default function App() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}
