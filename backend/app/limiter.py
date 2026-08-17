from fastapi import Request
from slowapi import Limiter


def get_client_ip(request: Request) -> str:
    """Identifies the client for rate-limiting purposes.

    Behind a reverse proxy (e.g. Render), every request arrives from the proxy's own
    address, so request.client.host is the same for all visitors - it would collapse
    the per-IP rate limit into one shared bucket for the whole service. X-Forwarded-For
    holds the real chain instead. slowapi ships a get_ipaddr helper for this, but it
    checks request.headers["X_FORWARDED_FOR"] (underscores), which never matches the
    real "X-Forwarded-For" header, so it silently falls through to the same problem.

    The *last* hop of X-Forwarded-For is used, not the first: the proxy in front of this
    app is expected to append the real connecting peer's address, so trusting the first
    entry would let a client spoof an arbitrary IP (and thus a fresh rate-limit bucket)
    by just setting their own X-Forwarded-For header.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[-1].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


limiter = Limiter(key_func=get_client_ip)
