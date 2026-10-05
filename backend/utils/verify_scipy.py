import json, numpy as np
from scipy.optimize import linprog

TOL_COST = 0.02   # JS rounds to 2 dp
TOL_FEAS = 0.01
data = json.load(open("scenarios.json"))
passed = 0

print(f"{'ID':>3} {'Crop':<12}{'Rain':<9}{'JS cost':>12}{'scipy cost':>13}{'diff':>8}  Result")
for s in data:
    f = s["fertilizers"]
    c = [x["cost"] for x in f]
    A = -np.array([[x["n"]/100 for x in f],
                   [x["p"]/100 for x in f],
                   [x["k"]/100 for x in f]])
    b = -np.array([s["req"]["n"], s["req"]["p"], s["req"]["k"]])
    res = linprog(c, A_ub=A, b_ub=b, bounds=(0, None), method="highs")

    js_cost = s["js"]["cost"]
    diff = abs(js_cost - res.fun)

   
    q = np.array([s["js"]["mix"].get(x["name"], 0) for x in f])
    supplied = -A @ q
    feasible = np.all(supplied >= -b - TOL_FEAS)

    ok = res.success and diff <= TOL_COST and feasible
    passed += ok
    print(f"{s['id']:>3} {s['crop']:<12}{s['rain']:<9}{js_cost:>12.2f}{res.fun:>13.2f}{diff:>8.3f}  {'PASS' if ok else 'FAIL'}")


    for x, qs in zip(f, res.x):
        qj = s["js"]["mix"].get(x["name"], 0)
        if abs(qj - qs) > 0.05:
            print(f"      qty differs for {x['name']}: JS {qj} vs scipy {qs:.2f}")

print(f"\n{passed}/{len(data)} scenarios passed")