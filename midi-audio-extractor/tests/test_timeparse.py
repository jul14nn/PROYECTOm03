import pytest

from extractor.timeparse import TimestampError, parse_timestamp


def test_seconds_only():
    assert parse_timestamp("64") == pytest.approx(64.0)
    assert parse_timestamp("64.5") == pytest.approx(64.5)


def test_minutes_seconds():
    assert parse_timestamp("1:04") == pytest.approx(64.0)
    assert parse_timestamp("1:04.5") == pytest.approx(64.5)


def test_hours_minutes_seconds():
    assert parse_timestamp("1:02:03") == pytest.approx(3723.0)


def test_invalid_format():
    with pytest.raises(TimestampError):
        parse_timestamp("abc")


def test_too_many_parts():
    with pytest.raises(TimestampError):
        parse_timestamp("1:02:03:04")


def test_negative():
    with pytest.raises(TimestampError):
        parse_timestamp("-5")


def test_seconds_overflow():
    with pytest.raises(TimestampError):
        parse_timestamp("1:75")


def test_empty():
    with pytest.raises(TimestampError):
        parse_timestamp("   ")
