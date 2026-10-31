"""Scenario engine: "what would change our mind?"

Two tools, both deterministic:
  * compare()   - baseline vs scenario, with an explanation of what moved the result
  * breakeven() - for each variable, how far it must move before the winner flips
"""
from __future__ import annotations

from ..schemas import (Breakeven, Decision, DimensionShift, FlipPoint,
                       Provenance, ScenarioResult, ScoreResult, VariableImpact)
from .scoring import resolve_variables, score

EPS = 1e-9


def _option_name(decision: Decision, option_id: str) -> str:
    return next(o.name for o in decision.options if o.id == option_id)


def _contrib(result: ScoreResult, option_id: str) -> dict[str, float]:
    opt = next(o for o in result.options if o.option_id == option_id)
    return {d.dimension_id: d.contribution for d in opt.dimensions}


def compare(decision: Decision, weights: dict[str, float] | None,
            baseline_vars: dict[str, float] | None,
            scenario_vars: dict[str, float] | None) -> ScenarioResult:
    base = score(decision, weights, baseline_vars)
    scen = score(decision, weights, scenario_vars)

    a = base.winner  # the option we are defending
    b = next(o.option_id for o in scen.options if o.option_id != a)  # strongest rival in the scenario

    ca_base, cb_base = _contrib(base, a), _contrib(base, b)
    ca_scen, cb_scen = _contrib(scen, a), _contrib(scen, b)
    shifts = []
    for dim in decision.dimensions:
        before = ca_base[dim.id] - cb_base[dim.id]
        after = ca_scen[dim.id] - cb_scen[dim.id]
        shifts.append(DimensionShift(dimension_id=dim.id, name=dim.name,
                                     lead_before=round(before, 2), lead_after=round(after, 2),
                                     delta=round(after - before, 2)))
    shifts.sort(key=lambda s: s.delta)  # most eroded lead first

    # Which moved variables flip the result on their own?
    moved = [v for v in decision.variables
             if abs(scen.variables[v.id] - base.variables[v.id]) > EPS]
    impacts = []
    for var in moved:
        alone = dict(base.variables)
        alone[var.id] = scen.variables[var.id]
        impacts.append(VariableImpact(
            variable_id=var.id, name=var.name, baseline=base.variables[var.id],
            scenario=scen.variables[var.id],
            flips_alone=score(decision, weights, alone).winner != a))

    unsourced_effects = sorted({
        f"{v.id} -> {e.dimension}/{e.option}"
        for v in moved for e in v.effects if e.provenance == Provenance.placeholder})

    changed = scen.winner != a
    name_a, name_b = _option_name(decision, a), _option_name(decision, b)
    top = shifts[0]
    drivers = [v.name for v in moved if any(e.dimension == top.dimension_id for e in v.effects)]
    driver_txt = f" (driven by: {', '.join(drivers)})" if drivers else ""
    if changed:
        explanation = (f"Recommendation changed from {name_a} to {name_b}. The biggest shift was "
                       f"'{top.name}', where {name_a}'s lead moved by {top.delta:+.1f} points{driver_txt}.")
    elif not moved:
        explanation = f"No assumptions changed. {name_a} remains the recommendation."
    else:
        explanation = (f"Recommendation unchanged: {name_a} still leads {name_b}, "
                       f"by {scen.margin:.1f} points (was {base.margin:.1f}). "
                       f"Largest pressure came from '{top.name}' ({top.delta:+.1f}){driver_txt}.")

    return ScenarioResult(
        baseline=base, scenario=scen, changed=changed, winner_before=a, winner_after=scen.winner,
        compared_against=b, shifts=shifts, changed_variables=impacts, explanation=explanation,
        unsourced_effects=unsourced_effects)


def _winner_at(decision, weights, variables, var_id, x) -> str:
    trial = dict(variables)
    trial[var_id] = x
    return score(decision, weights, trial).winner


def _search(decision, weights, variables, var, direction: int, current_winner: str,
            steps: int = 200) -> FlipPoint | None:
    """Walk from the current value toward the range limit; bisect to the first winner change."""
    cur = variables[var.id]
    bound = var.max if direction > 0 else var.min
    if abs(bound - cur) < EPS:
        return None
    prev = cur
    for i in range(1, steps + 1):
        x = cur + (bound - cur) * i / steps
        if _winner_at(decision, weights, variables, var.id, x) != current_winner:
            lo, hi = prev, x  # winner at lo == current, at hi != current
            for _ in range(40):
                mid = (lo + hi) / 2
                if _winner_at(decision, weights, variables, var.id, mid) == current_winner:
                    lo = mid
                else:
                    hi = mid
            return FlipPoint(value=round(hi, 2),
                             new_winner=_winner_at(decision, weights, variables, var.id, hi))
        prev = x
    return None


def breakeven(decision: Decision, weights: dict[str, float] | None,
              variables: dict[str, float] | None) -> list[Breakeven]:
    """For each variable (others held at their current values): the nearest value, in each
    direction, at which the recommendation flips. None means no flip within the allowed range."""
    current = resolve_variables(decision, variables)
    winner = score(decision, weights, current).winner
    out = []
    for var in decision.variables:
        out.append(Breakeven(
            variable_id=var.id, name=var.name, unit=var.unit, current=current[var.id],
            winner_now=winner,
            flip_up=_search(decision, weights, current, var, +1, winner),
            flip_down=_search(decision, weights, current, var, -1, winner)))
    return out
