from __future__ import annotations

from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Iterable


@dataclass(frozen=True)
class EpxRecord:
    region: str
    index_value: float
    date_label: str


class _TableTextParser(HTMLParser):
    """Lightweight HTML table parser that tolerates minor structure drift."""

    def __init__(self) -> None:
        super().__init__()
        self._in_row = False
        self._in_cell = False
        self._current_cell: list[str] = []
        self._current_row: list[str] = []
        self.rows: list[list[str]] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag == "tr":
            self._in_row = True
            self._current_row = []
        if self._in_row and tag in {"td", "th"}:
            self._in_cell = True
            self._current_cell = []

    def handle_data(self, data: str) -> None:
        if self._in_cell:
            self._current_cell.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self._in_row and tag in {"td", "th"} and self._in_cell:
            value = " ".join("".join(self._current_cell).split())
            self._current_row.append(value)
            self._in_cell = False
            self._current_cell = []

        if tag == "tr" and self._in_row:
            if any(self._current_row):
                self.rows.append(self._current_row)
            self._in_row = False
            self._current_row = []


def parse_epx_html(html: str) -> list[EpxRecord]:
    """Parse EPX table-like HTML into typed records."""

    parser = _TableTextParser()
    parser.feed(html)

    records: list[EpxRecord] = []
    for region, index_str, date_label in _clean_rows(parser.rows):
        records.append(
            EpxRecord(
                region=region,
                index_value=_parse_number(index_str),
                date_label=date_label,
            )
        )

    return records


def _clean_rows(rows: Iterable[list[str]]) -> Iterable[tuple[str, str, str]]:
    for row in rows:
        values = [cell for cell in row if cell and cell not in {"-", "Details"}]
        if len(values) < 3:
            continue
        if values[0].lower() in {"region", "gebiet"}:
            continue

        region = values[0]
        numeric_cells = [v for v in values[1:] if _looks_like_number(v)]
        if not numeric_cells:
            continue

        index_str = numeric_cells[0]
        date_label = values[-1] if values[-1] != index_str else "n/a"
        yield region, index_str, date_label


def _looks_like_number(value: str) -> bool:
    try:
        _parse_number(value)
        return True
    except ValueError:
        return False


def _parse_number(value: str) -> float:
    normalized = value.replace("'", "").replace(" ", "").replace(",", ".")
    return float(normalized)
