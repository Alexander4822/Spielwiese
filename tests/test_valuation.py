import pytest

from portfolio.valuation import (
    allocation_within_tolerance,
    normalize_allocations,
    project_property_value,
)


def test_property_progression_from_baseline_to_current() -> None:
    current = project_property_value(
        baseline_value=1_000_000,
        baseline_index=105.0,
        current_index=110.25,
    )

    assert current == pytest.approx(1_050_000)


def test_property_progression_rejects_invalid_index() -> None:
    with pytest.raises(ValueError):
        project_property_value(1000, 0, 110)


def test_allocations_sum_roughly_100_percent() -> None:
    allocations = normalize_allocations({"stocks": 62, "cash": 18, "real_estate": 20})

    assert allocation_within_tolerance(allocations, tolerance_percent=0.1)


def test_allocation_outside_tolerance_fails() -> None:
    allocations = {"stocks": 40.0, "cash": 30.0, "real_estate": 29.0}

    assert not allocation_within_tolerance(allocations, tolerance_percent=0.5)
