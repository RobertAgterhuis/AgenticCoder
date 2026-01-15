from typing import Callable, cast

from .server import main as _main  # pyright: ignore[reportUnknownVariableType]


main: Callable[..., None] = cast(Callable[..., None], _main)

if __name__ == "__main__":
    main()
