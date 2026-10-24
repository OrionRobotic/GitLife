"""Fusion script: create/reuse the "GitLife" project in the active hub and
upload every cad/*.step design into it (files already there are skipped).

Run from Fusion: Utilities > Scripts and Add-Ins (Shift+S) > GitLife > Run.
"""

import glob
import os
import time

import adsk.core

PROJECT = "GitLife"
# Script lives in <repo>/cad/fusion/GitLife/ (linked into Fusion's Scripts folder).
CAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.realpath(__file__)), "..", "..")
)


def run(context):
    app = adsk.core.Application.get()
    ui = app.userInterface
    try:
        hub = app.data.activeHub
        project = next(
            (p for p in hub.dataProjects if p.name == PROJECT), None
        ) or hub.dataProjects.add(PROJECT)
        folder = project.rootFolder

        existing = {f.name for f in folder.dataFiles}
        steps = sorted(glob.glob(os.path.join(CAD_DIR, "*.step")))
        todo = [
            p for p in steps
            if os.path.splitext(os.path.basename(p))[0] not in existing
        ]

        futures = [(p, folder.uploadFile(p)) for p in todo]
        # ponytail: simple poll with a 5 min cap; uploads keep going in Fusion if it times out.
        deadline = time.time() + 300
        while time.time() < deadline and any(
            f.uploadState == adsk.core.UploadStates.UploadProcessing
            for _, f in futures
        ):
            adsk.doEvents()
            time.sleep(0.5)

        failed = [
            os.path.basename(p)
            for p, f in futures
            if f.uploadState == adsk.core.UploadStates.UploadFailed
        ]
        uploaded = [os.path.basename(p) for p in todo if os.path.basename(p) not in failed]
        ui.messageBox(
            f"Project: {PROJECT} (hub: {hub.name})\n"
            f"Uploaded: {', '.join(uploaded) or 'none'}\n"
            f"Already there: {len(steps) - len(todo)}\n"
            + (f"Failed: {', '.join(failed)}" if failed else "")
        )
    except Exception as e:  # surface errors in Fusion instead of failing silently
        ui.messageBox(f"GitLife upload failed:\n{e}")
