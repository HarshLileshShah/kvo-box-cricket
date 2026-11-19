'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ScorerConsole } from '@/components/ScorerConsole';
import { LiveScoreboard } from '@/components/LiveScoreboard';
import { PointsTable } from '@/components/PointsTable';
import { ScheduleManager } from '@/components/ScheduleManager';
import { TeamManager } from '@/components/TeamManager';
import { PlayerStats } from '@/components/PlayerStats';
import { RuleBookViewer } from '@/components/RuleBookViewer';
import { AdminLoginModal } from '@/components/AdminLoginModal';
import { Playing8Modal } from '@/components/Playing8Modal';
import { Match, Team, TournamentRulesConfig } from '@/types/cricket';
import { INITIAL_TEAMS, INITIAL_MATCHES, OFFICIAL_TOURNAMENT_RULES } from '@/lib/mockData';
import { RefreshCw, Trophy, Lock, ShieldAlert } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('live-viewer');
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [rules, setRules] = useState<TournamentRulesConfig>(OFFICIAL_TOURNAMENT_RULES);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('match-1');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Admin Auth State
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<{ loginId: string; name: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Playing 8 Lineup State
  const [showPlaying8Modal, setShowPlaying8Modal] = useState<boolean>(false);
  const [playing8Match, setPlaying8Match] = useState<Match | null>(null);

  // Load Admin Session from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kvo_admin_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.loginId) {
          setIsAdmin(true);
          setAdminUser(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleLoginSuccess = (user: { loginId: string; name: string }) => {
    setIsAdmin(true);
    setAdminUser(user);
    setActiveTab('scorer');
  };

  const handleLogout = () => {
    localStorage.removeItem('kvo_admin_auth');
    setIsAdmin(false);
    setAdminUser(null);
    if (activeTab === 'scorer') {
      setActiveTab('live-viewer');
    }
  };

  // Fetch Tournament State from Server
  const fetchState = async (silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      const res = await fetch('/api/tournament');
      if (res.ok) {
        const data = await res.json();
        if (data.teams) setTeams(data.teams);
        if (data.matches) setMatches(data.matches);
        if (data.rules) setRules(data.rules);
      }
    } catch (err) {
      console.error('Failed fetching tournament state', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchState();
    if (showPlaying8Modal || showLoginModal) return;
    // Poll state every 4 seconds for real-time live score updates
    const interval = setInterval(() => {
      fetchState(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [showPlaying8Modal, showLoginModal]);

  const activeMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  // Protected Admin Actions
  const requireAdmin = (actionFn: () => Promise<void>) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    actionFn();
  };

  const handleRecordBall = async (params: any) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      throw new Error('Please sign in as Admin/Scorer to update scores.');
    }
    const res = await fetch('/api/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RECORD_BALL', params }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record ball');
    }
    await fetchState(true);
  };

  const handleUndoBall = async (matchId: string) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      throw new Error('Please sign in as Admin/Scorer to undo scores.');
    }
    const res = await fetch('/api/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UNDO_BALL', params: { matchId } }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to undo ball');
    }
    await fetchState(true);
  };

  const handleUpdateParticipants = async (params: any) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      throw new Error('Please sign in as Admin/Scorer to rotate participants.');
    }
    const res = await fetch('/api/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_PARTICIPANTS', params }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update participants');
    }
    await fetchState(true);
  };

  const handleSaveTeam = async (team: Team) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    const res = await fetch('/api/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SAVE_TEAM', params: { team } }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save team');
    }
    await fetchState(true);
  };

  const handleSaveMatch = async (match: Match) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    const res = await fetch('/api/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SAVE_MATCH', params: { match } }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save match');
    }
    await fetchState(true);
  };

  const handleSubmitLineup = async (params: { matchId: string; teamAPlaying8Ids: string[]; teamBPlaying8Ids: string[] }) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    const res = await fetch('/api/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SUBMIT_LINEUP', params }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit playing lineup');
    }
    await fetchState(true);
  };

  const handleOpenPlaying8Modal = (match: Match) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    setPlaying8Match(match);
    setShowPlaying8Modal(true);
  };

  const handleSetPlayoffTeams = async (params: any) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    const res = await fetch('/api/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SET_PLAYOFFS', params }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to set playoff teams');
    }
    await fetchState(true);
  };

  const handleResetTournament = async () => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    if (!confirm('Are you sure you want to reset all tournament scores back to default?')) return;
    const res = await fetch('/api/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RESET_TOURNAMENT', params: {} }),
    });
    if (res.ok) {
      await fetchState(true);
      alert('Tournament reset to fresh state!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        matches={matches}
        teams={teams}
        selectedMatchId={selectedMatchId}
        setSelectedMatchId={setSelectedMatchId}
        isAdmin={isAdmin}
        adminUser={adminUser}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Scorer Tab: Protected */}
        {activeTab === 'scorer' && (
          isAdmin && activeMatch ? (
            <ScorerConsole
              match={activeMatch}
              teams={teams}
              onRecordBall={handleRecordBall}
              onUndoBall={handleUndoBall}
              onUpdateParticipants={handleUpdateParticipants}
              onOpenPlaying8Modal={() => handleOpenPlaying8Modal(activeMatch)}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-16 px-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-white">Admin / Scorer Authentication Required</h2>
              <p className="text-xs text-slate-400">
                Live score updates and match officiating controls are restricted to authenticated tournament administrators and scorers.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition active:scale-95"
                >
                  Sign In with LoginID & Password
                </button>
              </div>
            </div>
          )
        )}

        {/* Public Live Scoreboard */}
        {activeTab === 'live-viewer' && activeMatch && (
          <LiveScoreboard match={activeMatch} teams={teams} />
        )}

        {/* Points Table & Semifinals */}
        {activeTab === 'standings' && (
          <PointsTable
            teams={teams}
            matches={matches}
            onSetPlayoffTeams={handleSetPlayoffTeams}
            onSelectMatch={setSelectedMatchId}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Schedule & Fixtures */}
        {activeTab === 'schedule' && (
          <ScheduleManager
            matches={matches}
            teams={teams}
            onSaveMatch={handleSaveMatch}
            onSelectMatch={setSelectedMatchId}
            setActiveTab={setActiveTab}
            onOpenPlaying8Modal={handleOpenPlaying8Modal}
          />
        )}

        {/* Teams & Rosters */}
        {activeTab === 'teams' && (
          <TeamManager teams={teams} onSaveTeam={handleSaveTeam} />
        )}

        {/* Player Leaderboard Stats */}
        {activeTab === 'stats' && (
          <PlayerStats teams={teams} matches={matches} />
        )}

        {/* Official Rulebook */}
        {activeTab === 'rules' && <RuleBookViewer />}
      </main>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Pre-Match Playing 8 Modal */}
      {playing8Match && (
        <Playing8Modal
          isOpen={showPlaying8Modal}
          onClose={() => setShowPlaying8Modal(false)}
          match={playing8Match}
          teams={teams}
          onSubmitLineup={handleSubmitLineup}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-400">
              ADIOR STONE Presents KVO BOX CRICKET TOURNAMENT
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => fetchState()}
              className="flex items-center space-x-1 text-slate-400 hover:text-white transition"
              title="Manual Sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            <span className="text-slate-700">•</span>
            {isAdmin ? (
              <button
                onClick={handleResetTournament}
                className="text-rose-500 hover:text-rose-400 transition font-medium"
              >
                Reset Tournament Data
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-amber-400 hover:text-amber-300 transition font-medium flex items-center space-x-1"
              >
                <Lock className="w-3 h-3" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
