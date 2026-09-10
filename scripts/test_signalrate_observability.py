import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("signalrate-observability.py")
SPEC = importlib.util.spec_from_file_location("signalrate_observability", MODULE_PATH)
assert SPEC and SPEC.loader
OBSERVABILITY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(OBSERVABILITY)


class SignalRateObservabilityTest(unittest.TestCase):
    def test_privacy_id_is_stable_keyed_and_does_not_contain_ip(self):
        first = OBSERVABILITY.privacy_id("203.0.113.10", b"a" * 32)
        self.assertEqual(first, OBSERVABILITY.privacy_id("203.0.113.10", b"a" * 32))
        self.assertNotEqual(first, OBSERVABILITY.privacy_id("203.0.113.11", b"a" * 32))
        self.assertNotEqual(first, OBSERVABILITY.privacy_id("203.0.113.10", b"b" * 32))
        self.assertRegex(first, r"^c_[a-f0-9]{12}$")
        self.assertNotIn("203.0.113.10", first)

    def test_nearest_rank_percentiles(self):
        values = [1, 2, 3, 4, 100]
        self.assertEqual(OBSERVABILITY.percentile(values, 50), 3)
        self.assertEqual(OBSERVABILITY.percentile(values, 90), 100)
        self.assertEqual(OBSERVABILITY.percentile([], 95), 0)

    def test_content_classification_prioritizes_static_api_and_rsc(self):
        self.assertEqual(OBSERVABILITY.content_group({"upstream_kind": "static"}), "static assets")
        self.assertEqual(OBSERVABILITY.content_group({"upstream_kind": "backend_api"}), "APIs")
        self.assertEqual(OBSERVABILITY.content_group({"is_rsc": "true"}), "Next.js RSC")
        self.assertEqual(OBSERVABILITY.content_group({"response_content_type": "text/html; charset=utf-8"}), "HTML")

    def test_request_id_validation_rejects_client_chosen_shapes(self):
        self.assertTrue(OBSERVABILITY.REQUEST_ID.fullmatch("sr_" + "a" * 32))
        self.assertFalse(OBSERVABILITY.REQUEST_ID.fullmatch("attacker-id"))
        self.assertFalse(OBSERVABILITY.REQUEST_ID.fullmatch("sr_" + "A" * 32))

    def test_crawler_claims_are_never_labelled_as_verified(self):
        self.assertEqual(OBSERVABILITY.traffic_group("googlebot_claim_unverified"), "crawler claims")
        self.assertEqual(OBSERVABILITY.traffic_group("bingbot_claim_unverified"), "crawler claims")


if __name__ == "__main__":
    unittest.main()
