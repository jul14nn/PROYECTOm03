"""Parseo de timestamps tipo "1:04", "1:04.5", "64" o "1:02:03" a segundos."""


class TimestampError(ValueError):
    pass


def parse_timestamp(value: str) -> float:
    """Convierte "ss", "mm:ss" o "hh:mm:ss" (con decimales opcionales) a segundos."""
    raw = value.strip()
    if not raw:
        raise TimestampError("El timestamp está vacío.")

    parts = raw.split(":")
    if len(parts) > 3:
        raise TimestampError(
            f"Timestamp inválido: {value!r}. Usa formatos como '64', '1:04' o '1:02:03'."
        )

    try:
        numbers = [float(p) for p in parts]
    except ValueError as exc:
        raise TimestampError(f"Timestamp inválido: {value!r}.") from exc

    has_colon = len(numbers) > 1
    while len(numbers) < 3:
        numbers.insert(0, 0.0)
    hours, minutes, seconds = numbers

    if minutes < 0 or seconds < 0 or hours < 0:
        raise TimestampError("El timestamp no puede ser negativo.")
    if minutes >= 60 or (has_colon and seconds >= 60):
        raise TimestampError("Minutos y segundos deben ser menores que 60.")

    return hours * 3600 + minutes * 60 + seconds
