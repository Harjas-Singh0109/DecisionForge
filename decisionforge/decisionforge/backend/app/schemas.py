"""Pydantic models: the decision config (input) and score/scenario results (output).

Design rule: every number that drives a score carries a provenance flag.
`placeholder` values are allowed while building, but the API reports them so the
UI can never present unsourced numbers as research findings.
"""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field, model_validator


class Provenance(str, Enum):
    sourced = "sourced"
    placeholder = "placeholder"


# ---------------------------------------------------------------- config ----
class Option(BaseModel):
    id: str
    name: str
    description: str = ""


class MetricValue(BaseModel):
    """The baseline value of one dimension's metric for one option."""
    value: float
    provenance: Provenance = Provenance.placeholder
    source_ids: list[str] = Field(default_factory=list)
    note: str = ""


class Dimension(BaseModel):
    """A comparison dimension. `worst` maps to a score of 0, `best` to 100
    (linear, clamped). Works for both 'lower is better' and 'higher is better'."""
    id: str
    name: str
    description: str = ""
    unit: str = ""
    default_weight: float = Field(gt=0)
    worst: float
    best: float
    values: dict[str, MetricValue]  # keyed by option id

    @model_validator(mode="after")
    def _check_scale(self):
        if self.worst == self.best:
            raise ValueError(f"dimension '{self.id}': worst and best must differ")
        return self


class Effect(BaseModel):
    """How a scenario variable moves one option's metric on one dimension.
    metric' = metric * (1 + sum(elasticity * variable_pct / 100))."""
    dimension: str
    option: str
    elasticity: float
    provenance: Provenance = Provenance.placeholder
    note: str = ""


class Variable(BaseModel):
    """A user-adjustable assumption, expressed as a percent change vs baseline."""
    id: str
    name: str
    description: str = ""
    unit: str = "% change"
    min: float = -50
    max: float = 50
    default: float = 0
    effects: list[Effect] = Field(default_factory=list)

    @model_validator(mode="after")
    def _check_range(self):
        if not (self.min <= self.default <= self.max):
            raise ValueError(f"variable '{self.id}': default must be within [min, max]")
        return self


class Decision(BaseModel):
    id: str
    title: str
    question: str
    horizon_years: int = 10
    options: list[Option]
    dimensions: list[Dimension]
    variables: list[Variable] = Field(default_factory=list)

    @model_validator(mode="after")
    def _check_references(self):
        opt_ids = [o.id for o in self.options]
        dim_ids = [d.id for d in self.dimensions]
        var_ids = [v.id for v in self.variables]
        for label, ids in (("option", opt_ids), ("dimension", dim_ids), ("variable", var_ids)):
            if len(ids) != len(set(ids)):
                raise ValueError(f"duplicate {label} ids")
        if len(opt_ids) < 2:
            raise ValueError("a decision needs at least two options")
        for d in self.dimensions:
            if set(d.values) != set(opt_ids):
                raise ValueError(f"dimension '{d.id}' must define a value for every option")
        for v in self.variables:
            for e in v.effects:
                if e.dimension not in dim_ids or e.option not in opt_ids:
                    raise ValueError(f"variable '{v.id}' has an effect on an unknown dimension/option")
        return self


# --------------------------------------------------------------- results ----
class DimensionScore(BaseModel):
    dimension_id: str
    metric_value: float
    score: float          # 0..100
    weight: float         # normalised, sums to 1 across dimensions
    contribution: float   # score * weight
    provenance: Provenance


class OptionScore(BaseModel):
    option_id: str
    name: str
    total: float
    dimensions: list[DimensionScore]


class ScoreResult(BaseModel):
    weights: dict[str, float]
    variables: dict[str, float]
    options: list[OptionScore]   # sorted best-first
    winner: str
    runner_up: str
    margin: float                # winner total - runner-up total
    unsourced_inputs: list[str]  # "dimension/option" pairs still using placeholder values
    all_sourced: bool


class DimensionShift(BaseModel):
    dimension_id: str
    name: str
    lead_before: float
    lead_after: float
    delta: float


class VariableImpact(BaseModel):
    variable_id: str
    name: str
    baseline: float
    scenario: float
    flips_alone: bool


class ScenarioResult(BaseModel):
    baseline: ScoreResult
    scenario: ScoreResult
    changed: bool
    winner_before: str
    winner_after: str
    compared_against: str            # the option the baseline winner is measured against
    shifts: list[DimensionShift]     # sorted: biggest erosion of the baseline winner's lead first
    changed_variables: list[VariableImpact]
    explanation: str
    unsourced_effects: list[str]     # moved variables whose effects are still placeholders


class FlipPoint(BaseModel):
    value: float
    new_winner: str


class Breakeven(BaseModel):
    variable_id: str
    name: str
    unit: str
    current: float
    winner_now: str
    flip_up: FlipPoint | None = None
    flip_down: FlipPoint | None = None
