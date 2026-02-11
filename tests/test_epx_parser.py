from pathlib import Path

from portfolio.epx import parse_epx_html


FIXTURES = Path(__file__).parent / "fixtures"


def test_parse_epx_standard_fixture() -> None:
    html = (FIXTURES / "epx_standard.html").read_text(encoding="utf-8")

    records = parse_epx_html(html)

    assert len(records) == 2
    assert records[0].region == "Zürich"
    assert records[0].index_value == 123.4
    assert records[1].index_value == 119.8


def test_parse_epx_with_structure_deviation() -> None:
    html = (FIXTURES / "epx_structure_variation.html").read_text(encoding="utf-8")

    records = parse_epx_html(html)

    assert [r.region for r in records] == ["Basel", "Lausanne"]
    assert records[0].index_value == 117200.0
    assert records[0].date_label == "2025-Q4"
