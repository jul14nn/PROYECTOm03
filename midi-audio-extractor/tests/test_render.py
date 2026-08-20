import numpy as np
import soundfile as sf

from extractor.render import export_one_shot


def test_export_one_shot_trims_and_fades(tmp_path):
    sr = 22050
    duration = 2.0
    t = np.arange(int(duration * sr)) / sr
    samples = np.sin(2 * np.pi * 440 * t).astype(np.float32).reshape(-1, 1)

    out_path = tmp_path / "one_shot.wav"
    export_one_shot(samples, sr, onset=0.5, offset=1.0, out_path=out_path,
                     pre_roll=0.01, fade_out=0.02)

    assert out_path.exists()
    result, out_sr = sf.read(str(out_path))
    assert out_sr == sr
    expected_len = int((1.0 - 0.5 + 0.01) * sr)
    assert abs(len(result) - expected_len) <= 2

    # El final debe estar atenuado por el fade-out (mucho más bajo que el máximo).
    tail_peak = np.abs(result[-5:]).max()
    overall_peak = np.abs(result).max()
    assert tail_peak < overall_peak * 0.2


def test_export_one_shot_normalizes(tmp_path):
    sr = 22050
    t = np.arange(int(0.5 * sr)) / sr
    samples = (0.1 * np.sin(2 * np.pi * 440 * t)).astype(np.float32).reshape(-1, 1)

    out_path = tmp_path / "norm.wav"
    export_one_shot(samples, sr, onset=0.0, offset=0.5, out_path=out_path,
                     pre_roll=0.0, fade_out=0.0, normalize=True)

    result, _ = sf.read(str(out_path))
    assert np.abs(result).max() > 0.9
