import os
import sys
import unittest
from unittest.mock import patch

# Ensure package import works when running tests from repo root
CURRENT_DIR = os.path.dirname(__file__)
PACKAGE_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PACKAGE_ROOT not in sys.path:
    sys.path.insert(0, PACKAGE_ROOT)

from azure_pricing_mcp import server  # noqa: E402


def make_response(items):
    class FakeResponse:
        def __init__(self, data):
            self._data = data

        def raise_for_status(self):
            return None

        def json(self):
            return {"Items": self._data}

    return FakeResponse(items)


class ServerTests(unittest.TestCase):
    def test_price_search_filters_and_limits(self):
        items = [{"retailPrice": i} for i in range(10)]
        with patch("azure_pricing_mcp.server.requests.get") as mock_get:
            mock_get.return_value = make_response(items)
            result = server.price_search("B2s", region="eastus", currency="USD")

        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["count"], 10)
        self.assertEqual(len(result["items"]), 5)
        params = mock_get.call_args.kwargs["params"]["$filter"]
        self.assertIn("contains(skuName,'B2s')", params)
        self.assertIn("armRegionName eq 'eastus'", params)
        self.assertIn("currencyCode eq 'USD'", params)

    def test_cost_estimate_not_found(self):
        with patch("azure_pricing_mcp.server.requests.get") as mock_get:
            mock_get.return_value = make_response([])
            result = server.cost_estimate("B2s", 1, region=None, currency=None)

        self.assertEqual(result["status"], "not-found")

    def test_cost_estimate_monthly(self):
        with patch("azure_pricing_mcp.server.requests.get") as mock_get:
            mock_get.return_value = make_response([{"retailPrice": 0.5}])
            result = server.cost_estimate("B2s", 2)

        self.assertEqual(result["status"], "ok")
        self.assertAlmostEqual(result["unit_price"], 0.5)
        self.assertAlmostEqual(result["monthly_usd"], 730.0)


if __name__ == "__main__":
    unittest.main()
