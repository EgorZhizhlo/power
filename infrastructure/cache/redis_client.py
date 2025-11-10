import redis.asyncio as aioredis
from core.config import settings


COMMON_PARAMS = dict(
    retry_on_timeout=True,
    health_check_interval=30,
    socket_keepalive=True,
    socket_timeout=5,
    socket_connect_timeout=5,
)

redis = None
redis_bytes = None


async def init_redis():
    global redis, redis_bytes
    redis = aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        **COMMON_PARAMS,
    )
    redis_bytes = aioredis.from_url(
        settings.redis_url,
        decode_responses=False,
        **COMMON_PARAMS,
    )


async def close_redis():
    """Закрывает соединения при завершении приложения."""
    if redis:
        await redis.close()
    if redis_bytes:
        await redis_bytes.close()
