import argparse
import json
import sys
from typing import Any, Dict


def ping() -> Dict[str, str]:
    return {"status": "ok", "service": "azure-resource-graph-mcp"}


def query(kusto: str) -> Dict[str, Any]:
    return {"status": "ok", "tool": "query", "query": kusto, "results": [], "note": "stub response"}


def main(argv=None) -> None:
    parser = argparse.ArgumentParser(description="azure-resource-graph-mcp stub")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("ping")
    q = sub.add_parser("query")
    q.add_argument("kusto")

    args = parser.parse_args(argv)

    if args.cmd == "query":
        data = query(args.kusto)
    else:
        data = ping()

    json.dump(data, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
