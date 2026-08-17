from unittest.mock import MagicMock

from app.core.limiter import get_client_ip


def _mock_request(headers: dict, client_host: str | None = None):
    request = MagicMock()
    request.headers = headers
    request.client = MagicMock(host=client_host) if client_host else None
    return request


def test_uses_last_hop_of_x_forwarded_for():
    # The proxy in front of the app appends the real client IP as the last entry.
    # Trusting the first entry would let a client spoof it via their own header.
    request = _mock_request({"X-Forwarded-For": "203.0.113.5, 10.0.0.1"})
    assert get_client_ip(request) == "10.0.0.1"


def test_falls_back_to_request_client_host_without_forwarded_header():
    request = _mock_request({}, client_host="192.168.1.1")
    assert get_client_ip(request) == "192.168.1.1"


def test_falls_back_to_loopback_when_nothing_is_available():
    request = _mock_request({})
    assert get_client_ip(request) == "127.0.0.1"


def test_underscored_header_name_is_not_mistaken_for_the_real_one():
    # Guards against reintroducing slowapi's own get_ipaddr bug, which checks
    # "X_FORWARDED_FOR" (underscores) and so never matches the real header.
    request = _mock_request({"X_FORWARDED_FOR": "203.0.113.5"}, client_host="192.168.1.1")
    assert get_client_ip(request) == "192.168.1.1"
