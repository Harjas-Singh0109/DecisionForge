"""Deterministic scoring. Pure Python: no LLM, no randomness.

Pipeline for each (dimension, option):
  1. metric  = baseline value, adjusted by scenario variables (see Effect)
  2. score   = linear map worst->0, best->100, clamped to [0, 100]
  3. total   = sum(normalised weight * score)

Every step is disclosed in the result so a score can be traced end to end.
"""
from __future__ import annotations

from ..schemas import (Decision, DimensionScore, OptionScore, Provenance,
                       ScoreResult)


class InputError(ValueError):
    """Bad weights or variable values supplied by the caller."""


def resolve_weights(decision: Decision, weights: dict[str, float] | None) -> dict[str, float]:
    """Merge caller weights over the defaults, then normalise to sum to 1."""
    merged = {d.id: d.default_weight for d in decision.dimensions}
    if weights:
        unknown = set(weights) - set(merged)
        if unknown:
            raise InputError(f"unknown dimension(s): {sorted(unknown)}")
        for key, val in weights.items():
            if val < 0:
                raise InputError(f"weight for '{key}' cannot be negative")
        merged.update(weights)
    total = sum(merged.values())
    if total <= 0:
        raise InputError("at least one weight must be greater than zero")
    return {k: v / total for k, v in merged.items()}


def resolve_variables(decision: Decision, variables: dict[str, float] | None) -> dict[str, float]:
    """Merge caller variable values over the defaults and range-check them."""
    merged = {v.id: v.default for v in decision.variables}
    if variables:
        known = {v.id: v for v in decision.variables}
        unknown = set(variables) - set(known)
        if unknown:
            raise InputError(f"unknown variable(s): {sorted(unknown)}")
        for key, val in variables.items():
            var = known[key]
            if not (var.min <= val <= var.max):
                raise InputError(f"'{key}' must be between {var.min} and {var.max}")
            merged[key] = float(val)
    return merged


def effective_metric(decision: Decision, dimension_id: str, option_id: str,
                     variables: dict[str, float]) -> float:
    dim = next(d for d in decision.dimensions if d.id == dimension_id)
    factor = 1.0
    for var in decision.variables:
        x = variables[var.id]
        for eff in var.effects:
            if eff.dimension == dimension_id and eff.option == option_id:
                factor += eff.elasticity * x / 100.0
    return dim.values[option_id].value * max(factor, 0.0)


def metric_to_score(metric: float, worst: float, best: float) -> float:
    raw = 100.0 * (metric - worst) / (best - worst)
    return max(0.0, min(100.0, raw))


def score(decision: Decision, weights: dict[str, float] | None = None,
          variables: dict[str, float] | None = None) -> ScoreResult:
    w = resolve_weights(decision, weights)
    v = resolve_variables(decision, variables)

    option_scores: list[OptionScore] = []
    unsourced: list[str] = []
    for opt in decision.options:
        dims: list[DimensionScore] = []
        for dim in decision.dimensions:
            metric = effective_metric(decision, dim.id, opt.id, v)
            s = metric_to_score(metric, dim.worst, dim.best)
            prov = dim.values[opt.id].provenance
            if prov == Provenance.placeholder:
                unsourced.append(f"{dim.id}/{opt.id}")
            dims.append(DimensionScore(
                dimension_id=dim.id, metric_value=round(metric, 4), score=round(s, 2),
                weight=round(w[dim.id], 4), contribution=round(s * w[dim.id], 2), provenance=prov))
        total = sum(d.score * w[d.dimension_id] for d in dims)
        option_scores.append(OptionScore(option_id=opt.id, name=opt.name,
                                         total=round(total, 2), dimensions=dims))

    order = {o.id: i for i, o in enumerate(decision.options)}  # stable tie-break
    option_scores.sort(key=lambda o: (-o.total, order[o.option_id]))
    return ScoreResult(
        weights={k: round(x, 4) for k, x in w.items()},
        variables=v,
        options=option_scores,
        winner=option_scores[0].option_id,
        runner_up=option_scores[1].option_id,
        margin=round(option_scores[0].total - option_scores[1].total, 2),
        unsourced_inputs=unsourced,
        all_sourced=not unsourced,
    )
