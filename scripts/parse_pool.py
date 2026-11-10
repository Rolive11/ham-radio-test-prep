"""Parse the NCVEC Technician pool (textutil-converted .txt) into JSON.

Usage: python3 scripts/parse_pool.py source_data/tech_pool.txt src/data/technician_pool.json
"""
import json, re, sys

src, out = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8").read()

# Only parse the pool body (skip errata + syllabus at the top).
body = text[text.index("FCC Element 2 Question Pool \n"):text.index("~~~~End of question pool text~~~~")]

sub_re = re.compile(r"^SUBELEMENT (T\d) - (.+?) \[(\d+) Exam Questions - (\d+) Groups\]", re.M)
group_re = re.compile(r"^(T\d[A-Z]) (.+)$", re.M)
q_re = re.compile(
    r"^(T\d[A-Z]\d{2}) \(([A-D])\)\s*(?:\[([^\]]*)\])?\s*\n(.+?)\nA\. (.+?)\nB\. (.+?)\nC\. (.+?)\nD\. (.+?)\n~~",
    re.M | re.S,
)

def titlecase(t):
    small = {"and", "of", "the", "a", "an", "or"}
    words = t.lower().split()
    return " ".join(w if i and w in small else w[0].upper() + w[1:] for i, w in enumerate(words))

subelements = {}
for m in sub_re.finditer(body):
    subelements[m.group(1)] = {"id": m.group(1), "title": titlecase(m.group(2)), "examQuestions": int(m.group(3)), "groups": []}

groups = {}
for m in group_re.finditer(body):
    gid = m.group(1)
    if gid not in groups and not re.match(r"T\d[A-Z]\d", m.group(0)):
        groups[gid] = {"id": gid, "title": m.group(2).strip()}
        subelements[gid[:2]]["groups"].append(gid)

questions = []
for m in q_re.finditer(body):
    qid, ans, ref, stem, a, b, c, d = m.groups()
    fig = re.search(r"figure (T-\d)", stem, re.I)
    questions.append({
        "id": qid, "subelement": qid[:2], "group": qid[:3],
        "question": " ".join(stem.split()),
        "choices": [" ".join(x.split()) for x in (a, b, c, d)],
        "answer": "ABCD".index(ans),
        "refs": ref.strip() if ref else "",
        "figure": fig.group(1).replace("-", "") if fig else None,
    })

declared = len(re.findall(r"^T\d[A-Z]\d{2} \(", body, re.M))
assert len(questions) == declared, f"parsed {len(questions)} of {declared}"
json.dump({"element": 2, "name": "Technician", "poolYears": "2026-2030",
           "validFrom": "2026-07-01", "validTo": "2030-06-30",
           "source": "NCVEC Question Pool Committee, public release Feb 19 2026 (includes errata)",
           "examSize": 35, "passScore": 26,
           "subelements": list(subelements.values()), "groups": groups, "questions": questions},
          open(out, "w"), indent=1, ensure_ascii=False)
print(f"{len(questions)} questions, {len(groups)} groups, {len(subelements)} subelements")
for s in subelements.values():
    n = sum(q["subelement"] == s["id"] for q in questions)
    print(s["id"], s["examQuestions"], len(s["groups"]), n)
