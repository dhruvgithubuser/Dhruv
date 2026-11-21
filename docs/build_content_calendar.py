import datetime as dt
from openpyxl import Workbook
from openpyxl.chart import LineChart, Reference
from openpyxl.comments import Comment
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = '/home/user/Dhruv/docs/Buried_Chronicles_Content_Calendar_Nov15-Dec14.xlsx'
F = 'Arial'
def font(sz=10, b=False, c='1D1B19', i=False): return Font(name=F, size=sz, bold=b, color=c, italic=i)
def fill(h): return PatternFill('solid', start_color=h, end_color=h)
thin = Side(style='thin', color='BFB8A8'); med = Side(style='medium', color='8E1B16')
box = Border(left=thin, right=thin, top=thin, bottom=thin)
wrap = Alignment(wrap_text=True, vertical='top')
center = Alignment(horizontal='center', vertical='center', wrap_text=True)

PILLARS = {  # name: (fill, font colour)
    'Hidden Heroes': ('DCE8F5', '1F3A5F'),
    'Last Stands': ('F6E2C9', '7A4A12'),
    'Fatal Mistakes': ('F4D6D3', '8E1B16'),
    'History Myths': ('E4DDF2', '4B2E83'),
    'Cut from Long Video': ('DDEFD9', '2F5D2A'),
}
LONG_FILL = 'F2C94C'

# ---------------------------------------------------------------- data (one row per day)
# (date, short title, pillar, hook, cover text, linked long video, long video title or '')
D = dt.date
ROWS = [
    (D(2026,11,15), "Custer's Last Order: Bring Packs (Little Bighorn 1876)", 'Cut from Long Video', "You're reading the last order Custer ever wrote. Why did nobody come?", 'NOBODY CAME', 'The Trial After Little Bighorn', ''),
    (D(2026,11,16), 'The 1941 Pearl Harbor Quote Yamamoto Never Said', 'History Myths', 'You know the most famous quote about Pearl Harbor. Nobody can find it before 1970.', 'A MOVIE WROTE IT', 'The Trial After Little Bighorn', 'Isandlwana: The Zulu General Who Out-Planned the British Empire'),
    (D(2026,11,17), "Napoleon's Coffin Was Opened 19 Years Later", 'History Myths', "You'd think 19 years in the ground leaves only bones. Then they opened Napoleon's coffin.", 'HE LOOKED ASLEEP', 'The Mistake That Cost Napoleon His Empire', ''),
    (D(2026,11,18), "The British General Who Couldn't Be Killed (Carton de Wiart)", 'Hidden Heroes', 'You lose an eye and a hand. Would you go back to war? He went back twice.', '11 WOUNDS', 'Isandlwana', ''),
    (D(2026,11,19), 'The Day the Sun Went Dark Mid-Battle (Isandlwana, 1879)', 'Cut from Long Video', 'You are in a battle with 20,000 warriors. Then the sun goes dark.', 'ECLIPSE', 'Isandlwana', ''),
    (D(2026,11,20), 'The Only Soldier to Kill With a Longbow in WWII', 'Hidden Heroes', 'You went to WWII with a rifle. He brought a longbow, a sword and bagpipes.', 'SWORD. BOW. BAGPIPES.', 'Isandlwana', ''),
    (D(2026,11,21), 'Britain Shot Its Own Admiral (1757)', 'Fatal Mistakes', 'You lose one battle at sea. Your own navy puts you in front of a firing squad.', '"TO ENCOURAGE THE OTHERS"', 'Isandlwana', ''),
    (D(2026,11,22), 'The Ammunition Box Myth of Isandlwana', 'Cut from Long Video', "You've heard the British lost because of screwed-down ammo boxes. Historians disagree.", 'NOT THE BOXES', 'Isandlwana', ''),
    (D(2026,11,23), 'Nelson Came Home in a Barrel of Brandy', 'History Myths', "You'd never guess how Britain brought its greatest admiral home from Trafalgar.", "DON'T DRINK IT", 'Isandlwana', ''),
    (D(2026,11,24), "Montgomery's Body Double Fooled Hitler", 'Hidden Heroes', "You're a German spy in 1944. You just saw Montgomery in Gibraltar. You didn't.", 'THE FAKE GENERAL', 'Isandlwana', ''),
    (D(2026,11,25), 'Two Officers Died Saving One Flag (Isandlwana)', 'Cut from Long Video', 'You have minutes to escape. They spent them saving a flag.', 'THE QUEEN\'S COLOUR', 'Isandlwana', ''),
    (D(2026,11,26), "The Kaiser's Insult That Made Britain's Army Famous", 'History Myths', 'You were called a "contemptible little army". So you made it your name.', 'OLD CONTEMPTIBLES', 'Isandlwana', ''),
    (D(2026,11,27), 'Wellington Called His Own Army "the Scum of the Earth"', 'History Myths', 'You beat Napoleon with this army. Its own general called it scum.', 'SCUM OF THE EARTH', 'Isandlwana', ''),
    (D(2026,11,28), '"England Expects": Nelson\'s Signal Was a Last-Minute Edit', 'History Myths', "You know Nelson's famous signal. It wasn't what he first wrote.", 'NELSON CONFIDES?', 'The Charge of the Light Brigade', 'The Charge of the Light Brigade: The Order Nobody Understood'),
    (D(2026,11,29), 'He Led the Light Brigade… Then Had Dinner on His Yacht', 'Cut from Long Video', 'You survive the most famous charge in history. Where do you go next? His yacht.', 'DINNER AFTER', 'The Charge of the Light Brigade', ''),
    (D(2026,11,30), "Churchill's Wanted Poster: £25, Dead or Alive", 'Hidden Heroes', 'You know Churchill the prime minister. Meet Churchill the escaped prisoner.', 'DEAD OR ALIVE', 'The Charge of the Light Brigade', ''),
    (D(2026,12,1), '"Attack the Guns": Which Guns? (Light Brigade)', 'Cut from Long Video', 'You get an order to attack "the guns". There are three sets of guns.', 'WHICH GUNS?', 'The Charge of the Light Brigade', ''),
    (D(2026,12,2), 'The Radar Operators Who Saw Pearl Harbor Coming', 'Fatal Mistakes', "You see 50+ planes on radar. You're told: don't worry about it.", '"DON\'T WORRY"', 'The Charge of the Light Brigade', ''),
    (D(2026,12,3), "The Pearl Harbor Warning That Came by Western Union", 'Fatal Mistakes', 'You send the most urgent warning of the war. By regular telegram.', 'TOO LATE', 'The Charge of the Light Brigade', ''),
    (D(2026,12,4), "Orde Wingate: Britain's Strangest General", 'Hidden Heroes', 'You meet your new general. He is eating a raw onion. And he is naked.', 'STRANGEST GENERAL', 'The Charge of the Light Brigade', ''),
    (D(2026,12,5), 'The Japanese Pilot Who Crash-Landed on Niihau', 'Hidden Heroes', 'You crash on a tiny Hawaiian island. Nobody there knows about Pearl Harbor yet.', 'NIIHAU', 'Pearl Harbor: The Warnings', 'Pearl Harbor: The Warnings That Were Ignored'),
    (D(2026,12,6), 'The Ship That Still Leaks Oil at Pearl Harbor', 'Cut from Long Video', 'You can still see the USS Arizona bleeding oil, 85 years later.', 'BLACK TEARS', 'Pearl Harbor: The Warnings', ''),
    (D(2026,12,7), '"Air Raid Pearl Harbor. This Is No Drill."', 'Cut from Long Video', 'You are reading the message that started America\'s war.', 'NO DRILL', 'Pearl Harbor: The Warnings', ''),
    (D(2026,12,8), "Pearl Harbor's Missing Third Wave", 'Fatal Mistakes', 'You destroyed the battleships. Why did you leave the fuel tanks?', 'NO THIRD WAVE', 'Pearl Harbor: The Warnings', ''),
    (D(2026,12,9), '740 Men Held the Bridge at Arnhem', 'Last Stands', 'You were told to hold the bridge for two days. Relief never came.', 'A BRIDGE TOO FAR', 'Pearl Harbor: The Warnings', ''),
    (D(2026,12,10), 'Germans in American Uniforms at the Bulge', 'Hidden Heroes', 'You stop a jeep of GIs at a checkpoint. They are German.', 'FAKE GIs', 'Pearl Harbor: The Warnings', ''),
    (D(2026,12,11), 'Wake Island: The Garrison That Sank Japanese Ships', 'Last Stands', 'You have 450 Marines on a tiny island. A Japanese invasion fleet arrives.', 'THEY FIRED BACK', 'Pearl Harbor: The Warnings', ''),
    (D(2026,12,12), "Wizna: 720 Poles vs 40,000 Germans", 'Last Stands', 'You have 720 men. They have tanks and 40,000 soldiers.', '720 vs 40,000', '"NUTS!" at Bastogne', '"NUTS!": The One-Word Reply at Bastogne'),
    (D(2026,12,13), 'The Germans Asked What "NUTS!" Meant', 'Cut from Long Video', 'You demand surrender. The answer is one word you can\'t translate.', 'NUTS!', '"NUTS!" at Bastogne', ''),
    (D(2026,12,14), 'The Weather That Saved Bastogne', 'Cut from Long Video', 'You are surrounded, freezing, out of shells. Then the sky clears.', 'CLEAR SKIES', '"NUTS!" at Bastogne', ''),
]
LONGS = [
    (D(2026,11,16), 'Isandlwana: The Zulu General Who Out-Planned the British Empire', "Enemy's eye (told from Ntshingwayo's side)", 'HE WASN\'T READY', 'Zulu army did not plan to fight on 22 Jan ("day of the dead moon"); eclipse; ammo-box myth; ends at Rorke\'s Drift', 'battle of isandlwana documentary', 'Rorke\'s Drift Short'),
    (D(2026,11,28), 'The Charge of the Light Brigade: The Order Nobody Understood', 'Trial format (who was guilty?)', 'ONE VAGUE ORDER', "Raglan's order, the Lucan–Cardigan feud, ~670 men, the wrong guns; Cardigan's yacht dinner", 'charge of the light brigade', 'Custer trial video'),
    (D(2026,12,5), 'Pearl Harbor: The Warnings That Were Ignored', 'Myth autopsy / fatal mistakes (anniversary 7 Dec)', 'THEY KNEW?', 'Opana Point radar, the Ward sinking a submarine, the Western Union warning; no conspiracy claims', 'pearl harbor documentary', 'Yamamoto quote Short'),
    (D(2026,12,12), '"NUTS!": The One-Word Reply at Bastogne', "One decision under siege (Bulge anniversary 16 Dec)", 'NUTS!', 'McAuliffe\'s reply, Operation Greif, weather, Patton\'s relief; German side of the surrender demand', 'battle of the bulge documentary', 'Arnhem / Wake Shorts'),
]

wb = Workbook()

# ================================================================ Daily Plan
pl = wb.active; pl.title = 'Daily Plan'
hdr = ['Date', 'Day', 'Short title', 'Pillar', 'Hook (first 2 s)', 'Cover text', 'Related long video (link in Short)', 'Long video that day',
       'Short time (IST)', 'Short time (EST)', 'YouTube', 'Instagram', 'Facebook', 'TikTok', 'Status', 'YT views (48 h)', 'IG views (48 h)', 'Notes']
pl['A1'] = 'BURIED CHRONICLES · DAILY PLAN (15 Nov – 14 Dec 2026)'; pl['A1'].font = font(14, True, '8E1B16')
pl['A2'] = 'Edit the yellow cells (status, views, notes). Titles feed the Calendar sheet automatically. EST = IST − 10:30 (US Eastern Standard Time).'; pl['A2'].font = font(9, False, '7A6B55', True)
for j, h in enumerate(hdr, 1):
    c = pl.cell(row=4, column=j, value=h); c.font = font(10, True, 'FFFFFF'); c.fill = fill('1D1B19'); c.alignment = center; c.border = box
for i, (d, title, pillar, hook, cover, rel, lng) in enumerate(ROWS):
    r = 5 + i
    pl.cell(row=r, column=1, value=d).number_format = 'dd mmm yyyy'
    pl.cell(row=r, column=2, value=f'=TEXT(A{r},"ddd")')
    pl.cell(row=r, column=3, value=title); pl.cell(row=r, column=4, value=pillar); pl.cell(row=r, column=5, value=hook)
    pl.cell(row=r, column=6, value=cover); pl.cell(row=r, column=7, value=rel); pl.cell(row=r, column=8, value=lng)
    t = dt.time(22, 30) if d == D(2026,11,16) else dt.time(21, 30)
    pl.cell(row=r, column=9, value=t).number_format = 'h:mm AM/PM'
    pl.cell(row=r, column=10, value=f'=MOD(I{r}-TIME(10,30,0),1)').number_format = 'h:mm AM/PM'
    for k, v in zip(range(11, 15), ['Same day', 'Next day', 'Next day (auto from IG)', 'Next day']):
        pl.cell(row=r, column=k, value=v)
    pl.cell(row=r, column=15, value='Published' if d == D(2026,11,15) else 'Planned')
    pl.cell(row=r, column=16, value=None); pl.cell(row=r, column=17, value=None); pl.cell(row=r, column=18, value='')
    pf, pc = PILLARS[pillar]
    for j in range(1, 19):
        c = pl.cell(row=r, column=j); c.font = font(10); c.alignment = wrap; c.border = box
    pl.cell(row=r, column=4).fill = fill(pf); pl.cell(row=r, column=4).font = font(10, True, pc)
    if lng:
        pl.cell(row=r, column=8).fill = fill(LONG_FILL); pl.cell(row=r, column=8).font = font(10, True)
    for j in (15, 16, 17, 18): pl.cell(row=r, column=j).fill = fill('FFF6C8')
# example values in the first row so the format is clear
pl['P5'] = 0; pl['Q5'] = 0; pl['R5'] = 'Example: note what worked (hook, swipe-away %)'
pl['P5'].comment = Comment('Example format: type the YouTube views 48 hours after posting (e.g. 1250).', 'Planner')
widths = [12, 6, 44, 16, 52, 20, 30, 34, 11, 11, 10, 10, 14, 10, 12, 12, 12, 32]
for j, w in enumerate(widths, 1): pl.column_dimensions[get_column_letter(j)].width = w
pl.freeze_panes = 'D5'
dv = DataValidation(type='list', formula1='"Idea,Scripted,Produced,Scheduled,Published"', allow_blank=True)
pl.add_data_validation(dv); dv.add(f'O5:O{4 + len(ROWS)}')
dvp = DataValidation(type='list', formula1='"' + ','.join(PILLARS) + '"', allow_blank=False)
pl.add_data_validation(dvp); dvp.add(f'D5:D{4 + len(ROWS)}')
last = 4 + len(ROWS)
for st, col in [('Published', 'C8E6C9'), ('Scheduled', 'BBDEFB'), ('Produced', 'FFE0B2'), ('Scripted', 'F8BBD0')]:
    pl.conditional_formatting.add(f'O5:O{last}', FormulaRule(formula=[f'$O5="{st}"'], fill=fill(col), font=Font(name=F, bold=True)))
pl.row_dimensions[4].height = 30

# ================================================================ Long Videos
lv = wb.create_sheet('Long Videos')
lv['A1'] = 'LONG VIDEOS · 1 per week · Saturday 7:30 PM IST (9:00 AM EST)'; lv['A1'].font = font(14, True, '8E1B16')
lh = ['Publish date', 'Day', 'Title', 'Unique angle', 'Thumbnail text', 'Key beats (verified facts only)', 'Search term to target', 'Cross-link', 'Publish (IST)', 'Publish (EST)', 'Status', 'Views (7 days)', 'Watch hours (7 days)']
for j, h in enumerate(lh, 1):
    c = lv.cell(row=3, column=j, value=h); c.font = font(10, True, 'FFFFFF'); c.fill = fill('8E1B16'); c.alignment = center; c.border = box
for i, (d, t, ang, th, beats, kw, xl) in enumerate(LONGS):
    r = 4 + i
    lv.cell(row=r, column=1, value=d).number_format = 'dd mmm yyyy'
    lv.cell(row=r, column=2, value=f'=TEXT(A{r},"dddd")')
    for j, v in zip(range(3, 9), [t, ang, th, beats, kw, xl]): lv.cell(row=r, column=j, value=v)
    lv.cell(row=r, column=9, value=dt.time(19, 30)).number_format = 'h:mm AM/PM'
    lv.cell(row=r, column=10, value=f'=MOD(I{r}-TIME(10,30,0),1)').number_format = 'h:mm AM/PM'
    lv.cell(row=r, column=11, value='Planned')
    for j in range(1, 14):
        c = lv.cell(row=r, column=j); c.font = font(10, j == 3); c.alignment = wrap; c.border = box
    for j in (11, 12, 13): lv.cell(row=r, column=j).fill = fill('FFF6C8')
lv.cell(row=8, column=1, value='Note: Monday 16 Nov is a one-off (Isandlwana). From 28 Nov, long videos go out every Saturday.').font = font(9, False, '7A6B55', True)
lv.add_data_validation(dv2 := DataValidation(type='list', formula1='"Idea,Scripted,Produced,Scheduled,Published"', allow_blank=True)); dv2.add('K4:K7')
for j, w in enumerate([12, 11, 46, 30, 18, 60, 28, 22, 11, 11, 12, 12, 14], 1): lv.column_dimensions[get_column_letter(j)].width = w
for r in range(4, 8): lv.row_dimensions[r].height = 62

# ================================================================ KPI Tracker
kp = wb.create_sheet('KPI Tracker')
kp['A1'] = 'KPI TRACKER · targets vs actuals (update every Sunday)'; kp['A1'].font = font(14, True, '8E1B16')
kp['A2'] = 'Blue = target (from the 2-month strategy). Yellow = type your actual numbers from YouTube Studio. Baseline row = public data on 14 Nov 2026.'; kp['A2'].font = font(9, False, '7A6B55', True)
kh = ['Week ending', 'Subscribers target', 'Subscribers actual', '% of target', 'Typical Short views target', 'Typical Short views actual', '% of target', 'Long video views (7 d) target', 'Long video views actual', '% of target', 'Watch hours (total) target', 'Watch hours actual', '% of target']
for j, h in enumerate(kh, 1):
    c = kp.cell(row=4, column=j, value=h); c.font = font(10, True, 'FFFFFF'); c.fill = fill('1D1B19'); c.alignment = center; c.border = box
KROWS = [(D(2026,11,14), 49, 49, 642, 642, 0, 6, 0, 0),
         (D(2026,11,22), 90, None, 800, None, 100, None, 15, None),
         (D(2026,11,29), 120, None, 1000, None, 150, None, 30, None),
         (D(2026,12,6), 180, None, 1250, None, 250, None, 70, None),
         (D(2026,12,13), 250, None, 1500, None, 300, None, 120, None)]
for i, (d, st, sa, vt, va, lt, la, wt, wa) in enumerate(KROWS):
    r = 5 + i
    kp.cell(row=r, column=1, value=d).number_format = 'dd mmm yyyy'
    for j, v, inp in [(2, st, False), (3, sa, True), (5, vt, False), (6, va, True), (8, lt, False), (9, la, True), (11, wt, False), (12, wa, True)]:
        c = kp.cell(row=r, column=j, value=v); c.number_format = '#,##0'
        c.font = font(10, False, '0000FF') if not inp else font(10)
        if inp: c.fill = fill('FFF6C8')
    for j, (a, b) in zip((4, 7, 10, 13), (('C', 'B'), ('F', 'E'), ('I', 'H'), ('L', 'K'))):
        c = kp.cell(row=r, column=j, value=f'=IF(OR({a}{r}="",{b}{r}=0),"",{a}{r}/{b}{r})'); c.number_format = '0%'
    for j in range(1, 14):
        kp.cell(row=r, column=j).border = box; kp.cell(row=r, column=j).alignment = Alignment(horizontal='center', vertical='center')
kp['A5'].comment = Comment('Baseline from the channel\'s public page on 14 Nov 2026: 49 subscribers, median Short 642 views, long videos 0–13 views.', 'Planner')
for r in range(5, 10):
    for col in ('D', 'G', 'J', 'M'):
        kp.conditional_formatting.add(f'{col}{r}', FormulaRule(formula=[f'AND(ISNUMBER({col}{r}),{col}{r}>=1)'], fill=fill('C8E6C9')))
        kp.conditional_formatting.add(f'{col}{r}', FormulaRule(formula=[f'AND(ISNUMBER({col}{r}),{col}{r}<0.7)'], fill=fill('F4D6D3')))
for j, w in enumerate([13, 13, 13, 10, 15, 15, 10, 15, 13, 10, 14, 13, 10], 1): kp.column_dimensions[get_column_letter(j)].width = w
kp.row_dimensions[4].height = 42
ch = LineChart(); ch.title = 'Subscribers: target vs actual'; ch.y_axis.title = 'Subscribers'; ch.x_axis.title = 'Week ending'
ch.add_data(Reference(kp, min_col=2, min_row=4, max_row=9), titles_from_data=True)
ch.add_data(Reference(kp, min_col=3, min_row=4, max_row=9), titles_from_data=True)
ch.set_categories(Reference(kp, min_col=1, min_row=5, max_row=9)); ch.x_axis.number_format = 'dd mmm'
ch.height, ch.width = 8, 18; ch.roundedCorners = False; ch.legend.overlay = False; ch.title.overlay = False
ch.x_axis.title.overlay = False; ch.y_axis.title.overlay = False; ch.x_axis.delete = False; ch.y_axis.delete = False
kp.add_chart(ch, 'A12')
kp['A30'] = 'Decision rules'; kp['A30'].font = font(11, True, '8E1B16')
for k, t in enumerate(['A Short beats 10,000 views → make 2 more on the same formula that week.',
                       'A long video beats 1,000 views in 7 days → make a follow-up or part 2.',
                       '"Viewed vs swiped away" under 60% for 3 Shorts in a row → change the hook formula.',
                       'Long videos still under 100 views after 4 weeks → more search-led titles + a Shorts compilation.']):
    kp.cell(row=31 + k, column=1, value='• ' + t).font = font(10)

# ================================================================ Calendar (first sheet)
ca = wb.create_sheet('Calendar', 0)
ca.sheet_view.showGridLines = False
ca['A1'] = 'BURIED CHRONICLES · CONTENT CALENDAR'; ca['A1'].font = font(20, True, '8E1B16')
ca['A2'] = '15 November – 14 December 2026  ·  1 Short every day (9:30 PM IST / 11:00 AM EST)  ·  1 long video a week (7:30 PM IST / 9:00 AM EST)'; ca['A2'].font = font(10, False, '4D4F43')
ca['A3'] = 'This calendar reads from the Daily Plan sheet: change a title or pillar there and it updates here.'; ca['A3'].font = font(9, False, '7A6B55', True)
days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
for j, dname in enumerate(days):
    c = ca.cell(row=5, column=2 + j, value=dname); c.font = font(10, True, 'FFFFFF'); c.fill = fill('1D1B19'); c.alignment = center
ca.cell(row=5, column=1, value='WEEK').font = font(10, True, 'FFFFFF'); ca.cell(row=5, column=1).fill = fill('1D1B19'); ca.cell(row=5, column=1).alignment = center
start = D(2026,11,9)  # Monday of the first week
first, lastd = ROWS[0][0], ROWS[-1][0]
r0 = 6; week = 0
day = start
while day <= lastd:
    base = r0 + week * 3
    wk = ca.cell(row=base, column=1, value=f'Week {week + 1}'); wk.font = font(10, True, '8E1B16'); wk.alignment = center
    ca.merge_cells(start_row=base, start_column=1, end_row=base + 2, end_column=1)
    for j in range(7):
        d = day + dt.timedelta(days=j); col = 2 + j; L = get_column_letter(col)
        dc = ca.cell(row=base, column=col); sc = ca.cell(row=base + 1, column=col); lc = ca.cell(row=base + 2, column=col)
        for c in (dc, sc, lc): c.border = Border(left=thin, right=thin)
        dc.border = Border(left=thin, right=thin, top=thin); lc.border = Border(left=thin, right=thin, bottom=thin)
        if first <= d <= lastd:
            dc.value = d; dc.number_format = 'dd mmm'; dc.font = font(11, True); dc.alignment = Alignment(horizontal='left', vertical='center')
            sc.value = f"=IFERROR(\"• \"&INDEX('Daily Plan'!$C$5:$C${last},MATCH({L}{base},'Daily Plan'!$A$5:$A${last},0)),\"\")"
            sc.font = font(9); sc.alignment = wrap
            lc.value = f"=IFERROR(IF(INDEX('Daily Plan'!$H$5:$H${last},MATCH({L}{base},'Daily Plan'!$A$5:$A${last},0))=\"\",\"\",\"★ LONG: \"&INDEX('Daily Plan'!$H$5:$H${last},MATCH({L}{base},'Daily Plan'!$A$5:$A${last},0))),\"\")"
            lc.font = font(9, True, '5A3D00'); lc.alignment = wrap
            # pillar colour follows the Daily Plan pillar
            for pname, (pf, pc) in PILLARS.items():
                rule = FormulaRule(formula=[f"IFERROR(INDEX('Daily Plan'!$D$5:$D${last},MATCH({L}${base},'Daily Plan'!$A$5:$A${last},0))=\"{pname}\",FALSE)"], fill=fill(pf), font=Font(name=F, color=pc))
                ca.conditional_formatting.add(f'{L}{base + 1}', rule)
            ca.conditional_formatting.add(f'{L}{base + 2}', FormulaRule(formula=[f'LEN({L}{base + 2})>0'], fill=fill(LONG_FILL)))
            if d in (D(2026,11,26), D(2026,12,7)):
                dc.comment = Comment('US Thanksgiving: expect lower engagement; Short still posts.' if d == D(2026,11,26) else 'Pearl Harbor anniversary (85th).', 'Planner')
        else:
            for c in (dc, sc, lc): c.fill = fill('F2F0EB')
    ca.row_dimensions[base].height = 18; ca.row_dimensions[base + 1].height = 64; ca.row_dimensions[base + 2].height = 40
    day += dt.timedelta(days=7); week += 1
ca.column_dimensions['A'].width = 9
for j in range(7): ca.column_dimensions[get_column_letter(2 + j)].width = 26
# legend + summary
lr = r0 + week * 3 + 1
ca.cell(row=lr, column=1, value='LEGEND').font = font(10, True, '8E1B16')
for k, (pname, (pf, pc)) in enumerate(PILLARS.items()):
    c = ca.cell(row=lr + 1 + k, column=2, value=pname); c.fill = fill(pf); c.font = font(10, True, pc); c.border = box
    n = ca.cell(row=lr + 1 + k, column=3, value=f"=COUNTIF('Daily Plan'!$D$5:$D${last},B{lr + 1 + k})"); n.font = font(10); n.alignment = Alignment(horizontal='center')
    ca.cell(row=lr + 1 + k, column=4, value='Shorts').font = font(10)
c = ca.cell(row=lr + 6, column=2, value='★ Long video day'); c.fill = fill(LONG_FILL); c.font = font(10, True); c.border = box
ca.cell(row=lr + 6, column=3, value=f"=COUNTIF('Daily Plan'!$H$5:$H${last},\"?*\")").alignment = Alignment(horizontal='center')
ca.cell(row=lr + 6, column=4, value='Long videos').font = font(10)
ca.cell(row=lr, column=6, value='PROGRESS').font = font(10, True, '8E1B16')
ca.cell(row=lr + 1, column=6, value='Shorts published'); ca.cell(row=lr + 1, column=7, value=f"=COUNTIF('Daily Plan'!$O$5:$O${last},\"Published\")")
ca.cell(row=lr + 2, column=6, value='Shorts planned'); ca.cell(row=lr + 2, column=7, value=f"=COUNTA('Daily Plan'!$C$5:$C${last})")
ca.cell(row=lr + 3, column=6, value='Done'); ca.cell(row=lr + 3, column=7, value=f'=IF(G{lr + 2}=0,"",G{lr + 1}/G{lr + 2})'); ca.cell(row=lr + 3, column=7).number_format = '0%'
ca.cell(row=lr + 4, column=6, value='Total YT views logged'); ca.cell(row=lr + 4, column=7, value=f"=SUM('Daily Plan'!$P$5:$P${last})"); ca.cell(row=lr + 4, column=7).number_format = '#,##0'
for k in range(1, 5):
    ca.cell(row=lr + k, column=6).font = font(10); ca.cell(row=lr + k, column=7).font = font(10, True)
ca.cell(row=lr + 8, column=1, value='Daily routine (≈15 min): upload the Short → set "Related video" → pin the question comment → next day post the Reel (Instagram auto-shares to Facebook) + TikTok → log views after 48 h.').font = font(9, False, '4D4F43', True)
ca.freeze_panes = 'B6'
ca.page_setup.orientation = 'landscape'; ca.page_setup.fitToWidth = 1; ca.sheet_properties.pageSetUpPr.fitToPage = True

wb.save(OUT); print('saved', OUT)
