import argparse
import json
import os
import re
import sys
import time
from typing import Any, Dict, List

import requests

PRICING_API = os.getenv("AZURE_PRICING_API", "https://prices.azure.com/api/retail/prices")
TIMEOUT = int(os.getenv("AZURE_PRICING_TIMEOUT", "10"))
RETRIES = int(os.getenv("AZURE_PRICING_RETRIES", "3"))
BACKOFF = float(os.getenv("AZURE_PRICING_BACKOFF", "0.5"))
DEFAULT_REGION = os.getenv("AZURE_PRICING_REGION")
DEFAULT_CURRENCY = os.getenv("AZURE_PRICING_CURRENCY")


def _odata_escape(value: str) -> str:
    # OData string literal escaping uses doubled single-quotes.
    return value.replace("'", "''")


def fetch_prices(filter_expr: str) -> Dict[str, Any]:
    params = {"$filter": filter_expr}
    last_error: Exception | None = None
    for attempt in range(RETRIES):
        try:
            resp = requests.get(PRICING_API, params=params, timeout=TIMEOUT)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            last_error = exc
            if attempt == RETRIES - 1:
                raise
            time.sleep(BACKOFF * (2 ** attempt))
    if last_error:
        raise last_error
    raise RuntimeError("Failed to fetch pricing data")


def price_search(sku: str, region: str | None = None, currency: str | None = None) -> Dict[str, Any]:
    if not isinstance(sku, str) or not sku.strip():
        raise ValueError("sku must be a non-empty string")
    if len(sku) > 200:
        raise ValueError("sku is too long")

    sku_escaped = _odata_escape(sku.strip())
    filters = [f"contains(skuName,'{sku_escaped}')"]
    if region:
        region_escaped = _odata_escape(str(region).strip())
        if region_escaped:
            filters.append(f"armRegionName eq '{region_escaped}'")
    if currency:
        currency_escaped = _odata_escape(str(currency).strip())
        if currency_escaped:
            filters.append(f"currencyCode eq '{currency_escaped}'")
    filter_expr = " and ".join(filters)
    data = fetch_prices(filter_expr)
    return {
        "status": "ok",
        "tool": "price_search",
        "sku": sku,
        "count": len(data.get("Items", [])),
        "items": data.get("Items", [])[:5],
    }


def cost_estimate(sku: str, quantity: int, region: str | None = None, currency: str | None = None) -> Dict[str, Any]:
    search = price_search(sku, region=region, currency=currency)
    items: List[Dict[str, Any]] = search.get("items", [])
    if not items:
        return {"status": "not-found", "tool": "cost_estimate", "sku": sku}
    price = items[0].get("retailPrice", 0.0) or 0.0
    monthly = price * quantity * 730
    return {
        "status": "ok",
        "tool": "cost_estimate",
        "sku": sku,
        "quantity": quantity,
        "unit_price": price,
        "monthly_usd": monthly,
    }


def ping() -> Dict[str, str]:
    return {"status": "ok", "service": "azure-pricing-mcp"}


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
                "name": "price_search",
                "description": "Search Azure Retail Prices for a SKU name (optionally filtered by region/currency)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "sku": {"type": "string"},
                        "region": {"type": ["string", "null"]},
                        "currency": {"type": ["string", "null"]},
                    },
                    "required": ["sku"],
                },
            },
            {
                "name": "cost_estimate",
                "description": "Estimate monthly cost (rough) for a SKU and quantity (optionally filtered by region/currency)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "sku": {"type": "string"},
                        "quantity": {"type": "integer", "minimum": 1},
                        "region": {"type": ["string", "null"]},
                        "currency": {"type": ["string", "null"]},
                    },
                    "required": ["sku"],
                },
            },
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
                    "serverInfo": {"name": "azure-pricing-mcp", "version": "0.1.0"},
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

                region = arguments.get("region") or DEFAULT_REGION
                currency = arguments.get("currency") or DEFAULT_CURRENCY

                if name == "price_search":
                    sku = arguments.get("sku")
                    if not sku:
                        _mcp_write(_mcp_error(req_id, -32602, "Missing required argument: sku"))
                        return
                    _mcp_write(_mcp_result(req_id, price_search(str(sku), region=region, currency=currency)))
                    return

                if name == "cost_estimate":
                    sku = arguments.get("sku")
                    if not sku:
                        _mcp_write(_mcp_error(req_id, -32602, "Missing required argument: sku"))
                        return
                    qty = arguments.get("quantity", 1)
                    try:
                        qty_int = int(qty)
                    except Exception:
                        _mcp_write(_mcp_error(req_id, -32602, "quantity must be an integer"))
                        return
                    _mcp_write(_mcp_result(req_id, cost_estimate(str(sku), qty_int, region=region, currency=currency)))
                    return

                _mcp_write(_mcp_error(req_id, -32601, f"Unknown tool: {name}"))
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
                # Skip malformed header block.
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
    parser = argparse.ArgumentParser(description="azure-pricing-mcp")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("ping")

    ps = sub.add_parser("price_search")
    ps.add_argument("sku")
    ps.add_argument("--region", help="Azure region filter (e.g., eastus)")
    ps.add_argument("--currency", help="Currency code (e.g., USD)")

    ce = sub.add_parser("cost_estimate")
    ce.add_argument("sku")
    ce.add_argument("quantity", type=int, nargs="?", default=1)
    ce.add_argument("--region", help="Azure region filter (e.g., eastus)")
    ce.add_argument("--currency", help="Currency code (e.g., USD)")

    # MCP stdio JSON-RPC mode
    sub.add_parser("mcp", help="Run JSON-RPC tool server over stdio (Content-Length framing)")

    args = parser.parse_args(argv)

    if args.cmd == "mcp":
        run_mcp_stdio()
        return

    region = getattr(args, "region", None) or DEFAULT_REGION
    currency = getattr(args, "currency", None) or DEFAULT_CURRENCY

    if args.cmd == "price_search":
        data = price_search(args.sku, region=region, currency=currency)
    elif args.cmd == "cost_estimate":
        data = cost_estimate(args.sku, args.quantity, region=region, currency=currency)
    else:
        data = ping()

    json.dump(data, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
