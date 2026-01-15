"""AVM Resolver skeleton.

Parses a stub mapping registry and returns mapped module info for a given resource type.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path(__file__).resolve().parent
REGISTRY = ROOT / "registry.json"


def load_registry() -> Dict[str, Any]:
    with REGISTRY.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def resolve(resource_type: str) -> Optional[Dict[str, Any]]:
    data = load_registry()
    for entry in data.get("modules", []):
        if entry.get("resourceType") == resource_type:
            return entry
    return None


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="AVM resolver stub")
    parser.add_argument("resource_type", help="Azure resource type, e.g., Microsoft.Web/sites")
    args = parser.parse_args()

    match = resolve(args.resource_type)
    if match:
        print(json.dumps({"status": "ok", "match": match}))
    else:
        print(json.dumps({"status": "not-found", "resourceType": args.resource_type}))


if __name__ == "__main__":
    main()
