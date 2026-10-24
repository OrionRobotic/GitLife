"""Serve the bundled GitLife SPA on a stable, loopback-only origin."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import threading
from urllib.parse import unquote, urlsplit


PORT = 47831  # Keep WebKit's login and dashboard storage on the same origin.


class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        if self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}":
            self.send_error(403)
            return None
        path = Path(self.translate_path(self.path))
        root = Path(self.directory).resolve()
        if not path.resolve().is_relative_to(root):
            self.send_error(403)
            return None
        if path.is_dir():
            if unquote(urlsplit(self.path).path) != "/":
                self.send_error(404)
                return None
            self.path = "/index.html"
        elif not path.exists() and "." not in Path(urlsplit(self.path).path).name:
            self.path = "/index.html"
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--parent-pid", type=int, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent / "web"
    if not (root / "index.html").is_file():
        parser.error("Bundled web/index.html is missing. Rebuild GitLife.app.")
    with ThreadingHTTPServer(("127.0.0.1", PORT), partial(Handler, directory=str(root))) as server:
        def watch_parent():
            while os.getppid() == args.parent_pid:
                threading.Event().wait(1)
            server.shutdown()

        threading.Thread(target=watch_parent, daemon=True).start()
        print(f"GitLife is running at http://127.0.0.1:{PORT}", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
