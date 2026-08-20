import numpy as np
import pytest

from extractor.locate import NoOnsetFoundError, find_note_window


def _make_note(sr, freq, start_s, decay_duration_s, total_s, decay_rate=30.0):
    t = np.arange(int(total_s * sr)) / sr
    envelope = np.zeros_like(t)
    mask = (t >= start_s) & (t < start_s + decay_duration_s)
    local_t = t[mask] - start_s
    envelope[mask] = np.exp(-decay_rate * local_t)
    return envelope * np.sin(2 * np.pi * freq * t)


@pytest.fixture
def sr():
    return 22050


@pytest.fixture
def two_notes(sr):
    total = 4.0
    note1 = _make_note(sr, 261.63, 1.0, 0.8, total)
    note2 = _make_note(sr, 329.63, 2.0, 0.8, total)
    return (note1 + note2).astype(np.float32), sr


def test_finds_nearest_onset(two_notes):
    samples, sr = two_notes
    result = find_note_window(samples, sr, target_time=1.05, search_window=0.5)
    assert result.onset == pytest.approx(1.0, abs=0.05)


def test_offset_before_next_onset_via_release(two_notes):
    samples, sr = two_notes
    result = find_note_window(samples, sr, target_time=1.0, search_window=0.5, max_release=3.0)
    # La envolvente cae por debajo de -40dB bastante antes del siguiente ataque en 2.0s.
    assert result.offset < 2.0
    assert result.offset > result.onset


def test_second_note_found(two_notes):
    samples, sr = two_notes
    result = find_note_window(samples, sr, target_time=2.02, search_window=0.5)
    assert result.onset == pytest.approx(2.0, abs=0.05)


def test_out_of_range_time_raises(two_notes):
    samples, sr = two_notes
    with pytest.raises(NoOnsetFoundError):
        find_note_window(samples, sr, target_time=100.0, search_window=0.5)


def test_no_onset_nearby_raises(two_notes):
    samples, sr = two_notes
    with pytest.raises(NoOnsetFoundError):
        find_note_window(samples, sr, target_time=3.5, search_window=0.2)


def test_chord_cluster_groups_simultaneous_onsets(sr):
    total = 3.0
    note1 = _make_note(sr, 261.63, 1.0, 0.8, total)
    note2 = _make_note(sr, 329.63, 1.02, 0.8, total)  # 20ms después: mismo "acorde"
    samples = (note1 + note2).astype(np.float32)

    result = find_note_window(samples, sr, target_time=1.0, search_window=0.5)
    assert len(result.cluster_onsets) >= 1
