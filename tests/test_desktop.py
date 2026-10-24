from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from desktop.server import Handler


class DesktopServerTests(unittest.TestCase):
    def test_spa_routes_assets_and_boundary(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "web"
            root.mkdir()
            (root / "index.html").write_text("<h1>GitLife</h1>")
            (root / "app.js").write_text("console.log('GitLife')")
            (root / "assets").mkdir()
            secret = Path(temporary) / "private.txt"
            secret.write_text("not bundled")
            (root / "linked.txt").symlink_to(secret)
            server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=str(root)))
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            origin = f"http://127.0.0.1:{server.server_port}"
            try:
                for route in ("/", "/login", "/blogs/example?edit=1", "/account"):
                    with urlopen(origin + route) as response:
                        self.assertEqual(response.read(), b"<h1>GitLife</h1>")
                        self.assertEqual(response.headers["Cache-Control"], "no-store")
                with urlopen(origin + "/app.js") as response:
                    self.assertIn(b"console.log", response.read())
                    self.assertIn("javascript", response.headers["Content-Type"])
                for route, status in (("/missing.js", 404), ("/assets/", 404), ("/linked.txt", 403)):
                    with self.assertRaises(HTTPError) as error:
                        urlopen(origin + route)
                    self.assertEqual(error.exception.code, status)
                request = Request(origin, headers={"Host": "untrusted.example"})
                with self.assertRaises(HTTPError) as error:
                    urlopen(request)
                self.assertEqual(error.exception.code, 403)
            finally:
                server.shutdown()
                server.server_close()
                thread.join()


if __name__ == "__main__":
    unittest.main()
