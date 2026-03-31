# Thmanyah (ثمانية) HR Data — Complete File Map & Linkage Guide

> **Purpose:** This document is a comprehensive reference for understanding, linking, and querying across 4 HR data files for Thmanyah (ثمانية) media company. Feed this to any AI coding tool so it can work with the data accurately.

---

## Overview

| # | File | Format | Purpose | Records | Primary Key |
|---|------|--------|---------|---------|-------------|
| 1 | `ملف_الموظفين_.csv` | CSV | Employee master roster | 313 employees | `بريد العمل` (work email) |
| 2 | `تقييمات_فترة_التجربة.csv` | CSV | Probation period evaluations | 189 evaluation records for 99 employees | `اسم الموظف` (employee name) |
| 3 | `التقييم_الدوري_-_أناناس_-_مارس_2026.xlsx` | XLSX (3 sheets) | Periodic performance evaluations (H2 2025) | 180 + 36 + 315 records | `بريد الموظف` (employee email) |
| 4 | `تقييم_القادة_-_2024_2025.xlsx` | XLSX (12 sheets) | Leadership/manager evaluations (2024–2025) | ~480 evaluation records for 51+ leaders | `أود تقييم` / `القائـد` (leader name being evaluated) |

---

## Global Linkage Key

**The strongest join key across all files is the work email (`@thmanyah.com`).**

- File 1 (Master): column `بريد العمل`
- File 3 Sheet 1 (Periodic): column `بريد الموظف`
- File 3 Sheet 3 (Station): column `البريد_الإلكتروني`

**Email-based match rates:**
- Master ↔ Periodic evaluations: **175 / 180** (97%)
- Master ↔ Station meetings: **309 / 315** (98%)

**File 2 (Probation) and File 4 (Leaders) do NOT have email columns — use fuzzy name matching.**
- File 2: column `اسم الموظف` matches against Master columns `الاسم` or `الاسم المفضّل`
- File 4: columns `أود تقييم` (May 2025 / Aug 2024) or `القائـد` (Dec 2025) match against Master `الاسم` or `الاسم المفضّل`

**Known name-matching pitfalls:**
- Master has both `الاسم` (full formal name) and `الاسم المفضّل` (preferred/nickname) — try both
- Aug 2024 leaders file appends team info to names: `أسيل باعبدالله - فريق الإنتاج` — strip after ` - ` before matching
- Probation file has test/junk entries: `ب`, `لللللل`, `محمد`, `محمود`, `صالح - تجربة` — exclude these
- Arabic diacritics vary: `عبدالقـدوس` vs `عبدالقدوس`, `طـارق النجعـي` vs `طارق النجعي` — normalize by removing tatweel (ـ)

---

## File 1: Employee Master (`ملف_الموظفين_.csv`)

### Reading Instructions
```python
df = pd.read_csv("ملف_الموظفين_.csv")
# Row 0 contains the actual Arabic headers (columns come in as "Unnamed: 0", etc.)
real_headers = df.iloc[0].tolist()
df = df.iloc[1:].reset_index(drop=True)
df.columns = real_headers
```

### Schema (29 columns)

| Column | Arabic Name | Type | Description | Unique Values | Nulls |
|--------|-------------|------|-------------|---------------|-------|
| 0 | `الاسم` | str | Full legal name | 314 | 0 |
| 1 | `الاسم المفضّل` | str | Preferred/display name | 314 | 0 |
| 2 | `الإدارة` | str | Department | 12 | 0 |
| 3 | `الفريق` | str | Team/sub-unit | 57 | 0 |
| 4 | `المستوى` | str | Job level | 12 | 0 |
| 5 | `المسمّى الوظيفي بالعربي` | str | Arabic job title | 234 | 0 |
| 6 | `المسمّى الوظيفي بالإنقليزي` | str | English job title | 206 | 6 |
| 7 | `المدير المباشر` | str | Direct manager name | 67 | 0 |
| 8 | `المكتب` | str | Office location | 7 | 0 |
| 9 | `تاريخ المباشرة` | str | Start/join date | 138 | 0 |
| 10 | `الموقع الحالي` | str | Current location | 26 | 0 |
| 11 | `نوع الدوام` | str | Employment type | 3 | 0 |
| 12 | `في الفترة التجريبية؟` | str | On probation? (نعم/لا) | 3 | 0 |
| 13 | `تاريخ آخر ترقية/علاوة` | str | Last promotion date | 10 | 235 |
| 14 | `عدد أشهر الخدمة` | str | Months of service | 56 | 0 |
| 15 | `عدد سنوات الخدمة` | str | Years of service | 9 | 0 |
| 16 | `العقد الحالي` | str | Current contract start | 119 | 0 |
| 17 | `الأيام المتبقية لإنتهاء العقد` | str | Days remaining on contract | 120 | 0 |
| 18 | `تاريخ انتهاء العقد` | str | Contract end date | 118 | 0 |
| 19 | `قائد` | str | Is a leader? (TRUE/NaN) | 2 | 241 |
| 20 | `التقييم العام` | str | Overall evaluation label | 5 | 235 |
| 21 | (empty column) | float | Always NaN | 0 | 314 |
| 22 | `الجنس` | str | Gender (ذكر/أنثى) | 3 | 0 |
| 23 | `الجنسية` | str | Nationality | 20 | 0 |
| 24 | `تاريخ الميلاد` | str | Date of birth | 306 | 0 |
| 25 | `العمر` | str | Age | 32 | 1 |
| 26 | `رقم الجوال` | str | Mobile number | 314 | 0 |
| 27 | `بريد العمل` | str | Work email (@thmanyah.com) | 313 | 1 |
| 28 | `البريد الشخصي` | str | Personal email | 313 | 0 |

### Key Categorical Values

**Departments (الإدارة):** الإنتاج (104), التسويق (57), التقنية (52), البث (36), التصميم (28), ثقافة المنظومة (16), الأعمال (9), المالية (7), الإدارة (1), العمليات (1), المكتب التنفيذي (1), المحـتوى (1)

**Job Levels (المستوى):** 0, 1, 2, 3, 4, 5, 5S, 6, 7, 8, 9 (9 = CEO, 8 = C-level, lower = junior)

**Offices (المكتب):** الرياض, عن بعد, مصر, الأردن, الشرقية, الغربية

**Leader flag (قائد):** TRUE = 72 employees, NaN = 241 employees (not leaders)

**Probation flag (في الفترة التجريبية؟):** نعم = 42, لا = 271

**Gender (الجنس):** ذكر (male), أنثى (female)

**Nationalities (19):** السعودية (majority), مصر, سوريا, الأردن, اليمن, المغرب, لبنان, تونس, فلسطين, باكستان, بنغلادش, السودان, عُمان, الجزائر, إرتريا, شاد, نجيريا, سانت كيتس ونافيس, جنسية معالجة - قبائل نازحة

### Relationships to Other Files
- **→ File 2 (Probation):** `الاسم` or `الاسم المفضّل` matches `اسم الموظف`. Only employees with `في الفترة التجريبية؟ = نعم` (or those who recently exited probation) will appear.
- **→ File 3 (Periodic):** `بريد العمل` matches `بريد الموظف` (Sheet 1) and `البريد_الإلكتروني` (Sheet 3). The `المدير المباشر` in Master matches `القائد المباشر` in Sheet 1.
- **→ File 4 (Leaders):** Employees with `قائد = TRUE` may appear as the evaluated leader in `أود تقييم` / `القائـد`. Employees also appear as evaluators (`أنا` column) in File 4.

---

## File 2: Probation Evaluations (`تقييمات_فترة_التجربة.csv`)

### Reading Instructions
```python
df = pd.read_csv("تقييمات_فترة_التجربة.csv")
# Columns are already properly named
```

### What This File Represents
Each row is **one evaluation of one employee during their probation period**. An employee can have up to 3 evaluations (one per checkpoint). The evaluator is typically their direct manager. 189 total evaluations covering 99 unique employees evaluated by 61 unique managers.

### Schema (42 columns)

| Column Index | Name | Type | Description |
|-------------|------|------|-------------|
| 0 | `Submission ID` | str | Unique ID per evaluation submission |
| 1 | `Respondent ID` | str | Evaluator's unique ID |
| 2 | `Submitted at` | str (datetime) | Submission timestamp |
| 3 | `اخـتر الــنوع` | str | **Evaluation checkpoint type** (see below) |
| 4 | `اسمك` | str | **Evaluator name** (the manager) |
| 5 | `اسم الموظف` | str | **Employee being evaluated** |
| 6–9 | Untitled checkboxes | str/bool | Consent/acknowledgment checkboxes |
| 10–15 | Checkpoint 1 criteria | str | "First impression" (Week 2) — 5 criteria |
| 16–21 | Checkpoint 2 criteria | str | "Midway" (Week 6) — 6 criteria |
| 22–30 | Checkpoint 3 criteria | str | "Decision point" (Week 10) — 9 criteria |
| 31–32 | Target fields | float | All NaN (unused) |
| 33 | `ابدأ.. توقف.. استمر..` | str | Start/Stop/Continue header |
| 34 | `ابدأ 🏁` | str | "Start doing" feedback (free text) |
| 35 | `توقف 🚦` | str | "Stop doing" feedback (free text) |
| 36 | `استمر ✅` | str | "Continue doing" feedback (free text) |
| 37 | `مساحة مفتوحة` | str | Open space / general comments |
| 38 | `النتيجة 🚦` | str | **Overall result (traffic light)** |
| 39 | `بوادر القرار ⚖️` | str | **Decision hint** (checkpoint 2 only) |
| 40 | `القرار ⚖️` | str | **Final decision** (checkpoint 3 only) |
| 41 | `Untitled long answer field` | str | Additional HR/manager notes |

### Three Evaluation Checkpoints

Each checkpoint uses **different criteria columns**. Only the columns relevant to that checkpoint type will have data; the rest will be NaN.

#### Checkpoint 1: First Impression — Week 2 (الانطباع الأول)
- **Count:** 61 evaluations
- **Criteria (columns 10–15):**
  1. `التفاعل والبداية` — Engagement & start
  2. `الاستقلالية والتعلم` — Independence & learning
  3. `التواصل والتعاون` — Communication & collaboration
  4. `الاندماج في أدوات العمل والتواصل` — Integration with work tools
  5. `الانطباع العام` — General impression
- **Outputs:** `النتيجة 🚦` only (no decision yet)

#### Checkpoint 2: Midway — Week 6 (منتصف الطريق)
- **Count:** 56 evaluations
- **Criteria (columns 16–21):**
  1. `التطور في الأداء والمخرجات` — Performance development
  2. `الاستقلالية والمسؤولية` — Independence & responsibility
  3. `التعلّم والاستجابة للملاحظات` — Learning & feedback response
  4. `التفاعل والعلاقات داخل الفريق` — Team interaction
  5. `الالتزام والمسؤولية` — Commitment & responsibility
  6. `القيم وثقافة ثمانية` — Thmanyah values & culture
- **Outputs:** `النتيجة 🚦` + `بوادر القرار ⚖️` (decision hint)

#### Checkpoint 3: Decision Point — Week 10 (محطة القرار)
- **Count:** 72 evaluations
- **Criteria (columns 22–30):**
  1. `الأداء والجودة` — Performance & quality
  2. `الاستقلالية والاعتمادية` — Independence & reliability
  3. `الالتزام والانضباط` — Commitment & discipline
  4. `التفاعل والتعاون` — Interaction & collaboration
  5. `القيم وثقافة ثمانية` — Thmanyah values & culture
  6. `التعلّم والاستجابة للملاحظات` — Learning & feedback response
  7. `المسؤولية والمبادرة` — Responsibility & initiative
  8. `الأثر والإضافة` — Impact & added value
  9. `الجاهزية للمرحلة القادمة` — Readiness for next phase
- **Outputs:** `النتيجة 🚦` + `القرار ⚖️` (final decision)

### Scoring System

**All criteria responses are emoji-prefixed text strings, NOT numeric scores.** Each criterion uses a 4-level scale:

| Level | Prefix | Meaning |
|-------|--------|---------|
| Excellent | 🟢🟢 | Top performance |
| Very good | 🟢 | Strong performance |
| Good | 🟡 | Acceptable, needs improvement |
| Struggling | 🔴 / 🔴🔴 | Below expectations |

**Overall Result (`النتيجة 🚦`):**
| Value | Count | Meaning |
|-------|-------|---------|
| `🟢 دربه خضر` | 104 | Green track — on track |
| `🟢🟢 دربه فخر` | 61 | Pride track — excellent |
| `🟡 دربه صفر` | 20 | Yellow track — caution |
| `🔴 دربه حمر` | 4 | Red track — at risk |

**Final Decision (`القرار ⚖️`) — only at Checkpoint 3:**
| Value | Count | Meaning |
|-------|-------|---------|
| `🥇 الترسيم` | 67 | Confirmed / permanent hire |
| `❌ عدم الاستمرار` | 3 | Terminated |
| `🔄 التمديد` | 3 | Probation extended |

**Decision Hint (`بوادر القرار ⚖️`) — only at Checkpoint 2:**
| Value | Count | Meaning |
|-------|-------|---------|
| `🥇 الترسيم` | 54 | Leaning toward confirmation |
| `❌ عدم الاستمرار` | 2 | Leaning toward termination |

### Relationships to Other Files
- **→ File 1 (Master):** `اسم الموظف` matches `الاسم` or `الاسم المفضّل`. `اسمك` (evaluator) also matches a Master employee (the manager).
- **→ File 3 (Periodic):** Employees who passed probation (`الترسيم`) will later appear in File 3's periodic evaluations. Employees in File 3 with `في فترة التجربة = نعم` may still have active probation evals in File 2.
- **→ File 4 (Leaders):** The `اسمك` (evaluator/manager) in File 2 may appear as an evaluated leader in File 4.

---

## File 3: Periodic Evaluation — March 2026 (`التقييم_الدوري_-_أناناس_-_مارس_2026.xlsx`)

### Reading Instructions
```python
from openpyxl import load_workbook
wb = load_workbook("التقييم_الدوري_-_أناناس_-_مارس_2026.xlsx", read_only=True)
# Three sheets:
# Sheet 1: "التقييمات المحدثة" — main evaluations
# Sheet 2: "لن أتمسك فيه" — flagged for non-retention
# Sheet 3: "المحطة" — station/checkpoint meetings (self + manager review)
```

### Sheet 1: `التقييمات المحدثة` (Updated Evaluations)

**180 rows. Season: النصف الثاني 2025 (H2 2025). One row per employee.**

#### Schema (53 columns)

| Col | Name | Type | Description |
|-----|------|------|-------------|
| 0 | `اسم الموظف` | str | Employee name |
| 1 | `القائد المباشر` | str | Direct leader/manager |
| 2 | `مدير المدير` | str | Manager's manager (skip-level) |
| 3 | `رقم_الموظف` | float | Employee number |
| 4 | `رقم التقييم` | float | Evaluation number |
| 5 | `المحطة` | str | Station status: ⛽️ (fuel/in-progress), ⛽️✅ (completed) |
| 6 | `الدرب العام` | str | **Overall track rating** |
| 7 | `درجة_الدرب_العام` | float | Overall track numeric score (2–5) |
| 8 | `نسبة الدرب العام` | float | Overall track percentage (20–100%) |
| 9 | `درب القيادة` | str | **Leadership track rating** |
| 10 | `درجة_درب_القيادة` | float | Leadership track numeric score (0–5) |
| 11 | `نسبة القيادة` | float | Leadership track percentage |
| 12 | `حقق التوقعات؟` | mixed | Met expectations? (1–5 or text with comment) |
| 13 | `كيف جودة المخرجات؟` | mixed | Output quality (1–5 or text with comment) |
| 14 | `كيف الإنضباط مع الوقت؟` | mixed | Time discipline (1–5 or text with comment) |
| 15 | `كيفه مع بيسكامب؟` | mixed | Basecamp usage (1–5 or text) |
| 16 | `كيف حس المبادرة؟` | mixed | Initiative (1–5 or text) |
| 17 | `كيف كفاءة الموظف؟` | mixed | Employee efficiency (1–5 or text) |
| 18 | `كيف تعتمد عليه؟` | mixed | Dependability (1–5 or text) |
| 19 | `كيف تطوره المهني؟` | mixed | Professional development (1–5 or text) |
| 20 | `كيف تقيم درب الموظف بشكل عام؟` | mixed | Overall track assessment (1–5 or text) |
| 21 | `كيف يتخذ القرارات؟` | mixed | Decision-making (leaders only) |
| 22 | `كيف يبني الفريق؟` | mixed | Team building (leaders only) |
| 23 | `كيف يبني الأهداف؟` | mixed | Goal setting (leaders only) |
| 24 | `كيف يقود الفريق؟` | mixed | Team leadership (leaders only) |
| 25 | `حالة_التقييم` | str | Evaluation status |
| 26 | `الموسم` | str | Season (all: النصف الثاني 2025) |
| 27 | `تاريخ_التقييم` | str | Evaluation date |
| 28–29 | `تعليقات_المدير` / `تعليقات المدير` | str | Manager comments (2 columns, both may have data) |
| 30 | `التعليقات للموارد البشرية` | str | HR-only comments |
| 31 | `إمكانية القيادة` | str | Leadership potential (نعم/لا) |
| 32 | `هل تتمسك بالموظف` | str | Would you retain? (✅/❌) |
| 33 | `بريد الموظف` | str | **Employee email — PRIMARY JOIN KEY** |
| 34 | `هل هو قائد` | str | Is a leader (نعم/لا) |
| 35 | `من_فريق_الموارد_البشرية` | str | From HR team? |
| 36 | `في فترة التجربة` | str | Currently on probation? (نعم/لا) |
| 37 | `نوع_التقييم` | str | Evaluation type (all: اعتيادي = regular) |
| 38 | `تاريخ اعتماد المدير` | str | Manager approval date |
| 39 | `تاريخ اعتماد الموارد البشرية` | str | HR approval date |
| 40 | `سبب الرفض` | str | Rejection reason |
| 41 | `تاريخ ارسال التقرير` | str | Report send date |
| 42 | `القسم` | str | Department |
| 43 | `المسمى الوظيفي` | str | Job title |
| 44 | `الفريق` | str | Team |
| 45 | `المستوى` | str | Job level |
| 46 | `المكتب` | str | Office |
| 47 | `الموقع الحالي` | str | Current location |
| 48 | `نوع_التوظيف` | str | Employment type |
| 49 | `الجنس` | str | Gender |
| 50 | `الجنسية` | str | Nationality |
| 51 | `تاريخ_الانضمام` | str | Join date |
| 52 | `متطابق` | str | Match flag (system field) |

#### Scoring System — "الدرب" (Track)

The periodic evaluation uses a 5-level "track" system (Arabic: درب):

| Track | Arabic | Score | Percentage Range | Meaning |
|-------|--------|-------|-----------------|---------|
| فخر 🎖️ | Pride | 5 | ~75–100% | Outstanding |
| خضر 🎉 | Green | 4 | ~62–75% | Meeting expectations |
| صفر 📣 | Yellow | 3 | ~47–62% | Needs improvement |
| حمر 🚨 | Red | 2 | ~20–47% | Below expectations |
| خطر 📁 | Danger | 1 | below 20% | Critical (leaders only) |

**Distribution:** فخر 35, خضر 96, صفر 37, حمر 12

**Individual criteria (columns 12–24) use a 1–5 scale**, but values are often mixed: some cells contain just the number, others contain the number plus a text comment (e.g., `"4,تلاحظ مدى تدخلي في الإعداد كيف انخفض..."`). Parse by extracting the leading number before any comma.

**Leadership criteria (columns 21–24)** are only filled for employees flagged as leaders (`هل هو قائد = نعم`, 53 employees). Non-leaders have `-` or `0` in these fields.

**Leadership track (درب القيادة)** uses the same scale but is only populated for leaders. Non-leaders show `-` with score `0`.

#### Key Flags

| Field | Values | Distribution |
|-------|--------|-------------|
| `حالة_التقييم` (status) | معتمدة (approved) | 172 |
| | بانتظار اعتماد المدير (awaiting manager) | 4 |
| | مرفوض من المدير (rejected by manager) | 2 |
| | بانتظار اعتماد الموارد البشرية (awaiting HR) | 1 |
| | مرفوض من الموارد البشرية (rejected by HR) | 1 |
| `هل تتمسك بالموظف` (retain?) | ✅ | 149 |
| | ❌ | 31 |
| `إمكانية القيادة` (leadership potential) | لا (no) | 96 |
| | نعم (yes) | 84 |
| `هل هو قائد` (is leader?) | لا (no) | 127 |
| | نعم (yes) | 53 |
| `في فترة التجربة` (probation?) | لا (no) | 169 |
| | نعم (yes) | 11 |

---

### Sheet 2: `"لن أتمسك فيه"` (Won't Retain)

**36 rows. A filtered view of employees the manager would NOT retain.**

| Column | Description |
|--------|-------------|
| `اسم الموظف` | Employee name |
| `القائد المباشر` | Direct leader |
| `الدرب العام` | Overall track (all are حمر 🚨 = Red) |
| `نسبة الدرب العام` | Overall percentage (20–55%) |
| `درب القيادة` | Leadership track |
| `هل تتمسك بالموظف` | Retain? (all ❌) |
| `القسم` | Department |
| `تبرير المدير` | **Manager's justification for non-retention** (free text) |

**Department distribution of flagged employees:** الإنتاج 12, التسويق 5, التقنية 5, التصميم 4, ثقافة المنظومة 3, الأعمال 2

---

### Sheet 3: `المحطة` (Station / Checkpoint Meeting)

**999 rows total but only 315 have data (rest are NaN rows). This is the employee self-assessment + manager review meeting.**

**Season:** الربع الثاني 2025 (Q2 2025)

| Column | Description |
|--------|-------------|
| `اسم_الموظف` | Employee name |
| `البريد_الإلكتروني` | **Employee email — JOIN KEY** |
| `مدير` | Is this person a manager? (نعم/لا) |
| `اسم_المدير` | Manager name |
| `اسم_الموسم` | Season name |
| `حالة_اجتماع_المحطة` | Meeting status |
| `تاريخ_التقديم` | Submission date |
| `تاريخ_الاعتماد` | Approval date |
| `نواحي_القوة` | Strengths (employee self-assessment, free text) |
| `تعليق_المدير_نواحي_القوة` | Manager comment on strengths |
| `نواحي_التطوير` | Development areas (self-assessment) |
| `تعليق_المدير_نواحي_التطوير` | Manager comment on development |
| `الأهداف_المستقبلية` | Future goals (self-assessment) |
| `تعليق_المدير_الأهداف_المستقبلية` | Manager comment on goals |
| `ملاحظات_عامة` | General notes (self-assessment) |
| `تعليق_المدير_ملاحظات_عامة` | Manager's general notes |
| `المهام_الأساسية` | Core tasks |
| `المشاريع` | Projects |
| `التعلم_والتطوير` | Learning & development |
| `أخرى` | Other |

**Meeting status distribution (of 315 active rows):**
| Status | Count | Meaning |
|--------|-------|---------|
| مُقدّم | 107 | Submitted by employee |
| مُعتمَد | 93 | Approved by manager |
| لم يُنشأ بعد | 71 | Not yet created |
| مسودة | 44 | Draft |

### Relationships to Other Files
- **→ File 1 (Master):** `بريد الموظف` (Sheet 1) and `البريد_الإلكتروني` (Sheet 3) match `بريد العمل`. `القائد المباشر` matches Master's `المدير المباشر` and also matches Master `الاسم` for the manager's own record.
- **→ File 2 (Probation):** Employees with `في فترة التجربة = نعم` (11 employees in Sheet 1) likely have corresponding records in File 2.
- **→ File 4 (Leaders):** `القائد المباشر` and employees with `هل هو قائد = نعم` appear as evaluated leaders in File 4.

---

## File 4: Leadership Evaluations (`تقييم_القادة_-_2024_2025.xlsx`)

### Reading Instructions
```python
from openpyxl import load_workbook
wb = load_workbook("تقييم_القادة_-_2024_2025.xlsx", read_only=True)
# 12 sheets — key data sheets listed below
```

### What This File Represents
**360-degree upward evaluations** — employees evaluate their direct managers/leaders. Contains 3 evaluation cycles (Aug 2024, May 2025, Dec 2025) plus analysis and comparison sheets.

### Sheet Overview

| Sheet Name | Purpose | Rows | Key |
|------------|---------|------|-----|
| `تقييم القادة مايو 2025 - معتمد` | **May 2025 evaluations (approved)** | 81 | Primary cycle |
| `تحليل تقييم 2025 - مايو` | **AI/HR analysis of May 2025** | 17 leaders | Qualitative analysis |
| `بعد تعديل المجاملين - أغسطس 202` | **Aug 2024 evaluations (adjusted)** | 98 | After removing "flatterers" |
| `الأصلي - أغسطس 2024` | Aug 2024 original (before adjustment) | 97 | Raw data |
| `تقويم قيادة ثمانية - ديسمبر 202` | **Dec 2025 evaluations** | 197 | Latest & largest cycle |
| `مقارنة 2024 - 26` | **Cross-cycle comparison** | 58 | Trend data |
| `ملخص 2025` | May 2025 summary | 33 | Aggregated stats |
| `الملخص 2024` | Aug 2024 summary | 60 | Aggregated stats |
| `الملخص2 (باستثناء المجاملين)` | Summary (excluding flatterers) | ~30 | Adjusted stats |
| `التقييم الدوري2 - المدراء` | Aug 2024 original full data | 92 | Raw data |
| `تم استبعادهم - أبريل 2025 (مجام` | Excluded flatterers (May 2025) | 6 | Removed evaluations |
| `2024 مقارنة ب 2025` | 2024 vs 2025 comparison | 58 | Side-by-side |

---

### Primary Data Sheets

#### May 2025 Sheet: `تقييم القادة مايو 2025 - معتمد`

**81 evaluations of 17 leaders. Score scale: 1–10.**

| Col | Name | Type | Description |
|-----|------|------|-------------|
| 0 | `Submission ID` | str | Unique submission ID |
| 1 | `Respondent ID` | str | Evaluator's unique ID |
| 2 | `Submitted at` | datetime | Submission timestamp |
| 3 | `أنا` | str | **Evaluator name** (the employee) |
| 4 | `أود تقييم` | str | **Leader being evaluated** |
| 5 | `مُديري فعّال في توصيل المعلومة...` | float (1-10) | Communication effectiveness |
| 6 | `مُديري يحدد الأولويات...` | float (1-10) | Priority setting |
| 7 | `مُديري يتخذ قرارات صائبة...` | float (1-10) | Decision quality |
| 8 | `مُديري يبني ويضع أهداف طموحة...` | float (1-10) | Goal setting |
| 9 | `هل لديك مرئيات... «الوضوح والأولويات»؟` | str | **Open feedback on clarity** |
| 10 | `مُديري يُمكّن ويحفّز استقلاليتي...` | float (1-10) | Empowerment |
| 11 | `مُديري يحسن في تفويض المهام...` | float (1-10) | Delegation |
| 12 | `مُديري يقدم يد العون والمشورة...` | float (1-10) | Support |
| 13 | `مُديري لديه وعي ذاتي وذكاء عاطفي...` | float (1-10) | Emotional intelligence |
| 14 | `هل لديك مرئيات... «طريقة العمل»؟` | str | **Open feedback on work style** |
| 15 | `مُديري يؤثر في معنويات الفريق...` | float (1-10) | Team morale |
| 16 | `مُديري يشجع ويسهل التعاون...` | float (1-10) | Team collaboration |
| 17 | `مُديري يعمل على تعزيز بيئة مشجعة...` | float (1-10) | Positive environment |
| 18 | `مُديري يُشرك الفريق ويشاورهم...` | float (1-10) | Team involvement |
| 19 | `هل لديك مرئيات... «قيادة الفريق»؟` | str | **Open feedback on leadership** |
| 20 | `مُديري يستثمر وقتاً... لتطويري...` | float (1-10) | Development investment |
| 21 | `مُديري يشاركني مرئيات بناءة...` | float (1-10) | Constructive feedback |
| 22 | `مُديري يساهم في رفع الأداء...` | float (1-10) | Performance improvement |
| 23 | `مُديري يشجع ويدعم التفكير الإبداعي...` | float (1-10) | Creative thinking |
| 24 | `هل لديك مرئيات... «الدعم والتطوير»؟` | str | **Open feedback on support** |
| 25 | `أي شيء آخر تودّ مشاركته مع مديرك؟` | str | Open message to manager |
| 26 | `أي شيء آخر... مع الموارد البشرية...` | str | HR-only comments |
| 31 | `متوسط التقييم` | float | Computed average score |

**4 evaluation dimensions, each with numeric + open text:**
1. **Clarity & Priorities (الوضوح والأولويات):** cols 5–9
2. **Work Style (طريقة العمل):** cols 10–14
3. **Team Leadership (قيادة الفريق):** cols 15–19
4. **Support & Development (الدعم والتطوير):** cols 20–24

**17 leaders evaluated in May 2025:** أسيل باعبدالله, أنس الأهدل, عبدالرحمن أبومالح, عبدالله الغامدي, عبدالوهاب محمد, علي بوصالح, عمار الطحان, فيصل الغامدي, لينا الشهري, محمد الحرازي, محمد عطالله, مشاري الحمود, معاذ المغذوي, موفق العبيد, ميسم المنيع, نواف قوارش, وديان بحه

---

#### Dec 2025 Sheet: `تقويم قيادة ثمانية - ديسمبر 202`

**197 evaluations of 51 leaders. Score scale: 1–9. Evaluator names are anonymous (hidden from leaders).**

| Col | Name | Type | Description |
|-----|------|------|-------------|
| 0 | `Submission ID` | str | Unique submission ID |
| 1 | `Respondent ID` | str | Evaluator ID |
| 2 | `Submitted at` | datetime | Timestamp |
| 3–9 | Checkbox consent fields | mixed | Privacy acknowledgments |
| 10 | `أنا` | str | **Evaluator name** |
| 11 | `القائـد` | str | **Leader being evaluated** |
| 12 | `فعّال في توصيل المعلومة...` | float (1-9) | Communication |
| 13 | `يحدد الأولويات...` | float (1-9) | Priority setting |
| 14 | `قادر على اتخاذ قرارات سريعة...` | float (1-9) | Decision making |
| 15 | `ما أبرز مرئياتك حول «وضوح القائد...»؟` | str | Open feedback: clarity |
| 16 | `يُمكّن ويحفّز الاستقلالية...` | float (1-9) | Empowerment |
| 17 | `متاح عند الحاجة ومتجاوب...` | float (1-9) | Availability |
| 18 | `يظهر وعيًا وتفهّمًا لتحديات...` | float (1-9) | Emotional intelligence |
| 19 | `ما أبرز مرئياتك حول «طريقة عمل...»؟` | str | Open feedback: work style |
| 20 | `يخلق بيئة تشجّع على التعاون...` | float (1-9) | Collaboration environment |
| 21 | `يبني ثقافة أداء عالية...` | float (1-9) | Performance culture |
| 22 | `يُشرك الفريق ويشاورهم...` | float (1-9) | Team involvement |
| 23 | `ما أبرز مرئياتك حول «قيادة...»؟` | str | Open feedback: leadership |
| 24 | `يُقدّر جهد الفريق...` | float (1-9) | Team appreciation |
| 25 | `يشاركني مرئيات بناءة...` | float (1-9) | Constructive feedback |
| 26 | `يشجعني على المبادرة...` | float (1-9) | Initiative support |
| 27 | `ما أبرز مرئياتك حول «التطوير...»؟` | str | Open feedback: development |
| 28 | `ما تقدّره في أسلوب قيادته...؟` | str | What you appreciate |
| 29 | `ما الجوانب التي تتمنى أن يطوّرها...؟` | str | Areas for improvement |
| 30 | `هل هناك أي مرئيات إضافية... الموارد البشرية...` | str | HR-only feedback |

**IMPORTANT:** Dec 2025 uses a **1–9 scale** (not 1–10 like May 2025). Normalize before comparing.

**4 evaluation dimensions (same structure, different questions):**
1. **Clarity & Communication:** cols 12–15
2. **Work Style:** cols 16–19
3. **Team Leadership:** cols 20–23
4. **Development & Support:** cols 24–27

**51 leaders evaluated in Dec 2025** (expanded from 17 in May — includes mid-level leaders)

---

#### Aug 2024 Sheet: `بعد تعديل المجاملين - أغسطس 202`

**98 evaluations of 25 leaders. Score scale: 1–10. Same column structure as May 2025.**

**⚠️ Name format difference:** Some leader names have team suffixes: `أسيل باعبدالله - فريق الإنتاج`, `أسيل باعبدالله - فريق التسويق`. Strip after ` - فريق ` before joining.

**"Flatterers" (المجاملين):** 10 evaluations were excluded for giving all-10 scores. The excluded data is in sheet `تم استبعادهم`.

---

#### Analysis Sheet: `تحليل تقييم 2025 - مايو`

**17 rows, one per leader. AI-generated qualitative analysis.**

| Column | Description |
|--------|-------------|
| `القائد` | Leader name |
| `📈 نقاط القوة` | Strengths (numbered list, Arabic) |
| `📉 نقاط الضعف` | Weaknesses (numbered list) |
| `✅ التوصيات` | Recommendations (numbered list) |
| `👥 الفريق المثالي` | Ideal team description |
| `🛠️ خطوات عملية` | Action steps (numbered list) |
| `📊 مقارنة بـ 2024 وباقي القادة` | Comparison vs 2024 and other leaders |

---

#### Comparison Sheet: `مقارنة 2024 - 26`

**Cross-cycle metrics:**

| Metric | Aug 2024 | May 2025 | Dec 2025 |
|--------|----------|----------|----------|
| Average leader score | 8.2 | 7.91 | 7.54 |
| Total evaluations | 85 | 85 | 206 |
| Excluded flatterers | 10 | 5 | 15 |
| Number of leaders evaluated | 23 | 20 | 49 |

**Track classification thresholds (for overall leader score):**
| Track | Dec 2025 Thresholds | May 2025 Thresholds |
|-------|-------------------|-------------------|
| فخر (Pride) | 8.81+ | 8.5+ |
| خضر (Green) | 8.4–8.8 | 7.71–8.49 |
| صفر (Yellow) | 7.75–8.4 | 7.1–7.7 |
| حمر (Red) | 7.21–7.74 | 6.6–7.09 |
| خطر (Danger) | 6.6–7.2 | 6.55- |

---

### Relationships to Other Files
- **→ File 1 (Master):** `أود تقييم` / `القائـد` (leader name) matches Master `الاسم`. `أنا` (evaluator) also matches Master `الاسم` for the employee giving the evaluation.
- **→ File 3 (Periodic):** Leaders evaluated here are the same people who appear as `القائد المباشر` in File 3 Sheet 1 and `اسم_المدير` in Sheet 3. The leadership track (`درب القيادة`) in File 3 is a separate assessment from the upward evaluation in File 4 — File 3 is top-down (manager evaluates leader capabilities), File 4 is bottom-up (team evaluates their leader).
- **→ File 2 (Probation):** Leaders who evaluate probation employees (`اسمك` in File 2) are the same leaders being evaluated here.

---

## Cross-File Entity Relationship Map

```
┌─────────────────────────────────────────────────────────┐
│                   FILE 1: EMPLOYEE MASTER                │
│  313 employees — the SINGLE SOURCE OF TRUTH              │
│  PK: بريد العمل (work email)                             │
│  Key fields: name, department, team, level, manager,     │
│  leader flag, probation flag, demographics               │
└──────────┬──────────┬──────────────┬────────────────────┘
           │          │              │
     (email join)  (name join)  (name join)
           │          │              │
           ▼          ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐
│  FILE 3      │ │  FILE 2      │ │  FILE 4                │
│  PERIODIC    │ │  PROBATION   │ │  LEADERS EVAL          │
│  EVAL        │ │  EVAL        │ │                        │
│              │ │              │ │  Evaluated leader:     │
│ Sheet1: 180  │ │ 189 evals    │ │  أود تقييم / القائـد   │
│  employees   │ │ of 99 emps   │ │                        │
│  evaluated   │ │              │ │  Evaluator:            │
│  by manager  │ │ 3 checkpoints│ │  أنا (employee)        │
│  (top-down)  │ │ per employee │ │  (bottom-up)           │
│              │ │              │ │                        │
│ Sheet2: 36   │ │ Final:       │ │  3 cycles:             │
│  won't retain│ │ ترسيم/تمديد/ │ │  Aug24, May25, Dec25   │
│              │ │ عدم استمرار  │ │                        │
│ Sheet3: 315  │ │              │ │  Analysis + comparison │
│  station     │ └──────────────┘ │  sheets included       │
│  meetings    │                  └────────────────────────┘
└──────────────┘

LINKAGE KEYS:
━━━━━━━━━━━━━
• File 1 ↔ File 3 (Sheet 1): بريد العمل = بريد الموظف         (97% match)
• File 1 ↔ File 3 (Sheet 3): بريد العمل = البريد_الإلكتروني   (98% match)
• File 1 ↔ File 2: الاسم|الاسم المفضّل = اسم الموظف           (fuzzy, 73% match)
• File 1 ↔ File 4: الاسم|الاسم المفضّل = أود تقييم|القائـد    (fuzzy, 84% match)
• File 2 → File 4: اسمك (evaluator in probation) = أود تقييم (leader in leaders eval)
• File 3 → File 4: القائد المباشر = أود تقييم|القائـد (same leaders, different eval perspective)

EVALUATION DIRECTION:
━━━━━━━━━━━━━━━━━━━━
• File 2 (Probation): Manager → New Employee (top-down)
• File 3 Sheet 1 (Periodic): Manager → Employee (top-down)
• File 3 Sheet 3 (Station): Employee self-assessment + Manager review (bilateral)
• File 4 (Leaders): Employee → Manager/Leader (bottom-up / 360°)
```

---

## Common Query Patterns

### Get complete profile for one employee
```python
email = "example@thmanyah.com"
master_row = df_master[df_master['بريد العمل'].str.lower() == email]
periodic_row = df_periodic[df_periodic['بريد الموظف'].str.lower() == email]
station_rows = df_station[df_station['البريد_الإلكتروني'].str.lower() == email]
name = master_row.iloc[0]['الاسم']
probation_rows = df_prob[df_prob['اسم الموظف'].str.strip() == name]
# If leader, get their upward evaluations
leader_evals = df_leaders_dec[df_leaders_dec['القائـد'].str.strip() == name]
```

### Get all evaluations for a department
```python
dept_emails = df_master[df_master['الإدارة'] == 'التقنية']['بريد العمل'].str.lower()
dept_periodic = df_periodic[df_periodic['بريد الموظف'].str.lower().isin(dept_emails)]
```

### Track an employee through their full lifecycle
```python
# Probation → Periodic → Station → Leader eval (if leader)
name = "جوهرة الغامدي"
probation = df_prob[df_prob['اسم الموظف'].str.contains(name)]  # Probation checkpoints
email = df_master[df_master['الاسم'].str.contains(name)]['بريد العمل'].iloc[0]
periodic = df_periodic[df_periodic['بريد الموظف'].str.lower() == email.lower()]
station = df_station[df_station['البريد_الإلكتروني'].str.lower() == email.lower()]
```

### Compare a leader's self-perception vs team perception
```python
leader = "أنس الأهدل"
# Top-down: how the leader evaluates their team (File 3)
team_evals = df_periodic[df_periodic['القائد المباشر'] == leader]
# Bottom-up: how the team evaluates the leader (File 4)
upward_evals = df_leaders_dec[df_leaders_dec['القائـد'] == leader]
```

---

## Data Quality Notes

1. **Date formats are inconsistent** across files: `Sep 21, 2016`, `Feb 1, 2017`, `2001-05-11`, `3/29/1989`. Parse with `pd.to_datetime(col, format='mixed')`.
2. **Numeric fields stored as strings:** Months of service, age, level — cast with `pd.to_numeric(col, errors='coerce')`.
3. **Mixed numeric+text cells** in File 3 criteria columns (e.g., `"4,تلاحظ مدى تدخلي..."`). Extract number: `col.astype(str).str.extract(r'^(\d+)')[0].astype(float)`.
4. **Empty column 21 in File 1** (between `التقييم العام` and `الجنس`) is always NaN — skip it.
5. **Leader flag in File 1** is `TRUE` (string) or NaN — not boolean. Check with `df['قائد'] == 'TRUE'`.
6. **File 3 Sheet 3 (Station)** has 999 rows but only 315 contain data. Filter: `df_station.dropna(subset=['اسم_الموظف'])`.
7. **File 4 score scales differ:** Aug 2024 & May 2025 use 1–10; Dec 2025 uses 1–9. Normalize to 0–100% before comparing across cycles.
8. **"Flatterers" (المجاملين)** were removed in the adjusted sheets. Use `بعد تعديل المجاملين` (adjusted) not `الأصلي` (original) for Aug 2024. For Dec 2025, 15 were excluded (sheet `تم استبعادهم`).
9. **Arabic text normalization:** Strip tatweel character `ـ` (U+0640) and extra spaces before name matching. Some names have trailing spaces.
