'use client';

import React, { useState, useEffect } from 'react';
import { Match, Team, Player } from '@/types/cricket';
import { Users, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface Playing8ModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  teams: Team[];
  onSubmitLineup: (params: { matchId: string; teamAPlaying8Ids: string[]; teamBPlaying8Ids: string[] }) => Promise<void>;
}

export const Playing8Modal: React.FC<Playing8ModalProps> = ({
  isOpen,
  onClose,
  match,
  teams,
  onSubmitLineup,
}) => {
  const teamA = teams.find(t => t.id === match.teamAId);
  const teamB = teams.find(t => t.id === match.teamBId);

  const isPlayoff = match.stage === 'SEMI_FINAL' || match.stage === 'FINAL';
  const targetCount = isPlayoff ? 9 : 8;

  const [teamASelectedIds, setTeamASelectedIds] = useState<string[]>([]);
  const [teamBSelectedIds, setTeamBSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTeamTab, setActiveTeamTab] = useState<'A' | 'B'>('A');

  useEffect(() => {
    if (isOpen) {
      if (match.teamAPlaying8Ids && match.teamAPlaying8Ids.length > 0) {
        setTeamASelectedIds(match.teamAPlaying8Ids);
      } else if (teamA) {
        setTeamASelectedIds(isPlayoff ? teamA.players.map(p => p.id) : teamA.players.slice(0, 8).map(p => p.id));
      }

      if (match.teamBPlaying8Ids && match.teamBPlaying8Ids.length > 0) {
        setTeamBSelectedIds(match.teamBPlaying8Ids);
      } else if (teamB) {
        setTeamBSelectedIds(isPlayoff ? teamB.players.map(p => p.id) : teamB.players.slice(0, 8).map(p => p.id));
      }
    }
  }, [isOpen, isPlayoff]);

  if (!isOpen || !teamA || !teamB) return null;

  const togglePlayer = (teamLetter: 'A' | 'B', playerId: string) => {
    if (teamLetter === 'A') {
      if (teamASelectedIds.includes(playerId)) {
        setTeamASelectedIds(teamASelectedIds.filter(id => id !== playerId));
      } else {
        if (teamASelectedIds.length >= targetCount) {
          alert(`Maximum ${targetCount} playing players can be selected.`);
          return;
        }
        setTeamASelectedIds([...teamASelectedIds, playerId]);
      }
    } else {
      if (teamBSelectedIds.includes(playerId)) {
        setTeamBSelectedIds(teamBSelectedIds.filter(id => id !== playerId));
      } else {
        if (teamBSelectedIds.length >= targetCount) {
          alert(`Maximum ${targetCount} playing players can be selected.`);
          return;
        }
        setTeamBSelectedIds([...teamBSelectedIds, playerId]);
      }
    }
  };

  const validateLineup = (team: Team, selectedIds: string[]) => {
    const selectedPlayers = team.players.filter(p => selectedIds.includes(p.id));
    const females = selectedPlayers.filter(p => p.category === 'FEMALE').length;
    const seniors = selectedPlayers.filter(p => p.category === 'SENIOR').length;
    const kids = selectedPlayers.filter(p => p.category === 'KID').length;
    const count = selectedPlayers.length;

    const hasSenior = team.players.some(p => p.category === 'SENIOR');
    const isCountValid = count === targetCount;
    const isFemaleValid = females >= 2;
    const isSeniorValid = hasSenior ? seniors >= 1 : true;
    const isKidValid = kids >= 1;

    return {
      count,
      females,
      seniors,
      kids,
      hasSenior,
      isValid: isCountValid && isFemaleValid && isSeniorValid && isKidValid,
    };
  };

  const valA = validateLineup(teamA, teamASelectedIds);
  const valB = validateLineup(teamB, teamBSelectedIds);
  const isAllValid = valA.isValid && valB.isValid;

  const handleSubmit = async () => {
    if (!isAllValid) {
      alert(`Both teams must submit exactly ${targetCount} players meeting the compulsory rules (min 2 females and 1 kid).`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitLineup({
        matchId: match.id,
        teamAPlaying8Ids: teamASelectedIds,
        teamBPlaying8Ids: teamBSelectedIds,
      });
      alert(isPlayoff ? 'Playing 9 (all 9 players) submitted successfully for both teams!' : 'Playing 8 submitted successfully for both teams!');
      onClose();
    } catch (err: any) {
      alert(`Error submitting lineup: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTeam = activeTeamTab === 'A' ? teamA : teamB;
  const currentSelectedIds = activeTeamTab === 'A' ? teamASelectedIds : teamBSelectedIds;
  const currentVal = activeTeamTab === 'A' ? valA : valB;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              {isPlayoff ? 'Pre-Match Playing 9 Submission (All 9 Players)' : 'Pre-Match Playing 8 Submission'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPlayoff
                ? 'In Semi-Finals and Finals, all 9 squad members play (9-over match, every player bowls 1 over).'
                : 'Each team must submit their 8 playing players before the match starts.'}
            </p>
          </div>
        </div>

        {/* Team Tabs */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTeamTab('A')}
            className={`flex-1 flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition ${
              activeTeamTab === 'A'
                ? 'bg-slate-800 border-amber-500 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            <span>{teamA.name}</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${valA.isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {valA.count} / {targetCount} {valA.isValid ? '✓' : ''}
            </span>
          </button>

          <button
            onClick={() => setActiveTeamTab('B')}
            className={`flex-1 flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition ${
              activeTeamTab === 'B'
                ? 'bg-slate-800 border-amber-500 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            <span>{teamB.name}</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${valB.isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {valB.count} / {targetCount} {valB.isValid ? '✓' : ''}
            </span>
          </button>
        </div>

        {/* Requirements Status for Active Tab */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 my-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className={currentVal.count === targetCount ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              • {targetCount} Players: {currentVal.count}/{targetCount}
            </span>
            <span className={currentVal.females >= 2 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              • Females: {currentVal.females}/2 min
            </span>
            {currentVal.hasSenior && (
              <span className={currentVal.seniors >= 1 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                • Senior: {currentVal.seniors}/1 min
              </span>
            )}
            <span className={currentVal.kids >= 1 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              • Kid: {currentVal.kids}/1 min
            </span>
          </div>
        </div>

        {/* Player Checkbox List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
          {currentTeam.players.map((p) => {
            const isSelected = currentSelectedIds.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => togglePlayer(activeTeamTab, p.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400 pointer-events-none"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm">{p.name}</span>
                      {p.jerseyNumber && (
                        <span className="text-[10px] font-mono font-bold bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700">
                          #{p.jerseyNumber}
                        </span>
                      )}
                      {p.isCaptain && (
                        <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                          C
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {p.category === 'FEMALE' && 'Female (2x Runs hit)'}
                      {p.category === 'SENIOR' && 'Senior Citizen (Min 6 balls)'}
                      {p.category === 'KID' && 'Junior / Kid Player'}
                      {p.category === 'REGULAR' && 'Regular Player'}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isSelected ? 'Playing 8' : 'Bench'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-2">
          <div className="text-xs text-slate-400">
            {isAllValid ? (
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Both Playing 8 lineups are valid and ready.</span>
              </span>
            ) : (
              <span className="text-rose-400 font-semibold flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Complete 8-player compulsory requirements for both teams.</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isAllValid}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Confirm & Lock Playing 8'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
