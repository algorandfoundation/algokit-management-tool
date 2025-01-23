import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path


class LoggerFactory:
    _initialized = False
    _log_dir = Path("logs")
    _formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    @classmethod
    def _initialize(cls) -> None:
        """Initialize logging directory and configuration once"""
        if not cls._initialized:
            cls._log_dir.mkdir(exist_ok=True)
            cls._initialized = True

    @classmethod
    def get_logger(
        cls,
        name: str,
        log_level: int = logging.INFO,
        file_logging: bool = True,
        console_logging: bool = True,
        max_bytes: int = 10485760,  # 10MB
        backup_count: int = 5,
    ) -> logging.Logger:
        """
        Create a logger with the specified configuration.

        Args:
            name: Name of the logger (typically __name__ of the module)
            log_level: Logging level (default: INFO)
            file_logging: Enable logging to file (default: True)
            console_logging: Enable logging to console (default: True)
            max_bytes: Maximum size of log file before rotation
            backup_count: Number of backup files to keep
        """
        cls._initialize()

        logger = logging.getLogger(name)
        logger.setLevel(log_level)

        # Prevent adding handlers multiple times
        if logger.hasHandlers():
            logger.handlers.clear()

        if console_logging:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setFormatter(cls._formatter)
            logger.addHandler(console_handler)

        if file_logging:
            file_handler = RotatingFileHandler(
                cls._log_dir / f"{name.split('.')[-1]}.log",
                maxBytes=max_bytes,
                backupCount=backup_count,
            )
            file_handler.setFormatter(cls._formatter)
            logger.addHandler(file_handler)

        logger.propagate = False
        return logger


# Optional: Create a default logger for backward compatibility
logger = LoggerFactory.get_logger("default")
