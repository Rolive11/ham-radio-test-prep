import json, sys
d = json.load(open("src/data/technician_pool.json"))
for q in d["questions"]:
    if q["subelement"] in sys.argv[1:]:
        ch = " | ".join(("*" if i == q["answer"] else "") + "ABCD"[i] + ") " + c for i, c in enumerate(q["choices"]))
        print(f'{q["id"]} [{q["refs"]}] {q["question"]} :: {ch}')
