import argparse
import json
import sys
from typing import Any, Dict, List


def ping() -> Dict[str, str]:
    return {"status": "ok", "service": "microsoft-docs-mcp"}


def search(query: str) -> Dict[str, Any]:
    hits: List[Dict[str, str]] = [
        {"title": "stub result", "url": "https://learn.microsoft.com/", "snippet": query},
    ]
    return {"status": "ok", "tool": "search", "query": query, "results": hits, "note": "stub response"}


def main(argv=None) -> None:
    parser = argparse.ArgumentParser(description="microsoft-docs-mcp stub")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("ping")
    s = sub.add_parser("search")
    s.add_argument("query")

    args = parser.parse_args(argv)

    if args.cmd == "search":
        data = search(args.query)
    else:
        data = ping()

    json.dump(data, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
