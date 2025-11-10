import asyncio
from concurrent.futures import ProcessPoolExecutor
from functools import partial
from typing import Any, Callable


executor = ProcessPoolExecutor(max_workers=2)
semaphore = asyncio.Semaphore(value=1)


async def run_cpu_bounds_task(
        func: Callable[..., Any], *args, **kwargs) -> Any:
    async with semaphore:
        loop = asyncio.get_running_loop()
        try:
            if args or kwargs:
                func_with_args = partial(func, *args, **kwargs)
                result = await loop.run_in_executor(executor, func_with_args)
            else:
                result = await loop.run_in_executor(executor, func)
            return result
        except Exception:
            raise


def shutdown_executor() -> None:
    executor.shutdown(wait=True, cancel_futures=True)


try:
    import atexit
    atexit.register(shutdown_executor)
except Exception:
    pass
