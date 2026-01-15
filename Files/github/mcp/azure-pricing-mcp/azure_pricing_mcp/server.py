import argparse
import json
import os
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
    # Should not reach here, but keep type checker happy.
    if last_error:
        raise last_error
    raise RuntimeError("Failed to fetch pricing data")


def price_search(sku: str, region: str | None = None, currency: str | None = None) -> Dict[str, Any]:
    filters = [f"contains(skuName,'{sku}')"]
    if region:
        filters.append(f"armRegionName eq '{region}'")
    if currency:
        filters.append(f"currencyCode eq '{currency}'")
    filter_expr = " and ".join(filters)
    data = fetch_prices(filter_expr)
    return {
        "status": "ok",
        "tool": "price_search",
        "sku": sku,
        "count": len(data.get("Items", [])),
        "items": data.get("Items", [])[:5],
    }


def cost_estimate(
    sku: str, quantity: int, region: str | None = None, currency: str | None = None
) -> Dict[str, Any]:
    search = price_search(sku, region=region, currency=currency)
    items: List[Dict[str, Any]] = search.get("items", [])
    if not items:
        return {"status": "not-found", "tool": "cost_estimate", "sku": sku}
    price = items[0].get("retailPrice", 0.0) or 0.0
    monthly = price * quantity * 730  # approx hours/month
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

    args = parser.parse_args(argv)

    region = args.region or DEFAULT_REGION
    currency = args.currency or DEFAULT_CURRENCY

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
