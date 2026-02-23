"""
Shared SlowAPI rate limiter instance.

Defined here (not in main.py) to avoid circular imports when routers
need to reference the limiter via @limiter.limit() decorators.

main.py still attaches the limiter to app.state for the middleware to work:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.rate_limit],
)
