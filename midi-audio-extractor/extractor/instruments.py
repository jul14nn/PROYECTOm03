"""Traduce un nombre de instrumento (ES/EN) al stem que separa Demucs (htdemucs_6s)."""

import unicodedata

# Stems que produce el modelo htdemucs_6s de Demucs.
STEMS = ("vocals", "drums", "bass", "guitar", "piano", "other")

_SYNONYMS = {
    "vocals": {"voz", "voces", "vocal", "vocals", "cantante", "singer", "vox"},
    "drums": {"bateria", "batería", "drums", "percusion", "percusión", "drum"},
    "bass": {"bajo", "bass", "contrabajo"},
    "guitar": {
        "guitarra",
        "guitar",
        "guitarra electrica",
        "guitarra eléctrica",
        "guitarra acustica",
        "guitarra acústica",
        "electric guitar",
        "acoustic guitar",
    },
    "piano": {"piano", "piano acustico", "piano acústico", "teclado", "keys", "keyboard"},
}


class UnknownInstrumentError(ValueError):
    pass


def _normalize(text: str) -> str:
    text = text.strip().lower()
    text = unicodedata.normalize("NFKD", text)
    return "".join(c for c in text if not unicodedata.combining(c))


def resolve_stem(instrument: str) -> tuple[str, bool]:
    """Devuelve (nombre_stem, es_exacto).

    Si el instrumento no coincide con ningún stem dedicado, cae en "other"
    y es_exacto=False, porque esa pista mezcla todo lo que no sea voz,
    batería, bajo, guitarra o piano (peor aislamiento).
    """
    normalized = _normalize(instrument)

    for stem, synonyms in _SYNONYMS.items():
        normalized_synonyms = {_normalize(s) for s in synonyms}
        if normalized in normalized_synonyms:
            return stem, True

    if normalized in {"other", "otro", "otros", "resto"}:
        return "other", True

    return "other", False
