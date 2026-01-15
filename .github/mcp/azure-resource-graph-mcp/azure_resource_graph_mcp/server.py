import argparse
import json
import re
import sys
from typing import Any, Dict


def ping() -> Dict[str, str]:
    return {"status": "ok", "service": "azure-resource-graph-mcp"}


def query(kusto: str) -> Dict[str, Any]:
    return {"status": "ok", "tool": "query", "query": kusto, "results": [], "note": "stub response"}


def _mcp_write(obj: Dict[str, Any]) -> None:
    payload = json.dumps(obj).encode("utf-8")
    header = f"Content-Length: {len(payload)}\r\n\r\n".encode("utf-8")
    sys.stdout.buffer.write(header)
    sys.stdout.buffer.write(payload)
    sys.stdout.buffer.flush()


def _mcp_error(req_id: Any, code: int, message: str) -> Dict[str, Any]:
    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": code, "message": message}}


def _mcp_result(req_id: Any, result: Any) -> Dict[str, Any]:
    return {"jsonrpc": "2.0", "id": req_id, "result": result}


def _mcp_tools_list() -> Dict[str, Any]:
    return {
        "tools": [
            {
                "name": "query",
                "description": "Run an Azure Resource Graph KQL query (stub in this repo)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "kusto": {"type": "string"},
                        "query": {"type": "string"},
                    },
                },
            }
        ]
    }


def run_mcp_stdio() -> None:
    """Minimal MCP-ish JSON-RPC server over stdio using Content-Length framing."""
    buffer = b""

    def handle(msg: Dict[str, Any]) -> None:
        if not isinstance(msg, dict):
            return

        req_id = msg.get("id")
        method = msg.get("method")
        params = msg.get("params") or {}

        # Notifications: ignore.
        if req_id is None:
            return

        try:
            if method == "initialize":
                result = {
                    "serverInfo": {"name": "azure-resource-graph-mcp", "version": "0.1.0"},
                    "capabilities": {"tools": {}},
                }
                _mcp_write(_mcp_result(req_id, result))
                return

            if method == "ping":
                _mcp_write(_mcp_result(req_id, ping()))
                return

            if method == "tools/list":
                _mcp_write(_mcp_result(req_id, _mcp_tools_list()))
                return

            if method == "tools/call":
                name = params.get("name")
                arguments = params.get("arguments") or {}

                if name != "query":
                    _mcp_write(_mcp_error(req_id, -32601, f"Unknown tool: {name}"))
                    return

                kusto = arguments.get("kusto") or arguments.get("query")
                if not kusto:
                    _mcp_write(_mcp_error(req_id, -32602, "Missing required argument: kusto"))
                    return

                _mcp_write(_mcp_result(req_id, query(str(kusto))))
                return

            _mcp_write(_mcp_error(req_id, -32601, f"Unknown method: {method}"))
        except Exception as exc:
            _mcp_write(_mcp_error(req_id, -32000, f"Server error: {exc}"))

    # Read loop
    while True:
        chunk = sys.stdin.buffer.read1(4096) if hasattr(sys.stdin.buffer, "read1") else sys.stdin.buffer.read(4096)
        if not chunk:
            return
        buffer += chunk

        while True:
            header_end = buffer.find(b"\r\n\r\n")
            if header_end == -1:
                break

            header_bytes = buffer[:header_end]
            header_text = header_bytes.decode("utf-8", errors="ignore")
            match = re.search(r"Content-Length:\s*(\d+)", header_text, flags=re.IGNORECASE)
            if not match:
                buffer = buffer[header_end + 4 :]
                continue

            content_length = int(match.group(1))
            body_start = header_end + 4
            body_end = body_start + content_length
            if len(buffer) < body_end:
                break

            body = buffer[body_start:body_end]
            buffer = buffer[body_end:]

            try:
                msg = json.loads(body.decode("utf-8"))
            except Exception:
                continue

            handle(msg)


def main(argv=None) -> None:
    parser = argparse.ArgumentParser(description="azure-resource-graph-mcp stub")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("ping")
    q = sub.add_parser("query")
    q.add_argument("kusto")

    sub.add_parser("mcp")

    args = parser.parse_args(argv)

    if args.cmd == "mcp":
        run_mcp_stdio()
        return

    if args.cmd == "query":
        data = query(args.kusto)
    else:
        data = ping()

    json.dump(data, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
