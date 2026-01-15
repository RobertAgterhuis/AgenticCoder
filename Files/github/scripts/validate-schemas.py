import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator, RefResolver

ROOT = Path(__file__).resolve().parent.parent
SCHEMAS_DIR = ROOT / "schemas"


def load_schema(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def iter_schema_files(base: Path):
    for p in base.rglob("*.json"):
        yield p


def main() -> int:
    metaschema = Draft202012Validator.META_SCHEMA
    resolver = RefResolver.from_schema(metaschema)
    errors_found = False

    for schema_file in iter_schema_files(SCHEMAS_DIR):
        schema = load_schema(schema_file)
        try:
            Draft202012Validator.check_schema(schema, resolver=resolver)
            print(f"[OK] {schema_file.relative_to(ROOT)}")
        except Exception as exc:  # pylint: disable=broad-except
            errors_found = True
            print(f"[FAIL] {schema_file.relative_to(ROOT)}: {exc}", file=sys.stderr)
    return 1 if errors_found else 0


if __name__ == "__main__":
    sys.exit(main())
