"""Loads and validates decision configs from YAML. Adding a decision = adding a file."""
from __future__ import annotations

from pathlib import Path

import yaml

from .config import settings
from .schemas import Decision


def load_decisions(directory: Path | None = None) -> dict[str, Decision]:
    directory = Path(directory or settings.decisions_dir)
    found: dict[str, Decision] = {}
    for path in sorted(directory.glob("*.y*ml")):
        with open(path, encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        try:
            decision = Decision.model_validate(data)
        except Exception as exc:  # surface which file is broken
            raise ValueError(f"Invalid decision file {path.name}: {exc}") from exc
        if decision.id in found:
            raise ValueError(f"Duplicate decision id '{decision.id}' in {path.name}")
        found[decision.id] = decision
    return found
