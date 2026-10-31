import copy

import pytest

from app.decisions import load_decisions
from app.engine import scenario
from app.engine.scoring import InputError, metric_to_score, resolve_weights, score
from app.schemas import Decision


@pytest.fixture(scope="module")
def decision() -> Decision:
    return load_decisions()["nuclear_vs_solar_india"]


def test_demo_config_loads(decision):
    assert {o.id for o in decision.options} == {"nuclear", "solar"}
    assert len(decision.dimensions) == 5 and len(decision.variables) == 5


def test_metric_to_score_both_directions_and_clamp():
    assert metric_to_score(2, worst=10, best=2) == 100      # lower is better
    assert metric_to_score(10, worst=10, best=2) == 0
    assert metric_to_score(6, worst=10, best=2) == 50
    assert metric_to_score(250, worst=0, best=300) == pytest.approx(83.333, abs=0.01)
    assert metric_to_score(999, worst=0, best=300) == 100   # clamped
    assert metric_to_score(-5, worst=0, best=300) == 0


def test_weights_normalise_and_validate(decision):
    w = resolve_weights(decision, None)
    assert sum(w.values()) == pytest.approx(1.0)
    w2 = resolve_weights(decision, {"cost": 10})
    assert sum(w2.values()) == pytest.approx(1.0) and w2["cost"] > 0.8
    with pytest.raises(InputError):
        resolve_weights(decision, {"nope": 1})
    with pytest.raises(InputError):
        resolve_weights(decision, {"cost": -1})
    with pytest.raises(InputError):
        resolve_weights(decision, {d.id: 0 for d in decision.dimensions} | {})


def test_score_is_deterministic_and_consistent(decision):
    a, b = score(decision), score(decision)
    assert a == b
    assert a.winner != a.runner_up
    assert a.margin == pytest.approx(a.options[0].total - a.options[1].total, abs=0.01)
    for opt in a.options:
        assert opt.total == pytest.approx(sum(d.contribution for d in opt.dimensions), abs=0.1)


def test_placeholders_are_reported(decision):
    r = score(decision)
    assert not r.all_sourced
    assert "cost/nuclear" in r.unsourced_inputs


def test_variable_effects_move_scores_the_right_way(decision):
    base = score(decision)
    up = score(decision, variables={"nuclear_capex": 80})   # nuclear gets more expensive
    n_base = next(o for o in base.options if o.option_id == "nuclear").total
    n_up = next(o for o in up.options if o.option_id == "nuclear").total
    assert n_up < n_base
    with pytest.raises(InputError):
        score(decision, variables={"nuclear_capex": 9999})
    with pytest.raises(InputError):
        score(decision, variables={"ghost": 1})


def test_compare_no_change(decision):
    r = scenario.compare(decision, None, None, None)
    assert not r.changed and not r.changed_variables
    assert "No assumptions changed" in r.explanation


def _fixture() -> Decision:
    """Tiny hand-checkable decision. A costs 4, B costs 5 (lower is better, scale 10..0).
    Variable x raises A's cost by 1% per 1%, so A's cost reaches B's at x = +25%."""
    return Decision.model_validate({
        "id": "fx", "title": "fx", "question": "fx",
        "options": [{"id": "A", "name": "A"}, {"id": "B", "name": "B"}],
        "dimensions": [{"id": "cost", "name": "Cost", "default_weight": 1, "worst": 10, "best": 0,
                        "values": {"A": {"value": 4}, "B": {"value": 5}}}],
        "variables": [{"id": "x", "name": "A cost", "min": -50, "max": 100,
                       "effects": [{"dimension": "cost", "option": "A", "elasticity": 1.0}]}],
    })


def test_breakeven_matches_hand_calculation():
    fx = _fixture()
    assert score(fx).winner == "A"
    be = scenario.breakeven(fx, None, None)[0]
    assert be.flip_down is None                      # cheaper A can never lose
    assert be.flip_up.value == pytest.approx(25.0, abs=0.02)
    assert be.flip_up.new_winner == "B"


def test_compare_flip_explanation_on_fixture():
    fx = _fixture()
    r = scenario.compare(fx, None, None, {"x": 40})
    assert r.changed and r.winner_before == "A" and r.winner_after == "B"
    assert r.changed_variables[0].flips_alone
    assert r.shifts[0].dimension_id == "cost" and r.shifts[0].delta < 0
    assert "Recommendation changed from A to B" in r.explanation
    held = scenario.compare(fx, None, None, {"x": 10})
    assert not held.changed and "unchanged" in held.explanation


def test_demo_breakevens_are_self_consistent(decision):
    """Whatever flips exist in the demo config, the winner must really change at that value."""
    current = score(decision).variables
    for b in scenario.breakeven(decision, None, None):
        for fp, sign in ((b.flip_up, 1), (b.flip_down, -1)):
            if fp:
                before = score(decision, None, {b.variable_id: fp.value - sign * 0.05}).winner
                after = score(decision, None, {b.variable_id: fp.value + sign * 0.05}).winner
                assert before == b.winner_now and after == fp.new_winner
        assert b.current == current[b.variable_id]


def test_breakeven_none_when_no_flip_in_range(decision):
    be = scenario.breakeven(decision, None, None)
    for b in be:  # any reported flip must lie inside the variable's allowed range
        var = next(v for v in decision.variables if v.id == b.variable_id)
        for fp in (b.flip_up, b.flip_down):
            if fp:
                assert var.min <= fp.value <= var.max


def _broken(decision, mutate):
    data = copy.deepcopy(decision.model_dump())
    mutate(data)
    return Decision.model_validate(data)


def test_config_validation(decision):
    with pytest.raises(ValueError):
        _broken(decision, lambda d: d["dimensions"][0]["values"].pop("solar"))
    with pytest.raises(ValueError):
        _broken(decision, lambda d: d["dimensions"].append(copy.deepcopy(d["dimensions"][0])))
    with pytest.raises(ValueError):
        _broken(decision, lambda d: d["variables"][0]["effects"][0].update(dimension="ghost"))
    with pytest.raises(ValueError):
        _broken(decision, lambda d: d["dimensions"][0].update(worst=5, best=5))
