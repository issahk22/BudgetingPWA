import os

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(_BACKEND_DIR, 'live.db')}"
