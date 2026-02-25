from __future__ import annotations

def project_property_value(
    baseline_value: float,
    baseline_index: float,
    current_index: float,
) -> float:
    """Forward-fill property valuation from baseline index level to current index."""
    if baseline_index <= 0 or current_index <= 0:
        raise ValueError("Index values must be positive")

    return baseline_value * (current_index / baseline_index)


def normalize_allocations(weights: dict[str, float]) -> dict[str, float]:
    total = sum(weights.values())
    if total <= 0:
        raise ValueError("Total allocation must be positive")
    return {k: (v / total) * 100 for k, v in weights.items()}


def allocation_within_tolerance(
    allocations_percent: dict[str, float],
    tolerance_percent: float = 0.5,
) -> bool:
    total = sum(allocations_percent.values())
    return abs(total - 100.0) <= tolerance_percent
