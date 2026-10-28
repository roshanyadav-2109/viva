"""Load the workbook into Supabase through the Management API.
Usage: SBP=<access token> SUPABASE_REF=<ref> python -I import_workbook.py <workbook.xlsx>
The token is read from the environment only.
"""
import json, os, re, sys, urllib.error, urllib.request
from pathlib import Path
import pandas as pd

REF = os.environ["SUPABASE_REF"]
TOKEN = os.environ["SBP"]
CODE_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 ._-]{1,39}$")

SUBJECTS = [
    ("MAD1", "Modern Application Development I", 1),
    ("MAD2", "Modern Application Development II", 2),
    ("PYTHON", "Programming in Python", 4),
    ("MLP", "Machine Learning Practice", 5),
    ("OTHER", "Other", 6),
]


def run(sql):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json", "User-Agent": "viva-import"},
    )
    try:
        return urllib.request.urlopen(req, timeout=300).read().decode()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP {e.code}: {e.read().decode()[:600]}")


def lit(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return "null"
    if isinstance(v, (int,)):
        return str(v)
    s = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", str(v)).replace("'", "''")
    return "'" + s + "'"


def proctor_code(raw):
    s = re.sub(r"^See reviews\s*", "", str(raw)).strip()
    s = re.sub(r"\(.*?\)", "", s)
    s = re.sub(r"@.*$", "", s).lstrip("@").strip()
    return s if CODE_RE.match(s) and not s.upper().startswith(("DON", "ID=")) else "Unknown"


def date(v):
    return None if pd.isna(v) else str(v)[:10]


def chunks(rows, n):
    for i in range(0, len(rows), n):
        yield rows[i : i + n]


def main(path):
    x = pd.read_excel(path, sheet_name=None)
    sets, qs = x["Sets"], x["Viva - All"]
    sets, qs = sets.copy(), qs.copy()
    for df in (sets, qs):
        df['Subject'] = df['Subject'].replace({'DBMS': 'MAD2'})
    qs = qs[qs["Question"].notna()].copy()
    for df in (sets, qs):
        df["code"] = df["Proctor"].map(proctor_code)
        df["lvl"] = df["Level"].str.extract(r"(\d)")[0].astype(int)

    seen = {}
    for c in list(sets.code) + list(qs.code):
        seen.setdefault(c.lower(), c)
    canon = lambda c: seen[c.lower()]
    sets["code"] = sets.code.map(canon)
    qs["code"] = qs.code.map(canon)

    run("truncate public.questions, public.reviews, public.sets, public.proctors, public.subjects restart identity cascade")
    run("insert into public.subjects values " + ",".join(f"({lit(a)},{lit(b)},{c})" for a, b, c in SUBJECTS))
    run("insert into public.proctors (code) values " + ",".join(f"({lit(c)})" for c in sorted(set(seen.values()))))

    for part in chunks(list(sets.itertuples()), 600):
        vals = ",".join(f"({r._1},{lit(r.Subject)},{r.lvl},{lit(r.code)},{lit(date(r.Date))})" for r in part)
        run(f"insert into public.sets (id,subject,level,proctor_id,held_on) select v.id,v.s,v.l,p.id,v.d::date from (values {vals}) v(id,s,l,c,d) join public.proctors p on p.code=v.c")

    for part in chunks(list(qs.itertuples()), 500):
        vals = ",".join(
            f"({int(r._1)},{int(r._6)},{lit(r.Subject)},{r.lvl},{lit(r.code)},{int(r._7)},{lit(r.Question.strip())},{int(r._8)},{lit(date(r.Date))})"
            for r in part
        )
        run(f"insert into public.questions (id,set_id,subject,level,proctor_id,position,body,times_asked,asked_on) select v.id,v.sid,v.s,v.l,p.id,v.pos,v.b,v.t,v.d::date from (values {vals}) v(id,sid,s,l,c,pos,b,t,d) join public.proctors p on p.code=v.c")

    adv = sets[sets.Advice.notna()]
    for part in chunks(list(adv.itertuples()), 300):
        vals = ",".join(
            f"({r._1},{lit(re.sub(r'^Advice:\s*', '', r.Advice).strip())})" for r in part
        )
        run(f"insert into public.reviews (set_id,proctor_id,subject,level,body,held_on) select s.id,s.proctor_id,s.subject,s.level,v.b,s.held_on from (values {vals}) v(id,b) join public.sets s on s.id=v.id where char_length(v.b)>0")

    run("select setval(pg_get_serial_sequence('public.sets','id'), (select max(id) from public.sets));"
        "select setval(pg_get_serial_sequence('public.questions','id'), (select max(id) from public.questions));")
    seed = Path(__file__).resolve().parents[1] / "supabase" / "question_guidance_seed.sql"
    run(seed.read_text(encoding="utf-8"))
    print(run("select (select count(*) from public.questions) q,(select count(*) from public.sets) s,(select count(*) from public.proctors) p,(select count(*) from public.reviews) r"))


main(sys.argv[1])
