from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Callable, Generic, TypeVar

T = TypeVar("T")


@dataclass(frozen=True)
class JobDefinition:
    name: str
    schedule: str
    description: str


def scheduler_concept() -> list[JobDefinition]:
    """Execution model:
    1) Run EPX update once at startup.
    2) Run EPX refresh daily.
    3) Run net-worth snapshot daily.
    """

    return [
        JobDefinition(
            name="epx_startup_update",
            schedule="on_startup",
            description="Immediate EPX update during application bootstrap.",
        ),
        JobDefinition(
            name="epx_daily_refresh",
            schedule="daily",
            description="Daily EPX refresh to keep indices current.",
        ),
        JobDefinition(
            name="networth_daily_snapshot",
            schedule="daily",
            description="Persist daily net-worth snapshot.",
        ),
    ]


def refresh_strategy(has_persistent_process: bool) -> str:
    if has_persistent_process:
        return "scheduler"
    return "on_demand_with_ttl_cache"


class TTLCache(Generic[T]):
    def __init__(self, ttl_seconds: int) -> None:
        self.ttl_seconds = ttl_seconds
        self._value: T | None = None
        self._expires_at: datetime | None = None

    def get_or_load(self, loader: Callable[[], T], now: datetime | None = None) -> T:
        now = now or datetime.utcnow()
        if self._value is not None and self._expires_at is not None and now < self._expires_at:
            return self._value

        self._value = loader()
        self._expires_at = now + timedelta(seconds=self.ttl_seconds)
        return self._value
