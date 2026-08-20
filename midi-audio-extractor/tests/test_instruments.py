from extractor.instruments import resolve_stem


def test_piano_synonyms():
    assert resolve_stem("piano") == ("piano", True)
    assert resolve_stem("Piano") == ("piano", True)
    assert resolve_stem("teclado") == ("piano", True)


def test_spanish_synonyms():
    assert resolve_stem("voz") == ("vocals", True)
    assert resolve_stem("bajo") == ("bass", True)
    assert resolve_stem("guitarra") == ("guitar", True)
    assert resolve_stem("batería") == ("drums", True)
    assert resolve_stem("bateria") == ("drums", True)


def test_unknown_falls_back_to_other():
    stem, exact = resolve_stem("saxofon")
    assert stem == "other"
    assert exact is False


def test_other_is_exact():
    assert resolve_stem("other") == ("other", True)
    assert resolve_stem("otro") == ("other", True)
