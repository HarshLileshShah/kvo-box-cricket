'use client';

import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Mic,
  Trophy,
  Users,
  CheckCircle2,
  Coffee,
  Utensils,
  Dices,
  Ticket,
  Sparkles,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Camera,
  Award,
  Search,
  Filter,
  Zap,
  Flame,
  Volume2,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

interface EventScheduleItem {
  id: string;
  time: string;
  title: string;
  category: 'MATCH' | 'CEREMONY' | 'FOOD' | 'ACTIVITY' | 'ADMIN';
  location?: string;
  badge?: string;
  description: string;
  turf1Match?: string;
  turf2Match?: string;
  speechKey?: string;
}

interface SpeechBrief {
  key: string;
  timeTitle: string;
  tag: string;
  script: string;
  tips?: string[];
}

export const EventScheduleViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'speeches' | 'responsibilities'>('timeline');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSpeech, setExpandedSpeech] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const scheduleData: EventScheduleItem[] = [
    {
      id: 'item-1',
      time: '07:30 AM',
      title: 'Participants Report to Venue',
      category: 'ADMIN',
      badge: 'Arrival',
      description: 'All 6 team squads, captains, owners, and officials arrive at BCU Basecamp.',
      speechKey: 'arrival'
    },
    {
      id: 'item-2',
      time: '7:30 – 8:20 AM',
      title: 'Registration, Breakfast & Team Gathering',
      category: 'FOOD',
      badge: 'Breakfast',
      description: 'Player desk registration, distribution of team credentials/merch, hot breakfast served.',
      speechKey: 'arrival'
    },
    {
      id: 'item-3',
      time: '08:20 AM',
      title: 'Assembly Announcement by Host',
      category: 'CEREMONY',
      badge: 'Assembly',
      description: 'Host calls all 6 teams, team owners, captains, and families to assemble near the main playing arena.',
      speechKey: 'assembly'
    },
    {
      id: 'item-4',
      time: '8:30 – 8:35 AM',
      title: 'Welcome & Opening Address by Host',
      category: 'CEREMONY',
      badge: 'Opening 🎤',
      description: 'Official welcome to players, sponsors, owners, and guests for the KVO + Adior Stones Box Cricket Tournament.',
      speechKey: 'welcome'
    },
    {
      id: 'item-5',
      time: '8:35 – 8:40 AM',
      title: "President's Address",
      category: 'CEREMONY',
      badge: 'Keynote',
      description: 'President of Sri Kutchi Visa Oswal Jain Samaj Bengaluru addresses the gathering to officially inaugurate the games.',
      speechKey: 'president'
    },
    {
      id: 'item-6',
      time: '8:40 – 8:50 AM',
      title: 'Introduction of 6 Teams & Team Photographs',
      category: 'CEREMONY',
      badge: 'Photos 📸',
      description: 'All 6 franchises called to stage with owners & captains for official team photos (45–60 sec per team).',
      speechKey: 'meet_teams'
    },
    {
      id: 'item-7',
      time: '8:50 – 8:55 AM',
      title: 'Tournament Format, Rules & Scoring Briefing',
      category: 'ADMIN',
      badge: 'Briefing 📋',
      description: 'Organising committee explains the 8-over format, 4 batting pairs, Power Over declaration rule, female batter rule, and live online score app.',
      speechKey: 'rules_briefing'
    },
    {
      id: 'item-8',
      time: '8:55 – 9:00 AM',
      title: 'Introduction of Umpires, Scorers & Opening Match Call',
      category: 'ADMIN',
      badge: 'Officials ⚖️',
      description: 'Umpires and official scorers introduced. Captains of Match 1 & Match 2 report to Turfs 1 & 2 for the Toss.',
      speechKey: 'officials'
    },
    {
      id: 'item-9',
      time: '9:00 – 10:00 AM',
      title: '🏏 Round 1: Match 1 & Match 2 (Simultaneous)',
      category: 'MATCH',
      badge: 'League R1',
      location: 'Turf 1 & Turf 2',
      turf1Match: 'Truflo Strikers vs Amsteel Inferno',
      turf2Match: 'Kraftech Titans vs Mavericks Royals',
      description: 'Opening league matches kick off simultaneously on both courts.',
      speechKey: 'round1'
    },
    {
      id: 'item-10',
      time: '10:00 – 11:00 AM',
      title: '🏏 Round 2: Match 3 & Match 4 (Simultaneous)',
      category: 'MATCH',
      badge: 'League R2',
      location: 'Turf 1 & Turf 2',
      turf1Match: 'Truflo Strikers vs Leo Fanatics',
      turf2Match: 'Kraftech Titans vs Party Hunterz',
      description: 'Round 2 preliminary fixtures. 10-minute warning given at 9:50 AM to teams.',
      speechKey: 'round_warning'
    },
    {
      id: 'item-11',
      time: '11:00 – 12:00 PM',
      title: '🏏 Round 3: Match 5 & Match 6 (Simultaneous)',
      category: 'MATCH',
      badge: 'League R3',
      location: 'Turf 1 & Turf 2',
      turf1Match: 'Amsteel Inferno vs Party Hunterz',
      turf2Match: 'Mavericks Royals vs Leo Fanatics',
      description: 'Mid-league clash on both turfs. Standings race heats up.',
      speechKey: 'round_warning'
    },
    {
      id: 'item-12',
      time: 'Throughout Morning',
      title: '🎲 Board Games Lounge (Carrom, Chess, Cards & Fun)',
      category: 'ACTIVITY',
      badge: 'Senior & Family Fun',
      location: 'Clubhouse Activity Area',
      description: 'Dedicated chillout zone with board games for senior citizens, family members, and off-duty players throughout the morning.',
      speechKey: 'board_games'
    },
    {
      id: 'item-13',
      time: 'Morning Slot (TBC)',
      title: '🎟️ Special Tambola Event with Exciting Prizes',
      category: 'ACTIVITY',
      badge: 'Grand Tambola',
      location: 'Main Pavilion Lounge',
      description: 'High-energy community Tambola session with attractive spot prizes for line/full-house winners.',
      speechKey: 'tambola'
    },
    {
      id: 'item-14',
      time: '12:00 – 1:00 PM',
      title: '🏏 Round 4: Match 7 & Match 8 (Simultaneous)',
      category: 'MATCH',
      badge: 'League R4',
      location: 'Turf 1 & Turf 2',
      turf1Match: 'Amsteel Inferno vs Kraftech Titans',
      turf2Match: 'Truflo Strikers vs Mavericks Royals',
      description: 'Critical matches determining the Top 4 leaderboard positions for semifinals.',
      speechKey: 'round_warning'
    },
    {
      id: 'item-15',
      time: '1:00 – 2:00 PM',
      title: '🏏 Match 9 + Rolling Lunch Window',
      category: 'FOOD',
      badge: 'Match 9 + Lunch 🍱',
      location: 'Turf 1 & Dining Hall',
      turf1Match: 'Party Hunterz vs Leo Fanatics (Turf 1)',
      turf2Match: 'No Match on Turf 2 (Open Warmup)',
      description: 'Final league fixture. Lunch buffet opens for teams on rotation between games to keep schedule on time.',
      speechKey: 'lunch'
    },
    {
      id: 'item-16',
      time: '2:00 – 2:30 PM',
      title: 'League Standings Confirmation & Semifinals Setup',
      category: 'ADMIN',
      badge: 'Playoff Scenarios',
      description: 'Official points validation, tie-break computations (NRR & Head-to-Head), lunch wrap-up, and captain brief for Semifinalists.',
      speechKey: 'league_complete'
    },
    {
      id: 'item-17',
      time: '2:15 – 2:30 PM',
      title: '🔥 Live Announcement of Top 4 Semi-Finalists',
      category: 'CEREMONY',
      badge: 'Announcement 📢',
      description: 'Host gathers all attendees to officially announce the 4 qualifying teams and semi-final matchups.',
      speechKey: 'semis_announce'
    },
    {
      id: 'item-18',
      time: '2:30 – 3:45 PM',
      title: '🏏 SEMI-FINALS (Turf 1 & Turf 2 Simultaneous)',
      category: 'MATCH',
      badge: 'Knockout Stage 🔥',
      location: 'Turf 1 & Turf 2',
      turf1Match: 'Semi-Final 1: Rank 1 vs Rank 4',
      turf2Match: 'Semi-Final 2: Rank 2 vs Rank 3',
      description: 'The final four battle for a place in the Grand Final. Winner advances; loser eliminated.',
      speechKey: 'semis_hype'
    },
    {
      id: 'item-19',
      time: '3:30 – 4:15 PM',
      title: '☕ High Tea & Finalists Rest / Preparation',
      category: 'FOOD',
      badge: 'High Tea ☕',
      location: 'Dining Lounge',
      description: 'Hot chai, coffee, snacks served to all attendees while finalists rest, hydrate, and strategize.',
      speechKey: 'high_tea'
    },
    {
      id: 'item-20',
      time: '3:50 – 3:55 PM',
      title: 'Grand Final Assembly Call',
      category: 'CEREMONY',
      badge: 'Call to Arena 🏟️',
      description: 'Host calls all spectators, families, and remaining squads to encircle Turf 1 for the Grand Final.',
      speechKey: 'call_back'
    },
    {
      id: 'item-21',
      time: '3:55 – 4:00 PM',
      title: "Captains' Toss & Grand Finalists' Photograph",
      category: 'CEREMONY',
      badge: 'Toss & Photo 📸',
      location: 'Turf 1 Arena',
      description: 'Official coin toss between the two finalist captains with tournament dignitaries and photo op.',
      speechKey: 'finalists_photo'
    },
    {
      id: 'item-22',
      time: '4:00 – 5:00 PM',
      title: '🏆 THE GRAND FINAL',
      category: 'MATCH',
      badge: 'Championship Match 🏆',
      location: 'Turf 1 Arena',
      description: 'The pinnacle championship match of the KVO Box Cricket Tournament! Two top teams fight for the championship trophy.',
      speechKey: 'grand_final'
    },
    {
      id: 'item-23',
      time: '5:00 PM onwards',
      title: '🏆 Grand Prize Distribution & Awards Ceremony',
      category: 'CEREMONY',
      badge: 'Trophy Ceremony 🏅',
      description: 'Medals, individual category awards (Male, Female, Senior, Kid), Runner-Up trophy, and Championship Trophy awarded.',
      speechKey: 'awards'
    },
    {
      id: 'item-24',
      time: 'Closing',
      title: "📸 Champions Photo & Mega Group Photograph",
      category: 'CEREMONY',
      badge: 'Grand Finale 📸',
      description: 'All 6 squads, committee members, umpires, scorers, volunteers, and families unite for the official tournament group photo.',
      speechKey: 'closing'
    }
  ];

  const speechBriefs: SpeechBrief[] = [
    {
      key: 'arrival',
      timeTitle: '7:30 AM – Arrival, Breakfast & Registration',
      tag: 'Morning Arrival',
      script: `"Good morning everyone! Welcome to BCU Basecamp for the KVO + Adior Stones Box Cricket Tournament. Breakfast is being served in the dining pavilion. Please ensure all team players complete registration and kit collection. We will begin our official tournament briefing at 8:30 AM, so we request all players to be ready and assembled near the arena by 8:15 AM."`,
      tips: ['Greet arriving teams warmly', 'Direct to breakfast and kit desk', 'Remind captains to finalize playing lineups']
    },
    {
      key: 'assembly',
      timeTitle: '8:15 AM – Assembly Announcement',
      tag: 'Assembly Call',
      script: `"Good morning everyone! Hope you've enjoyed breakfast. We are about 10 minutes away from officially starting our tournament. Can I request all six teams, team owners, captains, players and supporters to please gather near the main playing arena for our opening ceremony and briefing?"`,
      tips: ['Project voice across dining and warmup turf', 'Help team owners bring players to the front']
    },
    {
      key: 'welcome',
      timeTitle: '8:30 AM – Welcome & Opening 🎤',
      tag: 'Opening Speech',
      script: `"Good morning everyone, and a very warm welcome to our KVO + Adior Stones Box Cricket Tournament! It's wonderful to see all six teams, players, team owners, families, friends and supporters together this morning.

Over the last few weeks, there's been tremendous effort behind the scenes. Teams have been practising, playing practice matches, planning combinations and preparing for today.

So before we begin, let's give a big round of applause to all our participants, and especially our team owners and captains who have put in immense effort in bringing their teams together!

Today is certainly about competition, but more importantly, it's about enjoying the game, spending quality time together and celebrating the sporting spirit of our community."`,
      tips: ['Acknowledge sponsors (Adior Stones) and community leadership', 'Keep energy and excitement high']
    },
    {
      key: 'president',
      timeTitle: "8:35 AM – President's Address",
      tag: 'Leadership Keynote',
      script: `"To officially open today's tournament, I'd now like to invite our Committee President to say a few words and declare the tournament officially open!"`,
      tips: ['Introduce President with dignity', 'Allocate 3–5 minutes maximum']
    },
    {
      key: 'meet_teams',
      timeTitle: '8:40 AM – Meet the 6 Teams 📸',
      tag: 'Team Introduction',
      script: `"And now, before we see them on the cricket field, let's meet our six contenders! As I call each team, can I request the team owner, captain and all players to come forward for a quick team photograph?

1. Party Hunterz
2. Amsteel Inferno
3. Kraftech Titans
4. Leo Fanatics
5. Truflo Strikers
6. Mavericks Royals

There we have them, our six spectacular teams! A big round of applause and all the very best to every player!"`,
      tips: ['Keep each team photo to 45–60 seconds to stay on schedule', 'Announce franchise names with high energy']
    },
    {
      key: 'rules_briefing',
      timeTitle: '8:50 AM – Tournament & Scoring Briefing 📋',
      tag: 'Rules & Tech',
      script: `"Before we start playing, here are the most important things everyone needs to know:
• Match Format: 8 overs per innings, 4 batting pairs of 2 overs each.
• Mandatory Female Rule: In Overs 1 & 2, at least one batter in the batting pair must be Female!
• 1 Over Per Bowler Limit: Every player bowls exactly 1 over in the 8-over innings.
• Power Over Rule: Must be declared before the first ball is bowled. All bat runs double, wickets deduct 5 runs (7 if female catch).
• Live Score App: Follow every ball live by scanning the QR code displayed around the arena or accessing our tournament web app!
• Standings & Qualification: Win = 2 Pts, Draw = 1 Pt. Top 4 teams qualify for the Semi-Finals!"`,
      tips: ['Emphasize that the Umpire decision is final', 'Remind that live ball-by-ball score is online']
    },
    {
      key: 'officials',
      timeTitle: '8:55 AM – Introduce the Officials ⚖️',
      tag: 'Officials Respect',
      script: `"Of course, no tournament can succeed without the officials making sure everything runs smoothly. Let's welcome our official Umpires, Scorers and Match Coordinators! 

A big thank you to all our officials for their time today. A sincere request to all our players: play hard, compete with passion, but always respect our officials, their decisions, and the sporting spirit of the game."`,
      tips: ['Ensure players applaud the officiating team']
    },
    {
      key: 'round1',
      timeTitle: '9:00 AM – Tournament Starts! 🏏',
      tag: 'Kickoff Call',
      script: `"And now... the wait is over. It's time to play some cricket! Starting right now at 9:00 AM:
• On Turf 1: Truflo Strikers vs Amsteel Inferno
• On Turf 2: Kraftech Titans vs Mavericks Royals

Captains, please report to the center turf for the toss with the umpires. Play hard, play fair, and enjoy the game. LET'S GET THE TOURNAMENT STARTED!"`,
      tips: ['Announce both turfs clearly so crowd can choose where to watch']
    },
    {
      key: 'round_warning',
      timeTitle: 'Between Rounds – 10-Minute Warning ⚠️',
      tag: 'Punctuality Call',
      script: `"A quick call for our next four teams coming up in 10 minutes:
Players, please start warming up and making your way to your respective turf. Captains, report to the scorers for the playing lineup!"`,
      tips: ['This announcement is critical: prevents match delays and keeps the schedule on track']
    },
    {
      key: 'board_games',
      timeTitle: 'Morning – Board Games Announcement 🎲',
      tag: 'Family & Seniors',
      script: `"And cricket is not the only action today! For our senior citizens and anyone wanting a relaxed break from cricket, we have a wonderful Board Games lounge with Carrom, Chess, Cards, and more set up in the clubhouse. Please feel free to join in and enjoy with friends and family!"`,
      tips: ['Invite seniors and non-playing family members warmly']
    },
    {
      key: 'tambola',
      timeTitle: 'Morning Slot – Special Tambola Event 🎟️',
      tag: 'Tambola Hype',
      script: `"Attention everyone! Here's something everyone has been waiting for: our Special Tournament Tambola! Tambola will begin in 10 minutes at the Pavilion Lounge. Get your tickets ready and join us — we have some exciting spot prizes waiting for our winners!"`,
      tips: ['Give a 10-minute warning, then a 5-minute final call']
    },
    {
      key: 'lunch',
      timeTitle: '1:00 PM – Lunch Arrangements 🍱',
      tag: 'Rolling Lunch',
      script: `"Lunch is now officially open at the dining hall! Because our matches continue without pause, we request players and supporters to enjoy lunch during your team's available break window. Teams scheduled for upcoming games, please keep track of your time and be ready 10 minutes prior."`,
      tips: ['Avoid hard tournament pause: rolling lunch keeps timetable intact']
    },
    {
      key: 'league_complete',
      timeTitle: '2:00 PM – League Stage Complete 🏁',
      tag: 'League Wrap',
      script: `"Ladies and gentlemen, that brings us to the conclusion of our thrilling 9-match league stage! We've seen incredible sixes, nail-biting finishes, and outstanding sportsmanship. The organising committee and official scorers are now finalizing the official standings and tie-breakers. We will be back shortly with our Top 4 Semi-Finalists!"`,
      tips: ['Allow scorers 10 minutes to verify points and NRR before announcing']
    },
    {
      key: 'semis_announce',
      timeTitle: '2:15 PM – Semi-Finals Announcement 🔥',
      tag: 'Top 4 Reveal',
      script: `"Alright everyone, we have our official results! Six teams battled hard this morning across nine matches. Now, we are down to our final four.

Congratulations to our Semi-Finalists:
🥇 Rank 1
🥈 Rank 2
🥉 Rank 3
🏏 Rank 4

Our Semi-Final clashes starting at 2:30 PM:
• Semi-Final 1 on Turf 1: Rank 1 vs Rank 4
• Semi-Final 2 on Turf 2: Rank 2 vs Rank 3

Captains, please report for the toss!"`,
      tips: ['Announce with tremendous excitement and drum rolls if available']
    },
    {
      key: 'semis_hype',
      timeTitle: '2:30 PM – Semi-Finals Hype Call 🏟️',
      tag: 'Knockout Hype',
      script: `"Everyone, we've reached the business end of the tournament! If you're in the lounge or dining area, now's the time to gather around the courts and support your teams. Four teams, two matches, and only two tickets to the Grand Final. Let's make some noise for our Semi-Finalists!"`,
      tips: ['Draw all spectators towards the two courts']
    },
    {
      key: 'high_tea',
      timeTitle: '3:30 PM – High Tea & Finalists Rest ☕',
      tag: 'High Tea Break',
      script: `"What a sensational pair of Semi-Finals! We now have our two grand finalists. Before the ultimate showdown, hot High Tea and refreshments are available at the pavilion. Please enjoy tea, and be back at Turf 1 before 4:00 PM for the GRAND FINAL!"`,
      tips: ['Give finalists 25–30 minutes to catch their breath and rehydrate']
    },
    {
      key: 'call_back',
      timeTitle: '3:50 PM – Call Everyone Back to Arena 📢',
      tag: 'Crowd Gathering',
      script: `"Ladies and gentlemen, hope you've enjoyed High Tea! Can I request everyone to please assemble around Turf 1 now? We are just 10 minutes away from the GRAND FINAL!"`,
      tips: ['Ensure all 6 teams and families encircle Turf 1']
    },
    {
      key: 'finalists_photo',
      timeTitle: "3:55 PM – Finalists Toss & Captains' Photo 📸",
      tag: 'Pre-Final Toss',
      script: `"Before we kick off, can I invite the captains of our two finalists forward with our President and committee for the official toss and photograph?"`,
      tips: ['Take quick photo with the championship trophy']
    },
    {
      key: 'grand_final',
      timeTitle: '4:00 PM – THE GRAND FINAL 🏆',
      tag: 'Final Kickoff',
      script: `"Ladies and gentlemen... Six teams started this morning. Nine league matches. Two intense semi-finals. And now we are down to the final two!

Please put your hands together for our Grand Finalists! Both teams have played fantastic cricket to reach here today. To our finalists: leave it all on the turf, play with pride, and enjoy this momentous game. 

Everyone else, let's make some noise... IT'S TIME FOR THE GRAND FINAL!"`,
      tips: ['Maximum energy! Get the crowd cheering with team names']
    },
    {
      key: 'awards',
      timeTitle: '5:00 PM – Prize Distribution Sequence 🏅',
      tag: 'Awards Order',
      script: `"What an electrifying Grand Final! Before we crown our champions, let's give a huge round of applause to both finalists and all six participating teams!

Official Presentation Order:
1. Recognition of Volunteers, Umpires, Scorers & Organising Committee
2. Individual Category Awards:
   • Best Male Player
   • Best Female Player
   • Best Kid Player
   • Best Senior Player
   • Player of the Final & Player of the Tournament
3. Runners-Up Trophy Presentation 🥈
4. Champions Trophy Presentation 🏆:
'And now, the moment everyone has been waiting for... Ladies and gentlemen, put your hands together for your KVO Box Cricket Champions... [TEAM NAME]!'"`,
      tips: ['Let celebrations and cheers ring out before moving to photos', 'Keep medals and trophies arranged in order beforehand']
    },
    {
      key: 'closing',
      timeTitle: 'End – Final Closing & Mega Photo 📸',
      tag: 'Farewell & Photo',
      script: `"Before we close, a massive heartfelt thank you:
To our President and Committee, organizing team, volunteers, umpires and scorers.
To our sponsors Adior Stones for their generous backing.
To our team owners, captains, players and families who made this event unforgettable.

Let's conclude with one big family photograph together — all 6 teams, committee, elders and families, please step into the frame!"`,
      tips: ['Coordinate the photographer to capture everyone in wide-angle']
    }
  ];

  const filteredSchedule = scheduleData.filter((item) => {
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.turf1Match && item.turf1Match.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.turf2Match && item.turf2Match.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (cat: EventScheduleItem['category']) => {
    switch (cat) {
      case 'MATCH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'CEREMONY':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'FOOD':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'ACTIVITY':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/40';
      case 'ADMIN':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-700';
    }
  };

  const getCategoryIcon = (cat: EventScheduleItem['category']) => {
    switch (cat) {
      case 'MATCH':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'CEREMONY':
        return <Mic className="w-4 h-4 text-purple-400" />;
      case 'FOOD':
        return <Utensils className="w-4 h-4 text-emerald-400" />;
      case 'ACTIVITY':
        return <Dices className="w-4 h-4 text-pink-400" />;
      case 'ADMIN':
        return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700/80 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500 text-slate-950 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                Official Master Schedule
              </span>
              <span className="text-xs text-slate-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Sunday, 29th November • BCU Basecamp</span>
              </span>
            </div>

            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-emerald-300">Full Day Program: 07:30 AM – 5:30 PM</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Tournament Event Schedule & Master Program
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Complete minute-by-minute schedule of matches, opening ceremonies, entertainment, meals, Tambola, host announcements, and official responsibilities for the KVO Box Cricket Tournament.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Teams</span>
              <span className="text-lg font-black text-amber-400">6 Franchises</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Games</span>
              <span className="text-lg font-black text-emerald-400">12 Matches</span>
              <span className="text-[10px] text-slate-500 block">9 League + 2 Semis + Final</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Venue Courts</span>
              <span className="text-lg font-black text-blue-400">Turf 1 & Turf 2</span>
              <span className="text-[10px] text-slate-500 block">Simultaneous Matches</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Special Events</span>
              <span className="text-lg font-black text-purple-400">Tambola & Games</span>
              <span className="text-[10px] text-slate-500 block">For Seniors & Families</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'timeline'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Day Timeline ({scheduleData.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('speeches')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'speeches'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Host Scripts & Briefs ({speechBriefs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('responsibilities')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'responsibilities'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Roles & Regulations</span>
          </button>
        </div>

        {activeSubTab === 'timeline' && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search events, matches, timings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: TIMELINE & SCHEDULE */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 visual-scrollbar">
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'MATCH', label: '🏏 Matches (12)' },
              { id: 'CEREMONY', label: '🎤 Ceremonies' },
              { id: 'FOOD', label: '🍱 Food & High Tea' },
              { id: 'ACTIVITY', label: '🎲 Fun & Tambola' },
              { id: 'ADMIN', label: '📋 Admin & Rules' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                  categoryFilter === f.id
                    ? 'bg-slate-800 border-amber-500 text-amber-300 ring-1 ring-amber-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Timeline Cards */}
          <div className="space-y-3">
            {filteredSchedule.map((item, idx) => {
              const matchingSpeech = speechBriefs.find((s) => s.key === item.speechKey);
              const isSpeechExpanded = expandedSpeech === item.speechKey;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3.5">
                      {/* Time Block */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center min-w-24 shrink-0 shadow-inner">
                        <span className="text-xs font-mono font-black text-amber-400 block leading-tight">
                          {item.time}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block mt-0.5">
                          Schedule
                        </span>
                      </div>

                      {/* Title & Category */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border flex items-center space-x-1 ${getCategoryColor(
                              item.category
                            )}`}
                          >
                            {getCategoryIcon(item.category)}
                            <span>{item.badge || item.category}</span>
                          </span>

                          {item.location && (
                            <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                              📍 {item.location}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-white">{item.title}</h3>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                      </div>
                    </div>

                    {/* Speech Quick Toggle Button */}
                    {matchingSpeech && (
                      <button
                        onClick={() =>
                          setExpandedSpeech(isSpeechExpanded ? null : item.speechKey || null)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 shrink-0 self-start sm:self-center ${
                          isSpeechExpanded
                            ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-purple-950/40 hover:text-purple-300 hover:border-purple-600/50'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5 text-purple-400" />
                        <span>{isSpeechExpanded ? 'Hide Host Script' : 'View Host Script'}</span>
                        {isSpeechExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Turf Matchups Detail Pill */}
                  {(item.turf1Match || item.turf2Match) && (
                    <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {item.turf1Match && (
                        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span>Turf 1</span>
                          </span>
                          <span className="font-bold text-white truncate ml-2">
                            {item.turf1Match}
                          </span>
                        </div>
                      )}

                      {item.turf2Match && (
                        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Turf 2</span>
                          </span>
                          <span className="font-bold text-white truncate ml-2">
                            {item.turf2Match}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expandable Host Speech Script */}
                  {isSpeechExpanded && matchingSpeech && (
                    <div className="mt-3 pt-3 border-t border-purple-900/50 bg-purple-950/30 rounded-xl p-3.5 text-xs space-y-2 border border-purple-800/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-purple-300 flex items-center space-x-1.5">
                          <Volume2 className="w-4 h-4 text-purple-400" />
                          <span>Official Host Microphone Script:</span>
                        </span>

                        <button
                          onClick={() => handleCopy(matchingSpeech.key, matchingSpeech.script)}
                          className="px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700/50 text-[10px] font-bold flex items-center space-x-1 transition"
                        >
                          {copiedKey === matchingSpeech.key ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Script</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-slate-200 italic leading-relaxed whitespace-pre-line bg-slate-950/70 p-3 rounded-lg border border-purple-900/40 font-serif text-[13px]">
                        {matchingSpeech.script}
                      </p>

                      {matchingSpeech.tips && (
                        <div className="text-[11px] text-purple-300/80 flex items-center space-x-2 pt-1">
                          <span className="font-bold uppercase text-purple-400">Host Tips:</span>
                          <span>{matchingSpeech.tips.join(' • ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredSchedule.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                No events matched your current search and category filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HOST SPEECHES & MASTER BRIEFS */}
      {activeSubTab === 'speeches' && (
        <div className="space-y-4">
          <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-4 text-xs text-purple-200 flex items-start space-x-3">
            <Mic className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">Host & Emcee Master Guidebook</p>
              <p className="mt-0.5 text-slate-300 leading-relaxed">
                Word-for-word scripts and announcements for the host to deliver through the sound system across all ceremonies, match transitions, Tambola, and the trophy presentation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {speechBriefs.map((speech) => (
              <div
                key={speech.key}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {speech.tag}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1">
                      {speech.timeTitle}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleCopy(speech.key, speech.script)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition active:scale-95"
                  >
                    {copiedKey === speech.key ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Copy Speech</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800/80 font-serif text-slate-200 text-sm leading-relaxed whitespace-pre-line italic shadow-inner">
                  {speech.script}
                </div>

                {speech.tips && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Emcee Notes:
                    </span>
                    {speech.tips.map((t, i) => (
                      <span
                        key={i}
                        className="bg-slate-800 text-slate-300 text-[11px] px-2.5 py-0.5 rounded-full border border-slate-700"
                      >
                        ✓ {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ROLES & RESPONSIBILITIES */}
      {activeSubTab === 'responsibilities' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Host Responsibilities Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Host & Emcee Responsibilities</h3>
                  <p className="text-xs text-slate-400">10 Core Duties to Keep the Day Energized & On Time</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    num: '1',
                    title: 'Welcome Everyone & Set the Tone',
                    desc: 'Create an inclusive, high-energy, and welcoming sporting atmosphere for all ages.'
                  },
                  {
                    num: '2',
                    title: 'Introduce the President',
                    desc: 'Invite the Samaj President for the official opening remarks and keynote.'
                  },
                  {
                    num: '3',
                    title: 'Recognise Teams, Owners, Captains & Players',
                    desc: 'Give prominent shoutouts to franchise owners and captains for weeks of preparation.'
                  },
                  {
                    num: '4',
                    title: 'Coordinate Official Team Photographs',
                    desc: 'Keep photos crisp and timely (45–60 sec each) before the first ball is bowled.'
                  },
                  {
                    num: '5',
                    title: 'Explain Where Scores, Fixtures & Rules Can Be Found',
                    desc: 'Promote the online live scoring URL/QR code and physical scoreboard locations.'
                  },
                  {
                    num: '6',
                    title: 'Introduce Umpires, Scorers & Match Officials',
                    desc: 'Establish respect for umpire calls and official tournament coordinators.'
                  },
                  {
                    num: '7',
                    title: 'Announce Upcoming Matches (10-Minute Warnings)',
                    desc: 'The most important job: Call next 4 teams 10 minutes early to prevent delays.'
                  },
                  {
                    num: '8',
                    title: 'Give Lunch, Tambola, Board Games & High Tea Updates',
                    desc: 'Ensure seniors and families actively participate in the non-cricket entertainment.'
                  },
                  {
                    num: '9',
                    title: 'Build Excitement for the Semi-Finals & Final',
                    desc: 'Gather crowds around Turf 1 and ramp up cheering for the championship matches.'
                  },
                  {
                    num: '10',
                    title: 'Conduct the Prize Distribution & Closing Ceremony',
                    desc: 'Orchestrate category awards, runner-up medals, trophy presentation, and group photo.'
                  }
                ].map((item) => (
                  <div
                    key={item.num}
                    className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
                  >
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center justify-center shrink-0">
                      {item.num}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Organizing Committee Responsibilities Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Organizing Committee Mandates</h3>
                  <p className="text-xs text-slate-400">Core Tournament Regulations & Operational Rules</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    icon: <Zap className="w-4 h-4 text-purple-400" />,
                    title: 'Power Over Announcement & Pre-Match Declaration',
                    badge: 'Rule 1',
                    desc: 'Enforce mandatory Power Over declaration before ball 1 of every innings. Lock once bowling starts; whole innings without power over if opted out.'
                  },
                  {
                    icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
                    title: 'Umpire Decision is Final & Committee Dispute Authority',
                    badge: 'Disputes',
                    desc: 'On-field umpire decision is final. For any technical dispute, tournament incident, or appeal, the Organising Committee decision is supreme and binding.'
                  },
                  {
                    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
                    title: 'Live Scoreboards: Online Web App & Offline Boards',
                    badge: 'Scoring',
                    desc: 'Ensure live score URL is broadcast via prominent QR code stands around the turf, with synced updates on the physical arena scoreboard.'
                  },
                  {
                    icon: <Calendar className="w-4 h-4 text-blue-400" />,
                    title: 'Match Schedule & QR Code Distribution',
                    badge: 'Fixtures',
                    desc: 'Distribute print schedules and ensure QR codes are active for all players and supporters to check next matches on their mobile phones.'
                  },
                  {
                    icon: <Clock className="w-4 h-4 text-emerald-400" />,
                    title: 'Strict Time Discipline (Zero Time Wasting)',
                    badge: 'Timelines',
                    desc: 'Strictly monitor change of ends, bowler transitions, and innings breaks to complete all matches before sunset.'
                  },
                  {
                    icon: <Users className="w-4 h-4 text-amber-400" />,
                    title: 'Official Umpires & Match Coordinators Deployment',
                    badge: 'Officials',
                    desc: 'Coordinate certified umpires for Turf 1 and Turf 2, ensuring fair balls, leg-uplift calls, and side-net declaration judgments.'
                  },
                  {
                    icon: <CheckCircle2 className="w-4 h-4 text-teal-400" />,
                    title: 'Mandatory Team Representative Near Scorer Desk',
                    badge: 'Scoring Check',
                    desc: 'One designated non-playing team member from each playing team must sit near the official scorer while the game is in progress.'
                  },
                  {
                    icon: <Award className="w-4 h-4 text-pink-400" />,
                    title: 'Squad Rotation: Minimum 2 League Matches Per Player',
                    badge: 'Participation',
                    desc: 'Official quota rule: Every registered player in the team roster must play in at least 2 preliminary league matches.'
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
                  >
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                        <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

