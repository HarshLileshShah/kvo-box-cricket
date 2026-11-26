import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

doc = Document()

# Set page margins
sections = doc.sections
for section in sections:
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

# Styling helpers
def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_header(text, level=1):
    h = doc.add_heading(text, level=level)
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(6)
    for run in h.runs:
        run.font.name = 'Calibri'
        if level == 1:
            run.font.size = Pt(18)
            run.font.bold = True
            run.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
        elif level == 2:
            run.font.size = Pt(14)
            run.font.bold = True
            run.font.color.rgb = RGBColor(30, 41, 59) # Slate 800
        elif level == 3:
            run.font.size = Pt(12)
            run.font.bold = True
            run.font.color.rgb = RGBColor(51, 65, 85)
    return h

def add_callout(text, title="NOTE", fill_hex="F1F5F9", border_color="0EA5E9"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(6.8)
    cell = table.cell(0, 0)
    set_cell_background(cell, fill_hex)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    # Left border
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r_title = p.add_run(f"[{title}] ")
    r_title.bold = True
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(10.5)
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    r_text = p.add_run(text)
    r_text.font.name = 'Calibri'
    r_text.font.size = Pt(10)
    r_text.font.color.rgb = RGBColor(51, 65, 85)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_image_box(img_path, caption):
    if not os.path.exists(img_path):
        p = doc.add_paragraph(f"[Image Missing: {img_path}]")
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(3)
    p.add_run().add_picture(img_path, width=Inches(6.4))
    
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(12)
    r_cap = cap.add_run(f"Figure: {caption}")
    r_cap.font.name = 'Calibri'
    r_cap.font.size = Pt(9.5)
    r_cap.font.italic = True
    r_cap.font.color.rgb = RGBColor(100, 116, 139)

# ----------------- COVER / TITLE SECTION -----------------
title_p = doc.add_paragraph()
title_p.paragraph_format.space_before = Pt(10)
title_p.paragraph_format.space_after = Pt(2)
r_pre = title_p.add_run("ADIOR STONES PRESENTS\n")
r_pre.font.name = 'Calibri'
r_pre.font.size = Pt(12)
r_pre.font.bold = True
r_pre.font.color.rgb = RGBColor(217, 119, 6) # Amber 600

r_title = title_p.add_run("KVO Box Cricket Tournament 2026\nOfficial User & Scorer Manual")
r_title.font.name = 'Calibri'
r_title.font.size = Pt(24)
r_title.font.bold = True
r_title.font.color.rgb = RGBColor(15, 23, 42)

sub_p = doc.add_paragraph()
sub_p.paragraph_format.space_after = Pt(14)
r_sub = sub_p.add_run("Sunday, 29th November 2026 • BCU Basecamp (Turf 1 & Turf 2)\nStep-by-Step Operating Guide, Match Scoring, Ball Correction Rules & Official Points System")
r_sub.font.name = 'Calibri'
r_sub.font.size = Pt(11)
r_sub.font.color.rgb = RGBColor(71, 85, 105)

add_callout(
    "This official manual guides team captains, players, and match scorers through the live scoring system, "
    "match fixtures, Playing 8 lineup validation, scoring keypads, wicket attribution, over correction rules, "
    "and the official Excel-based 4-category Best Player calculation.",
    title="TOURNAMENT HANDBOOK",
    fill_hex="FEF3C7",
    border_color="D97706"
)

# ----------------- SECTION 1: USER ROLES & CREDENTIALS -----------------
add_header("1. User Roles & Official Credentials", level=1)
p_roles = doc.add_paragraph("The scoring platform manages matches concurrently across Turf 1 and Turf 2 with strict role-based access control:")
p_roles.paragraph_format.space_after = Pt(6)

roles_table = doc.add_table(rows=4, cols=3)
roles_table.alignment = WD_TABLE_ALIGNMENT.CENTER
roles_table.autofit = False
for col, w in zip(roles_table.columns, [Inches(1.8), Inches(1.8), Inches(3.2)]):
    col.width = w

headers = ["User / Role", "Login Credentials", "Permissions & Access"]
for i, h in enumerate(headers):
    cell = roles_table.cell(0, i)
    set_cell_background(cell, "0F172A")
    set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(h)
    r.bold = True
    r.font.name = 'Calibri'
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(255, 255, 255)

roles_data = [
    ("Public Spectator", "No Login Needed", "Real-time access to live scoreboards, match fixtures, points table, player stats, and commentary."),
    ("Sagar (Turf 1 Scorer)\nBhavin (Turf 2 Scorer)", "sagar / kvo@2026\nbhavin / kvo@2026", "Full scoring keypad access. Can submit Playing 8, conduct toss, record balls/wickets, and edit/undo deliveries in CURRENT OVER ONLY."),
    ("Super Admin", "admin / kvo@2026", "Unrestricted tournament control. Can reset matches, reassign lineups, and edit/delete ANY delivery from ANY past over in any match.")
]

for row_idx, data in enumerate(roles_data, start=1):
    fill = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
    for col_idx, text in enumerate(data):
        cell = roles_table.cell(row_idx, col_idx)
        set_cell_background(cell, fill)
        set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(15, 23, 42)

doc.add_paragraph().paragraph_format.space_after = Pt(10)

# ----------------- SECTION 2: LIVE SCOREBOARD -----------------
add_header("2. Step 1 — Viewing Live Scores (Spectator Mode)", level=1)
p_live = doc.add_paragraph(
    "All spectators, players, and officials can view live matches without logging in by selecting the 'Live Score' tab. "
    "The screen refreshes automatically every 4 seconds to reflect deliveries as they happen on the field."
)
p_live.paragraph_format.space_after = Pt(6)

img_live = "/Users/apple/projects/cricket /public/screenshots/01_live_scoreboard.png"
add_image_box(img_live, "Public Live Scoreboard displaying current match status, active pair, bowler figures, and commentary")

doc.add_paragraph("Key elements on the Live Scoreboard:").paragraph_format.space_after = Pt(2)
bullet_items = [
    ("Match Header & Stage: ", "Displays team names, logos, turf number (Turf 1 or 2), and match stage (League, Semifinal, Final)."),
    ("Score & Target Equation: ", "Displays current runs, wickets fallen, completed overs, current run rate (CRR), and target equation for chasing teams."),
    ("Active Batters Card: ", "Live stats for striker (*) and non-striker, showing runs, balls, strike rates, 4s, 6s, and demographic tags (Female, Kid, Senior, Regular)."),
    ("Bowler Figures: ", "Current bowler's Overs, Maidens, Runs conceded, Wickets, and Economy rate."),
    ("Recent Over Feed & Commentary: ", "Visual badges showing each delivery in the active over (1, •, 4, Wkt, Wd), followed by chronological ball commentary.")
]
for bold_prefix, text in bullet_items:
    bp = doc.add_paragraph(style='List Bullet')
    bp.paragraph_format.space_before = Pt(1)
    bp.paragraph_format.space_after = Pt(2)
    r1 = bp.add_run(bold_prefix)
    r1.bold = True
    r1.font.name = 'Calibri'
    r1.font.size = Pt(10)
    r2 = bp.add_run(text)
    r2.font.name = 'Calibri'
    r2.font.size = Pt(10)

# ----------------- SECTION 3: FIXTURES & SCHEDULE -----------------
add_header("3. Step 2 — Viewing Fixtures & the Tournament Schedule", level=1)
p_sched = doc.add_paragraph(
    "The 'Fixtures' tab presents the official parallel dual-turf schedule for Sunday, 29th November 2026 at BCU Basecamp. "
    "Matches run concurrently across Turf 1 and Turf 2."
)
p_sched.paragraph_format.space_after = Pt(6)

img_sched = "/Users/apple/projects/cricket /public/screenshots/02_schedule_fixtures.png"
add_image_box(img_sched, "Official Tournament Fixtures and Matrix Schedule for Turf 1 & Turf 2")

doc.add_paragraph("Tournament Timeline & Highlights:").paragraph_format.space_after = Pt(2)
sched_bullets = [
    ("9:00 AM – 10:00 AM: ", "Match 1 (Turf 1: Truflo Strikers vs Amsteel Inferno) & Match 2 (Turf 2: Kraftech Titans vs Mavericks Royals)."),
    ("10:00 AM – 11:00 AM: ", "Match 3 (Turf 1: Truflo Strikers vs Leo Fanatics) & Match 4 (Turf 2: Kraftech Titans vs Party Hunterz)."),
    ("11:00 AM – 12:00 PM: ", "Match 5 (Turf 1: Amsteel Inferno vs Party Hunterz) & Match 6 (Turf 2: Mavericks Royals vs Leo Fanatics)."),
    ("12:00 PM – 1:00 PM: ", "Match 7 (Turf 1: Amsteel Inferno vs Kraftech Titans) & Match 8 (Turf 2: Truflo Strikers vs Mavericks Royals)."),
    ("1:00 PM – 2:00 PM: ", "Match 9 (Turf 1: Party Hunterz vs Leo Fanatics)."),
    ("2:00 PM – 3:30 PM: ", "Lunch Break & Semifinal 1 (Rank 1 vs Rank 4) + Semifinal 2 (Rank 2 vs Rank 3)."),
    ("3:30 PM – 5:00 PM: ", "Grand Final (Winner SF1 vs Winner SF2) followed by High Tea & Trophy Presentation.")
]
for b_prefix, b_text in sched_bullets:
    bp = doc.add_paragraph(style='List Bullet')
    bp.paragraph_format.space_before = Pt(1)
    bp.paragraph_format.space_after = Pt(2)
    r1 = bp.add_run(b_prefix)
    r1.bold = True
    r1.font.name = 'Calibri'
    r1.font.size = Pt(10)
    r2 = bp.add_run(b_text)
    r2.font.name = 'Calibri'
    r2.font.size = Pt(10)

# ----------------- SECTION 4: SCORER & ADMIN LOGIN -----------------
add_header("4. Step 3 — Logging In as Scorer or Admin", level=1)
p_login = doc.add_paragraph(
    "To begin scoring or editing deliveries, official scorers must sign in. Tap 'Scorer Login' in the header navbar."
)
p_login.paragraph_format.space_after = Pt(6)

img_login = "/Users/apple/projects/cricket /public/screenshots/03_scorer_login.png"
add_image_box(img_login, "Scorer & Admin Authentication Modal with quick account selector chips")

doc.add_paragraph("How to Authenticate:").paragraph_format.space_after = Pt(2)
login_steps = [
    ("One-Click Account Chips: ", "Click 'Sagar' for Turf 1, 'Bhavin' for Turf 2, or 'Admin' for Super Admin."),
    ("Enter Password: ", "Input the official password: kvo@2026."),
    ("Unlock Console: ", "Click 'Sign In as Official Scorer'. The top navigation tab 'Admin Scorer' illuminates in bright emerald/amber.")
]
for b_prefix, b_text in login_steps:
    bp = doc.add_paragraph(style='List Bullet')
    bp.paragraph_format.space_before = Pt(1)
    bp.paragraph_format.space_after = Pt(2)
    r1 = bp.add_run(b_prefix)
    r1.bold = True
    r1.font.name = 'Calibri'
    r1.font.size = Pt(10)
    r2 = bp.add_run(b_text)
    r2.font.name = 'Calibri'
    r2.font.size = Pt(10)

# ----------------- SECTION 5: PLAYING 8 LINEUP SUBMISSION -----------------
add_header("5. Step 4 — Pre-Match Playing 8 Lineup Submission", level=1)
p_p8 = doc.add_paragraph(
    "Before a match can commence, both team captains must finalize their 8-player playing roster. "
    "The app enforces strict demographic rule verification:"
)
p_p8.paragraph_format.space_after = Pt(6)

img_p8 = "/Users/apple/projects/cricket /public/screenshots/04_playing8_lineup.png"
add_image_box(img_p8, "Playing 8 Lineup Submission Modal showing mandatory category quotas")

add_callout(
    "Mandatory Playing 8 Rules per Team:\n"
    "• Exactly 8 players selected per team.\n"
    "• Minimum 1 Kid (Junior) player.\n"
    "• Minimum 1 Female player.\n"
    "• Minimum 1 Senior player.\n"
    "• Maximum 5 Male (Regular) players.\n"
    "The system blocks match start until both teams satisfy all 4 criteria.",
    title="COMPLIANCE CHECK",
    fill_hex="ECFDF5",
    border_color="10B981"
)

# ----------------- SECTION 6: BALL-BY-BALL SCORING -----------------
add_header("6. Step 5 — Scoring Deliveries (The Scorer Console)", level=1)
p_keypad = doc.add_paragraph(
    "The Scorer Console is the heart of match day operations. It features large, responsive action buttons "
    "pre-calculated for demographic bonuses and Power Over multipliers."
)
p_keypad.paragraph_format.space_after = Pt(6)

img_keypad = "/Users/apple/projects/cricket /public/screenshots/05_scorer_keypad.png"
add_image_box(img_keypad, "Scorer Console Keypad with runs, boundaries, extras, and Power Over controls")

doc.add_paragraph("Scoring Controls & Automatic Rules:").paragraph_format.space_after = Pt(2)
scoring_items = [
    ("Dot Ball (• 0): ", "Legal delivery with no runs conceded. Records a dot ball for bowler figures and player points (+2 pts)."),
    ("1, 2, 3 Runs: ", "Runs completed by running. If a Female batter is on strike, runs are automatically doubled (+2, +4, +6)."),
    ("Boundary FOUR: ", "Four runs. Regular Male: +4 runs. Female: +9 runs ((4x2)+1). Kid/Senior: +5 runs (4+1)."),
    ("Boundary SIX: ", "Six runs. Regular Male: +6 runs. Female: +14 runs ((6x2)+2). Kid/Senior: +8 runs (6+2)."),
    ("1D / 2D Side Net: ", "Box cricket side net declaration runs (1 run or 2 runs). Doubled for female batters."),
    ("WIDE (+1 Extra): ", "Batting team awarded +1 run. Legal delivery count does not advance; ball must be re-bowled."),
    ("NO BALL (+1 Extra): ", "Batting team awarded +1 run and a Free Hit on next delivery. Option available to flag Leg-Uplift action (no Free Hit per rulebook)."),
    ("Power Over (2x Multiplier): ", "Batting captain declares 1 Power Over per innings (Overs 2 to 7). Doubles all runs off the bat! Wickets during Power Over deduct -5 runs (-7 if caught by female).")
]
for b_prefix, b_text in scoring_items:
    bp = doc.add_paragraph(style='List Bullet')
    bp.paragraph_format.space_before = Pt(1)
    bp.paragraph_format.space_after = Pt(2)
    r1 = bp.add_run(b_prefix)
    r1.bold = True
    r1.font.name = 'Calibri'
    r1.font.size = Pt(10)
    r2 = bp.add_run(b_text)
    r2.font.name = 'Calibri'
    r2.font.size = Pt(10)

# ----------------- SECTION 7: WICKETS & DISMISSALS -----------------
add_header("7. Step 6 — Recording Wickets & Fielding Attribution", level=1)
p_wkt = doc.add_paragraph(
    "In box cricket, wickets deduct runs (-2 runs in regular overs, -4 if caught by female; -5 runs in Power Over, -7 if caught by female). "
    "Fielding attribution is vital for the Best Player awards."
)
p_wkt.paragraph_format.space_after = Pt(6)

img_wkt = "/Users/apple/projects/cricket /public/screenshots/06_wicket_modal.png"
add_image_box(img_wkt, "Wicket Dismissal Modal with Catch, Run Out (Direct vs Assisted), and Stumping attribution")

doc.add_paragraph("Dismissal Types & Fielding Point Attribution:").paragraph_format.space_after = Pt(2)
wkt_items = [
    ("CAUGHT: ", "Select the fielder who took the catch (+10 fielding pts). Check 'Caught by Female' for enhanced run deductions (-4 / -7)."),
    ("BOWLED / HIT WICKET: ", "Wicket is credited directly to the active bowler (+20 bowling pts)."),
    ("RUN OUT (Direct Hit): ", "Select the fielder who executed the direct throw (+15 fielding pts)."),
    ("RUN OUT (Assisted): ", "Select the Primary Thrower (+10 fielding pts) and the Fielder/Keeper breaking the stumps (+5 fielding pts)."),
    ("STUMPED: ", "Credited to the wicket keeper / fielder (+10 fielding pts) and bowler (+20 pts).")
]
for b_prefix, b_text in wkt_items:
    bp = doc.add_paragraph(style='List Bullet')
    bp.paragraph_format.space_before = Pt(1)
    bp.paragraph_format.space_after = Pt(2)
    r1 = bp.add_run(b_prefix)
    r1.bold = True
    r1.font.name = 'Calibri'
    r1.font.size = Pt(10)
    r2 = bp.add_run(b_text)
    r2.font.name = 'Calibri'
    r2.font.size = Pt(10)

# ----------------- SECTION 8: SCORE CORRECTION & EDITING PAST BALLS -----------------
add_header("8. Step 7 — Score Correction & Over Editing Rules", level=1)
p_edit = doc.add_paragraph(
    "To correct scoring mistakes, the system offers both immediate Undo and detailed Over History editing with strict role boundaries:"
)
p_edit.paragraph_format.space_after = Pt(6)

img_edit = "/Users/apple/projects/cricket /public/screenshots/07_edit_ball_history.png"
add_image_box(img_edit, "Over Log & Ball Editor showing current over editing and locked past over status for scorers")

add_callout(
    "Strict Role-Based Editing Policy:\n"
    "• Official Scorers (Sagar / Bhavin): Can edit or delete deliveries in the CURRENT ACTIVE OVER ONLY. Completed past overs are locked with a security warning banner.\n"
    "• Super Admin (admin): Has master authority to edit or delete ANY delivery from ANY over across the entire match.\n"
    "When any ball is edited, all scorecards, individual batsman/bowler figures, NRR, and player award points are automatically re-computed.",
    title="CORRECTION SECURITY",
    fill_hex="FEF3C7",
    border_color="D97706"
)

# ----------------- SECTION 9: POINTS TABLE & SEMIFINALS -----------------
add_header("9. Step 8 — Points Table, NRR & Semifinals Progression", level=1)
p_pts = doc.add_paragraph(
    "The 'Points Table & Semis' tab tracks the tournament ladder and automatic qualification into the playoff brackets."
)
p_pts.paragraph_format.space_after = Pt(6)

img_pts = "/Users/apple/projects/cricket /public/screenshots/08_points_table.png"
add_image_box(img_pts, "Points Table with Net Run Rate (NRR) and Semifinal playoff brackets")

doc.add_paragraph("Standings & Playoff Rules:").paragraph_format.space_after = Pt(2)
pts_rules = [
    ("Match Points: ", "Win = 2 Points, Tie/No Result = 1 Point, Loss = 0 Points."),
    ("Net Run Rate (NRR): ", "NRR = (Total Runs Scored / Overs Faced) - (Total Runs Conceded / Overs Bowled)."),
    ("Top 4 Qualification: ", "The top 4 teams advance to the semifinals: Rank 1 vs Rank 4 (SF1) and Rank 2 vs Rank 3 (SF2)."),
    ("Grand Final: ", "Winners of Semifinal 1 and Semifinal 2 advance to play the Grand Final for the championship trophy.")
]
for b_prefix, b_text in pts_rules:
    bp = doc.add_paragraph(style='List Bullet')
    bp.paragraph_format.space_before = Pt(1)
    bp.paragraph_format.space_after = Pt(2)
    r1 = bp.add_run(b_prefix)
    r1.bold = True
    r1.font.name = 'Calibri'
    r1.font.size = Pt(10)
    r2 = bp.add_run(b_text)
    r2.font.name = 'Calibri'
    r2.font.size = Pt(10)

# ----------------- SECTION 10: BEST PLAYER AWARDS & FORMULA -----------------
add_header("10. Step 9 — Player Statistics & 4-Category Best Player Awards", level=1)
p_stats = doc.add_paragraph(
    "Individual awards are categorized by demographic divisions to reward excellence across all age and gender groups. "
    "Calculations strictly adhere to the official KVO tournament Excel specification."
)
p_stats.paragraph_format.space_after = Pt(6)

img_stats = "/Users/apple/projects/cricket /public/screenshots/09_player_awards.png"
add_image_box(img_stats, "Player Stats tab displaying the 4 Category Awards and overall leaderboard")

add_callout(
    "Crucial Fairness Rule: Batting Multiplier Exclusion\n"
    "To ensure complete parity between all categories, POWER OVER 2x MULTIPLIERS AND GENDER BONUS RUNS ARE STRICTLY EXCLUDED "
    "from player award points! Only actual physical runs struck off the bat are counted toward the Best Player tally.",
    title="FAIR PLAY GUARANTEE",
    fill_hex="EFF6FF",
    border_color="2563EB"
)

doc.add_paragraph("Official Performance Points Table (Excel Specification):").paragraph_format.space_after = Pt(4)

pts_table = doc.add_table(rows=14, cols=3)
pts_table.alignment = WD_TABLE_ALIGNMENT.CENTER
pts_table.autofit = False
for col, w in zip(pts_table.columns, [Inches(2.5), Inches(1.5), Inches(2.8)]):
    col.width = w

headers = ["Performance Category", "Points Awarded", "Official Excel Rule Notes"]
for i, h in enumerate(headers):
    cell = pts_table.cell(0, i)
    set_cell_background(cell, "0F172A")
    set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(h)
    r.bold = True
    r.font.name = 'Calibri'
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(255, 255, 255)

excel_points_data = [
    ("Runs Scored", "+1 Pt / Actual Run", "Base runs hit off the bat (Power Over 2x excluded)"),
    ("Boundary (Four)", "+2 Points", "Bonus on top of physical runs"),
    ("Boundary (Six)", "+4 Points", "Bonus on top of physical runs"),
    ("25 Runs Milestone", "+10 Points", "Innings milestone achievement"),
    ("50 Runs Milestone", "+25 Points", "Innings milestone achievement"),
    ("Wicket Taken", "+20 Points", "Credited to bowler (bowled, caught, stumped, hit wkt)"),
    ("Dot Ball Bowled", "+2 Points", "Legal dot ball by bowler"),
    ("Maiden Over Bowled", "+25 Points", "Full over with 0 runs conceded"),
    ("Catch Taken", "+10 Points", "Credited to catching fielder"),
    ("Stumping", "+10 Points", "Credited to wicket keeper / fielder"),
    ("Direct Hit Run-Out", "+15 Points", "Credited to throwing fielder"),
    ("Assisted Run-Out (Thrower)", "+10 Points", "Primary thrower who initiated the run-out"),
    ("Assisted Run-Out (Stumps)", "+5 Points", "Fielder or keeper breaking the stumps")
]

for row_idx, data in enumerate(excel_points_data, start=1):
    fill = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
    for col_idx, text in enumerate(data):
        cell = pts_table.cell(row_idx, col_idx)
        set_cell_background(cell, fill)
        set_cell_margins(cell, top=70, bottom=70, left=120, right=120)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(9.5)
        if col_idx == 1:
            r.bold = True
            r.font.color.rgb = RGBColor(217, 119, 6) # Amber
        else:
            r.font.color.rgb = RGBColor(15, 23, 42)

doc.add_paragraph().paragraph_format.space_after = Pt(12)

# Save document
output_path = "/Users/apple/projects/cricket /KVO_Box_Cricket_User_Scorer_Manual.docx"
doc.save(output_path)
print(f"Successfully generated DOCX manual at: {output_path}")

# Also copy to brain artifact directory
artifact_docx = "/Users/apple/.gemini/antigravity/brain/f2eaf8b8-2895-4578-9087-81574f4cbe07/KVO_Box_Cricket_User_Scorer_Manual.docx"
import shutil
shutil.copyfile(output_path, artifact_docx)
print(f"Copied DOCX manual to artifact directory: {artifact_docx}")
