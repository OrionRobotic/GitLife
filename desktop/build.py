"""Build GitLife.app; --install also installs it in /Applications."""

import argparse
from pathlib import Path
import platform
import plistlib
import shutil
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--install", action="store_true")
    args = parser.parse_args()
    if sys.platform != "darwin":
        parser.error("Building the desktop app requires macOS and Xcode command-line tools.")
    subprocess.run(["npm", "run", "build"], cwd=ROOT, check=True)
    build = ROOT / "build"
    bundle = build / "GitLife.app"
    if bundle.exists():
        shutil.rmtree(bundle)
    macos = bundle / "Contents/MacOS"
    resources = bundle / "Contents/Resources"
    macos.mkdir(parents=True)
    resources.mkdir(parents=True)
    info = {
        "CFBundleName": "GitLife", "CFBundleDisplayName": "GitLife",
        "CFBundleIdentifier": "com.lorenzomagnino.gitlife", "CFBundleExecutable": "GitLife",
        "CFBundlePackageType": "APPL", "CFBundleShortVersionString": "0.1.0", "CFBundleVersion": "1",
        "CFBundleIconFile": "GitLife.icns", "LSMinimumSystemVersion": "12.0",
        "NSHighResolutionCapable": True, "NSPrincipalClass": "NSApplication",
        "NSAppTransportSecurity": {"NSAllowsLocalNetworking": True},
        "GitLifePython": str(Path(sys.executable).resolve()),
    }
    with (bundle / "Contents/Info.plist").open("wb") as output:
        plistlib.dump(info, output)
    shutil.copy2(ROOT / "desktop/server.py", resources)
    shutil.copytree(ROOT / "dist", resources / "web")
    subprocess.run(["xcrun", "swiftc", "-O", "-target", platform.machine() + "-apple-macosx12.0",
                    "-framework", "AppKit", "-framework", "WebKit", str(ROOT / "desktop/GitLife.swift"),
                    "-o", str(macos / "GitLife")], check=True)
    iconset = build / "GitLife.iconset"
    iconset.mkdir(exist_ok=True)
    for size in (16, 32, 128, 256, 512):
        for scale in (1, 2):
            name = f"icon_{size}x{size}" + ("@2x" if scale == 2 else "") + ".png"
            subprocess.run(["sips", "-z", str(size * scale), str(size * scale),
                            str(ROOT / "desktop/icon.png"), "--out", str(iconset / name)],
                           check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["iconutil", "-c", "icns", str(iconset), "-o", str(resources / "GitLife.icns")], check=True)
    subprocess.run(["codesign", "--force", "--sign", "-", str(bundle)], check=True)
    print(f"Built {bundle}")
    if args.install:
        destination = Path("/Applications/GitLife.app")
        if destination.exists():
            with (destination / "Contents/Info.plist").open("rb") as previous:
                if plistlib.load(previous).get("CFBundleIdentifier") != info["CFBundleIdentifier"]:
                    raise SystemExit("Another application already uses /Applications/GitLife.app.")
            backup = build / "previous-GitLife.app"
            if backup.exists():
                shutil.rmtree(backup)
            destination.rename(backup)
        shutil.copytree(bundle, destination)
        print(f"Installed {destination}")


if __name__ == "__main__":
    main()
