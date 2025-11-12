import redis.asyncio as aioredis
from core.config import settings


COMMON_PARAMS = dict(
    retry_on_timeout=True,
    health_check_interval=30,
    socket_keepalive=True,
    socket_timeout=5,
    socket_connect_timeout=5,
)

_redis = None
_redis_bytes = None


def _get_redis():
    """Ленивая инициализация Redis клиента."""
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            **COMMON_PARAMS,
        )
    return _redis


def _get_redis_bytes():
    """Ленивая инициализация Redis клиента для бинарных данных."""
    global _redis_bytes
    if _redis_bytes is None:
        _redis_bytes = aioredis.from_url(
            settings.redis_url,
            decode_responses=False,
            **COMMON_PARAMS,
        )
    return _redis_bytes


# Публичные интерфейсы
redis = _get_redis()
redis_bytes = _get_redis_bytes()


async def init_redis():
    """Инициализация Redis клиентов."""
    global redis, redis_bytes
    redis = _get_redis()
    redis_bytes = _get_redis_bytes()


async def close_redis():
    """Закрывает соединения при завершении приложения."""
    if _redis:
        await _redis.close()
    if _redis_bytes:
        await _redis_bytes.close()
