'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Team, Player, PlayerCategory } from '@/types/cricket';
import { 
  Users, 
  UserPlus, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  Sparkles, 
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface TeamManagerProps {
  teams: Team[];
  onSaveTeam: (team: Team) => Promise<void>;
}

export const TeamManager: React.FC<TeamManagerProps> = ({ teams, onSaveTeam }) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  // Horizontal Scroll State & Ref for Team Selection Pills
  const teamListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = teamListRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 100);
    const el = teamListRef.current;
    if (!el) return () => clearTimeout(timer);
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [teams]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!teamListRef.current) return;
    const amount = 240;
    teamListRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShortName, setNewTeamShortName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#3b82f6');

  // Edit Team Form State
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamShortName, setEditTeamShortName] = useState('');
  const [editTeamColor, setEditTeamColor] = useState('#3b82f6');

  // New Player Form State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerCategory, setNewPlayerCategory] = useState<PlayerCategory>('REGULAR');
  const [newPlayerIsCaptain, setNewPlayerIsCaptain] = useState(false);

  // Edit Player Form State
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerCategory, setEditPlayerCategory] = useState<PlayerCategory>('REGULAR');
  const [editPlayerIsCaptain, setEditPlayerIsCaptain] = useState(false);

  const activeTeam = teams.find(t => t.id === selectedTeamId) || teams[0];

  // Validate Roster against Official Rulebook
  const validateTeamRoster = (team: Team) => {
    const females = team.players.filter(p => p.category === 'FEMALE').length;
    const seniors = team.players.filter(p => p.category === 'SENIOR').length;
    const kids = team.players.filter(p => p.category === 'KID').length;
    const captain = team.players.some(p => p.isCaptain);
    const totalPlayers = team.players.length;

    const hasSenior = seniors >= 1;
    return {
      totalPlayers,
      females,
      seniors,
      kids,
      captain,
      hasSenior,
      isCompliant: totalPlayers === 9 && females >= 2 && kids >= 1 && captain,
    };
  };

  const currentValidation = activeTeam ? validateTeamRoster(activeTeam) : null;

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const id = `team-${Date.now()}`;
    const newTeam: Team = {
      id,
      name: newTeamName.trim(),
      shortName: newTeamShortName.trim().toUpperCase() || newTeamName.substring(0, 3).toUpperCase(),
      color: newTeamColor,
      players: [],
    };

    await onSaveTeam(newTeam);
    setSelectedTeamId(id);
    setShowAddTeamModal(false);
    setNewTeamName('');
    setNewTeamShortName('');
  };

  const openEditTeamModal = () => {
    if (!activeTeam) return;
    setEditTeamName(activeTeam.name);
    setEditTeamShortName(activeTeam.shortName);
    setEditTeamColor(activeTeam.color || '#3b82f6');
    setShowEditTeamModal(true);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !editTeamName.trim()) return;

    const updatedTeam: Team = {
      ...activeTeam,
      name: editTeamName.trim(),
      shortName: editTeamShortName.trim().toUpperCase() || editTeamName.substring(0, 3).toUpperCase(),
      color: editTeamColor,
    };

    await onSaveTeam(updatedTeam);
    setShowEditTeamModal(false);
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !newPlayerName.trim()) return;

    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: newPlayerName.trim(),
      category: newPlayerCategory,
      isCaptain: newPlayerIsCaptain,
    };

    let updatedPlayers = [...activeTeam.players];
    if (newPlayerIsCaptain) {
      updatedPlayers = updatedPlayers.map(p => ({ ...p, isCaptain: false }));
    }
    updatedPlayers.push(newPlayer);

    const updatedTeam: Team = {
      ...activeTeam,
      players: updatedPlayers,
    };

    await onSaveTeam(updatedTeam);
    setShowAddPlayerModal(false);
    setNewPlayerName('');
    setNewPlayerCategory('REGULAR');
    setNewPlayerIsCaptain(false);
  };

  const openEditPlayerModal = (player: Player) => {
    setEditingPlayer(player);
    setEditPlayerName(player.name);
    setEditPlayerCategory(player.category);
    setEditPlayerIsCaptain(!!player.isCaptain);
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !editingPlayer || !editPlayerName.trim()) return;

    let updatedPlayers = activeTeam.players.map(p => {
      if (p.id === editingPlayer.id) {
        return {
          ...p,
          name: editPlayerName.trim(),
          category: editPlayerCategory,
          isCaptain: editPlayerIsCaptain,
        };
      }
      if (editPlayerIsCaptain && p.id !== editingPlayer.id) {
        return { ...p, isCaptain: false };
      }
      return p;
    });

    const updatedTeam: Team = {
      ...activeTeam,
      players: updatedPlayers,
    };

    await onSaveTeam(updatedTeam);
    setEditingPlayer(null);
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!activeTeam) return;
    if (!confirm('Are you sure you want to remove this player?')) return;

    const updatedTeam: Team = {
      ...activeTeam,
      players: activeTeam.players.filter(p => p.id !== playerId),
    };

    await onSaveTeam(updatedTeam);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Tournament Teams & Official Rosters</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Single league format. Customize team names, assign colors, and enforce the 9-player squad composition.
          </p>
        </div>

        <button
          onClick={() => setShowAddTeamModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Add New Team</span>
        </button>
      </div>

      {/* Team Selection Pills with Visual Scroll & Navigation */}
      <div className="relative group">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2.5 z-20 w-8 h-8 rounded-full bg-slate-900/95 border border-amber-500/60 text-amber-400 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center shadow-xl backdrop-blur-md transition active:scale-90"
            title="Scroll left"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2.5 z-20 w-8 h-8 rounded-full bg-slate-900/95 border border-amber-500/60 text-amber-400 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center shadow-xl backdrop-blur-md transition active:scale-90 animate-pulse"
            title="Scroll right to view more teams"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Left Edge Gradient Fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-3 w-10 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-10 rounded-l-xl" />
        )}

        {/* Right Edge Gradient Fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-10 rounded-r-xl" />
        )}

        {/* Scrollable Container */}
        <div 
          ref={teamListRef}
          className="flex items-center space-x-2 overflow-x-auto pb-3 pt-1 px-1 visual-scrollbar scroll-smooth"
        >
          {teams.map(t => {
            const v = validateTeamRoster(t);
            const isSelected = t.id === activeTeam?.id;
            return (
              <button
                key={t.id}
                onClick={(e) => {
                  setSelectedTeamId(t.id);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition whitespace-nowrap shadow-sm shrink-0 ${
                  isSelected
                    ? 'bg-slate-800 border-amber-500 text-white ring-2 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                {t.logoUrl ? (
                  <img src={t.logoUrl} alt={t.name} className="w-5 h-5 object-contain rounded p-0.5 bg-slate-950 shrink-0" />
                ) : (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: t.color || '#3b82f6' }}
                  />
                )}
                <span>{t.name}</span>
                <span className="text-[10px] text-slate-400">({t.players.length}/9)</span>
                {v.isCompliant ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Visual scroll dots & indicator */}
        <div className="flex items-center justify-between px-1 pt-1 text-[10px] text-slate-500 font-medium">
          <span className="flex items-center space-x-1">
            <span>Showing all {teams.length} teams</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-500/80">Scroll or use arrows ◄ ►</span>
          </span>
          <div className="flex items-center space-x-1.5 py-0.5">
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTeamId(t.id)}
                className={`h-1.5 rounded-full transition-all ${
                  t.id === activeTeam?.id ? 'w-5 bg-amber-400 shadow-sm shadow-amber-400/50' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Select ${t.name}`}
                aria-label={`Select ${t.name}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Active Team Detail Card */}
      {activeTeam && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-xl space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-4">
              {activeTeam.logoUrl && (
                <img
                  src={activeTeam.logoUrl}
                  alt={activeTeam.name}
                  className="w-14 h-14 object-contain rounded-2xl p-1 bg-slate-950 border border-slate-800 shadow-md shrink-0"
                />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: activeTeam.color || '#3b82f6' }}
                  />
                  <span className="text-xs font-mono text-slate-400 uppercase">Code: {activeTeam.shortName}</span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1 flex items-center space-x-3">
                  <span>{activeTeam.name}</span>
                  <button
                    onClick={openEditTeamModal}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center space-x-1 transition"
                    title="Change Team Name or Color"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Rename / Edit</span>
                  </button>
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddPlayerModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Player</span>
              </button>
            </div>
          </div>

          {/* Rulebook Compliance Checklist Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Official 9-Player Team Requirement Status</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total Players</span>
                <span className={`text-base font-black ${currentValidation?.totalPlayers === 9 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currentValidation?.totalPlayers} / 9
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Female Players</span>
                <span className={`text-base font-black ${(currentValidation?.females || 0) >= 2 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currentValidation?.females} / 2 min
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Senior Citizen</span>
                <span className={`text-base font-black ${(currentValidation?.seniors || 0) >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currentValidation?.seniors} / 1 min
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Junior (Kid)</span>
                <span className={`text-base font-black ${(currentValidation?.kids || 0) >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currentValidation?.kids} / 1 min
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Captain Assigned</span>
                <span className={`text-base font-black ${currentValidation?.captain ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currentValidation?.captain ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Players Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[500px]">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Player Name</th>
                  <th className="p-3">Category Tag</th>
                  <th className="p-3">Captaincy</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {activeTeam.players.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-bold text-white text-sm">
                      <div className="flex items-center space-x-2">
                        <span>{p.name}</span>
                        {p.jerseyNumber && (
                          <span className="text-[10px] font-mono font-bold bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700" title={`Jersey #${p.jerseyNumber}`}>
                            #{p.jerseyNumber}
                          </span>
                        )}
                        {p.jerseyName && p.jerseyName !== p.name && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({p.jerseyName})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {p.category === 'FEMALE' && (
                        <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                          Female (2x Runs)
                        </span>
                      )}
                      {p.category === 'SENIOR' && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                          Senior Citizen (Min 6b)
                        </span>
                      )}
                      {p.category === 'KID' && (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                          Kids / Junior (Bat &lt; 6 ov)
                        </span>
                      )}
                      {p.category === 'REGULAR' && (
                        <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded font-medium">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {p.isCaptain ? (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded font-bold">
                          Captain
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEditPlayerModal(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Edit Player Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(p.id)}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-white transition"
                          title="Remove Player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT / RENAME TEAM MODAL */}
      {showEditTeamModal && activeTeam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUpdateTeam} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              <span>Rename / Edit Team</span>
            </h3>

            <div>
              <label htmlFor="edit-team-name-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Team Name
              </label>
              <input
                id="edit-team-name-input"
                type="text"
                required
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="edit-team-shortname-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Short Code (2-4 letters)
              </label>
              <input
                id="edit-team-shortname-input"
                type="text"
                maxLength={4}
                value={editTeamShortName}
                onChange={(e) => setEditTeamShortName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="edit-team-color-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Theme Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  id="edit-team-color-input"
                  type="color"
                  value={editTeamColor}
                  onChange={(e) => setEditTeamColor(e.target.value)}
                  className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                />
                <span className="text-xs text-slate-400 font-mono">{editTeamColor}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditTeamModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD TEAM MODAL */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateTeam} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>Register New Team</span>
            </h3>

            <div>
              <label htmlFor="new-team-name-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Team Name</label>
              <input
                id="new-team-name-input"
                type="text"
                required
                placeholder="e.g. Adior Superstars"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="new-team-shortname-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Short Code</label>
              <input
                id="new-team-shortname-input"
                type="text"
                maxLength={4}
                placeholder="e.g. AS"
                value={newTeamShortName}
                onChange={(e) => setNewTeamShortName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="new-team-color-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Team Theme Color</label>
              <div className="flex items-center space-x-3">
                <input
                  id="new-team-color-input"
                  type="color"
                  value={newTeamColor}
                  onChange={(e) => setNewTeamColor(e.target.value)}
                  className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                />
                <span className="text-xs text-slate-400 font-mono">{newTeamColor}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddTeamModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20"
              >
                Create Team
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD PLAYER MODAL */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddPlayer} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <span>Add Player to {activeTeam?.name}</span>
            </h3>

            <div>
              <label htmlFor="add-player-name-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Player Name</label>
              <input
                id="add-player-name-input"
                type="text"
                required
                placeholder="e.g. Ramesh Patel"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="add-player-category-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Compulsory Category Tag
              </label>
              <select
                id="add-player-category-select"
                value={newPlayerCategory}
                onChange={(e) => setNewPlayerCategory(e.target.value as PlayerCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="REGULAR">Regular Player</option>
                <option value="FEMALE">Female Player (2x Runs hit, overs 1-2 bat/bowl)</option>
                <option value="SENIOR">Senior Citizen (+1/+2 boundary, min 6 balls, solo over 5 in semis)</option>
                <option value="KID">Kids / Junior Player (+1/+2 boundary, bats &lt; 6 ov)</option>
              </select>
            </div>

            <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newPlayerIsCaptain}
                onChange={(e) => setNewPlayerIsCaptain(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
              />
              <span className="font-bold">Assign as Team Captain</span>
            </label>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddPlayerModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30"
              >
                Add Player
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT PLAYER MODAL */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUpdatePlayer} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              <span>Edit Player Details</span>
            </h3>

            <div>
              <label htmlFor="edit-player-name-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Player Full Name
              </label>
              <input
                id="edit-player-name-input"
                type="text"
                required
                value={editPlayerName}
                onChange={(e) => setEditPlayerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="edit-player-category-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Compulsory Category Tag
              </label>
              <select
                id="edit-player-category-select"
                value={editPlayerCategory}
                onChange={(e) => setEditPlayerCategory(e.target.value as PlayerCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="REGULAR">Regular Player</option>
                <option value="FEMALE">Female Player (2x Runs hit, overs 1-2 bat/bowl)</option>
                <option value="SENIOR">Senior Citizen (+1/+2 boundary, min 6 balls, solo over 5 in semis)</option>
                <option value="KID">Kids / Junior Player (+1/+2 boundary, bats &lt; 6 ov)</option>
              </select>
            </div>

            <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={editPlayerIsCaptain}
                onChange={(e) => setEditPlayerIsCaptain(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
              />
              <span className="font-bold">Assign as Team Captain</span>
            </label>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPlayer(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
