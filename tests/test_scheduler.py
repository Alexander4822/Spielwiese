from datetime import datetime, timedelta

from portfolio.scheduler import TTLCache, refresh_strategy, scheduler_concept


def test_scheduler_concept_contains_required_jobs() -> None:
    jobs = scheduler_concept()
    names = [job.name for job in jobs]

    assert names == [
        "epx_startup_update",
        "epx_daily_refresh",
        "networth_daily_snapshot",
    ]


def test_refresh_strategy_fallback_without_persistent_process() -> None:
    assert refresh_strategy(has_persistent_process=False) == "on_demand_with_ttl_cache"


def test_ttl_cache_reuses_and_refreshes() -> None:
    cache = TTLCache[int](ttl_seconds=60)
    counter = {"calls": 0}

    def load() -> int:
        counter["calls"] += 1
        return counter["calls"]

    now = datetime(2026, 1, 1, 10, 0, 0)
    first = cache.get_or_load(load, now)
    second = cache.get_or_load(load, now + timedelta(seconds=30))
    third = cache.get_or_load(load, now + timedelta(seconds=61))

    assert (first, second, third) == (1, 1, 2)
