'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Users, 
  Zap, 
  Trophy, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle 
} from 'lucide-react';

export const RuleBookViewer: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('all');
  const [ruleSearch, setRuleSearch] = useState('');

  const sections = [
    { id: 'all', label: 'All Rules' },
    { id: 'awards', label: 'Awards & Performance Points' },
    { id: 'team', label: 'Team Formation' },
    { id: 'batting', label: 'Batting & Pairs' },
    { id: 'bonus', label: 'Bonus Runs & Scoring' },
    { id: 'bowling', label: 'Bowling & Extras' },
    { id: 'power', label: 'Power Over' },
    { id: 'playoffs', label: 'Semis & Finals' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Official Rulebook Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Official Document</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                PDF Certified Rules
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              ADIOR STONE Presents KVO BOX CRICKET TOURNAMENT
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Official Tournament Rulebook encoded into the scoring system.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-right hidden sm:block">
            <span className="text-slate-400 block font-semibold">Ball Specification:</span>
            <span className="text-amber-400 font-bold">Medium Tennis Ball (Decathlon)</span>
          </div>
        </div>

        {/* Section Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto mt-6 pt-4 border-t border-slate-700/60 no-scrollbar">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeSection === s.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AWARDS & INDIVIDUAL PERFORMANCE POINTS */}
        {(activeSection === 'all' || activeSection === 'awards') && (
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Official Scoring System</span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5 flex items-center space-x-2">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <span>Individual Performance Points & Best Player Awards</span>
                </h3>
              </div>
              <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                4 Best Player Categories
              </span>
            </div>

            {/* 4 Official Awards */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Tournament Best Player Awards (4 Categories)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Category 1</span>
                  <h5 className="text-base font-black text-white mt-1">Best Male Player</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Highest total performance points among Male / Regular players</p>
                </div>
                <div className="bg-slate-950/70 border border-pink-500/30 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider">Category 2</span>
                  <h5 className="text-base font-black text-white mt-1">Best Female Player</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Highest total performance points among Female players</p>
                </div>
                <div className="bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Category 3</span>
                  <h5 className="text-base font-black text-white mt-1">Best Kid Player</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Highest total performance points among Junior / Kid players</p>
                </div>
                <div className="bg-slate-950/70 border border-purple-500/30 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Category 4</span>
                  <h5 className="text-base font-black text-white mt-1">Best Senior Player</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Highest total performance points among Senior Citizen players</p>
                </div>
              </div>
            </div>

            {/* Performance Points Table Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Batting Points */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h5 className="text-xs font-black uppercase text-amber-400 tracking-wider border-b border-slate-800 pb-2">
                  🏏 Batting Points
                </h5>
                <ul className="text-xs space-y-1.5 text-slate-300">
                  <li className="flex justify-between">
                    <span>Every actual run scored:</span>
                    <strong className="text-emerald-400">+1 pt</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Four (additional bonus):</span>
                    <strong className="text-emerald-400">+2 pts (6 total)</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Six (additional bonus):</span>
                    <strong className="text-emerald-400">+3 pts (9 total)</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>1D declaration:</span>
                    <strong className="text-emerald-400">+1 pt</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>2D declaration:</span>
                    <strong className="text-emerald-400">+2 pts</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Every dismissal (out):</span>
                    <strong className="text-rose-400">-5 pts</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Dot ball:</span>
                    <strong className="text-slate-400">0 pts</strong>
                  </li>
                </ul>
              </div>

              {/* Bowling Points */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h5 className="text-xs font-black uppercase text-purple-400 tracking-wider border-b border-slate-800 pb-2">
                  🎯 Bowling Points
                </h5>
                <ul className="text-xs space-y-1.5 text-slate-300">
                  <li className="flex justify-between">
                    <span>Wicket (excluding run-outs):</span>
                    <strong className="text-emerald-400">+10 pts</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Dot ball:</span>
                    <strong className="text-emerald-400">+2 pts</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Wide ball:</span>
                    <strong className="text-rose-400">-2 pts</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>No-ball:</span>
                    <strong className="text-rose-400">-2 pts</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Actual run conceded off bat:</span>
                    <strong className="text-rose-400">-0.5 pts / run</strong>
                  </li>
                </ul>
              </div>

              {/* Fielding Points */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h5 className="text-xs font-black uppercase text-emerald-400 tracking-wider border-b border-slate-800 pb-2">
                  🧤 Fielding Points
                </h5>
                <ul className="text-xs space-y-1.5 text-slate-300">
                  <li className="flex justify-between">
                    <span>Catch taken:</span>
                    <strong className="text-emerald-400">+5 pts</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Direct run-out:</span>
                    <strong className="text-emerald-400">+8 pts</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Assisted run-out (max 2 fielders):</span>
                    <strong className="text-emerald-400">+4 pts each</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Stumping:</span>
                    <strong className="text-emerald-400">+5 pts</strong>
                  </li>
                </ul>
              </div>
            </div>

            {/* Official Award Selection & Calculation Rules */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
              <h5 className="font-bold text-white uppercase tracking-wider text-[11px] text-amber-300">
                Official Selection Rules & Criteria
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div>• <strong>Scoring:</strong> Exclude Power Over and special batting multipliers.</div>
                <div>• <strong>1D / 2D:</strong> Count runs only once, within actual runs.</div>
                <div>• <strong>Eligibility:</strong> Same scoring for male, female, junior, and senior players.</div>
                <div>• <strong>Matches:</strong> Only the three league matches count for tournament awards.</div>
                <div>• <strong>Super Over:</strong> Exclude Super Over performances.</div>
                <div>• <strong>Tie-breaker:</strong> Higher wickets, actual runs, fielding points, then fewer dismissals.</div>
              </div>
            </div>
          </div>
        )}

        {/* 1. TEAM FORMATION & COMPULSORY PARTICIPATION */}
        {(activeSection === 'all' || activeSection === 'team') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-amber-400 flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Users className="w-5 h-5 text-amber-400" />
              <span>1. Team Formation & Compulsory Rules</span>
            </h3>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>9 Players per Team:</strong> Each squad consists of exactly 9 players.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Compulsory Composition:</strong> Every team must compulsory include:
                  <br />• 2 Female players
                  <br />• 1 Senior Citizen player
                  <br />• 1 Kids player (Junior)
                  <br />• 1 Captain
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Active Participation:</strong> At any given point, 1 kid, 1 senior, and 2 female players have to play on the ground.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>All compulsory players must participate in both batting and fielding.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Every player must field for the entire innings.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Every player has to play two league matches mandatorily.</span>
              </li>
            </ul>
          </div>
        )}

        {/* 2. BATTING & PAIRS */}
        {(activeSection === 'all' || activeSection === 'batting') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-emerald-400 flex items-center space-x-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>2. Batting Rules & Pair Rotation</span>
            </h3>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>2 Overs per Pair:</strong> Each pair bats for 2 overs continuously.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Overs 1 & 2:</strong> The female pair shall bat the first two overs mandatory.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Continuous Batting & Negative Scores:</strong> Batters continue batting even after getting out! <strong>2 runs are deducted for every dismissal</strong> (-2). If the team is on 0, the score becomes negative (-2, -4, etc.). If a catch is taken by a female player, <strong>4 runs are deducted (-4: -2 dismissal + -2 female catch reduction)</strong> in standard overs, and <strong>-7 runs in Power Over</strong>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Senior Citizen Quota:</strong> Senior citizen player must face at least 6 balls during the innings.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Junior Player Quota:</strong> Junior player must bat before completion of the 6th over.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Retirement is not allowed unless due to injury. The pair will retire.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Senior citizen may use a runner only for medical conditions/injury/breathing. Opposing captain selects the runner from batting team players.</span>
              </li>
            </ul>
          </div>
        )}

        {/* 3. BONUS RUNS & SCORING */}
        {(activeSection === 'all' || activeSection === 'bonus') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-pink-400 flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <span>3. Bonus Runs & Scoring Formulas</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 p-3 rounded-xl border border-pink-500/30">
                <span className="text-pink-300 font-bold block mb-1">Women Player Runs Rule:</span>
                <p>Runs hit by women players are <strong>doubled</strong>!</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-1">
                <span className="text-amber-300 font-bold block mb-1">Boundary Extra for Female, Senior & Kid:</span>
                <p>• <strong>Four:</strong> +1 extra run (Senior/Kid = 5 runs, Female = (4x2)+1 = 9 runs)</p>
                <p>• <strong>Six:</strong> +2 extra runs (Senior/Kid = 8 runs)</p>
                <p className="text-pink-300 font-bold mt-1 bg-pink-500/10 p-2 rounded border border-pink-500/20">
                  Official Example: If a woman hits a six, score is: <br />
                  <span className="font-mono text-white text-sm">(6 x 2) + 2 = 14 runs!</span>
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/30">
                <span className="text-purple-300 font-bold block mb-1">Side Net Declaration (1D / 2D):</span>
                <p>• Ball going out through sides is <strong>1D</strong> (1 run).</p>
                <p>• If hit by a female player, it is <strong>2D</strong> (2 runs).</p>
                <p>• During Power Over, power over doubling applies.</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. BOWLING & EXTRAS */}
        {(activeSection === 'all' || activeSection === 'bowling') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-blue-400 flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Zap className="w-5 h-5 text-blue-400" />
              <span>4. Bowling, Throwing & Extras</span>
            </h3>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>1 Over Mandatory:</strong> Everyone on the team has to bowl one over compulsorily.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Female Bowler Mandate:</strong> Female bowlers must bowl to the female pair in Overs 1 & 2.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>No Consecutive Overs:</strong> No bowler can bowl consecutive overs.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Throwing Action Only:</strong> Conventional bowling action is not allowed. Bowlers must keep feet parallel without moving/lifting leg. Female bowlers may take up to 2 steps.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Extras:</strong> Wide = 1 run + extra ball. No-ball = 1 run + free hit. <strong>No leg byes</strong>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Fielding Restrictions:</strong> Only 3 players behind bowling wickets, only 4 players on leg side.</span>
              </li>
            </ul>
          </div>
        )}

        {/* 5. POWER OVER */}
        {(activeSection === 'all' || activeSection === 'power') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-purple-400 flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Zap className="w-5 h-5 text-purple-400" />
              <span>5. Power Over Rules</span>
            </h3>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>1 Power Over per Innings:</strong> Batting team can choose any over from <strong>Over 3 to Over 8</strong>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Declaration Before Innings:</strong> Must be declared to umpire before innings starts. Once declared, cannot be changed.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Double Runs off Bat:</strong> 1=2, 2=4, 3=6, 4=8, 6=12. Runs off bat on No-Ball doubled.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Extras in Power Over:</strong> Wide & No-ball penalties count as normal (1 run, not doubled). Byes not doubled.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Power Over Wickets:</strong> Deducts <strong>5 runs</strong> (-5).</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Woman Catch in Power Over:</strong> If a woman takes a catch during power over: <strong>5 + 2 = 7 runs deducted (-7)</strong>!</span>
              </li>
            </ul>
          </div>
        )}

        {/* 6. PLAYOFFS / SEMIS / FINALS */}
        {(activeSection === 'all' || activeSection === 'playoffs') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-amber-400 flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>6. Semi-Finals, Finals & Super Over</span>
            </h3>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>9-Over Special Format:</strong> Semis and Finals are 9 overs per innings. All 9 players must bowl 1 over each compulsorily.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>5th Over Senior Solo Rule:</strong> The 5th over must be bowled by the Senior Citizen player, and opposing Senior Citizen bats solo!</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Power Over Restriction:</strong> In Semis/Finals, Power Over can be any over except 1, 2, and 5.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Tie Breaker (Super Over):</strong> 1 over per team, 1 batting pair, 1 nominated bowler (bowler cannot bat).</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Dimensions:</strong> Ground width: 110 inches; ground length: 130 inches; pitch/stumps: 20 yards.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
