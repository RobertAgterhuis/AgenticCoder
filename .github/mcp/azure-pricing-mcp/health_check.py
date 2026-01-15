import json
import os
import sys

from azure_pricing_mcp.server import ping, price_search


def main() -> int:
    sku = os.getenv("AZURE_PRICING_HEALTH_SKU", "Standard_B2s")
    region = os.getenv("AZURE_PRICING_HEALTH_REGION")
    currency = os.getenv("AZURE_PRICING_HEALTH_CURRENCY")

    result = {"sku": sku, "region": region, "currency": currency}

    try:
        result["ping"] = ping()
    except Exception as exc:  # pragma: no cover
        result["ping"] = {"status": "error", "message": str(exc)}

    try:
        result["price_search"] = price_search(sku, region=region, currency=currency)
    except Exception as exc:  # pragma: no cover
        result["price_search"] = {"status": "error", "message": str(exc)}

    json.dump(result, sys.stdout)
    sys.stdout.write("\n")

    if any(v.get("status") == "error" for v in result.values() if isinstance(v, dict)):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
