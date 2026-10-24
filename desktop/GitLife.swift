import AppKit
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var backend: Process?
    private var output: Pipe?
    private var log: FileHandle?
    private var startupOutput = ""
    private var origin: URL?
    private var quitting = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        makeMenu()
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1280, height: 840),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered, defer: false)
        window.title = "GitLife"
        window.minSize = NSSize(width: 720, height: 560)
        window.backgroundColor = NSColor(red: 1, green: 0.988, blue: 0.953, alpha: 1)
        window.appearance = NSAppearance(named: .aqua)
        window.titlebarAppearsTransparent = true
        window.isReleasedWhenClosed = false
        window.setFrameAutosaveName("GitLifeWindow")
        window.center()
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        webView = WKWebView(frame: window.contentView!.bounds, configuration: configuration)
        webView.autoresizingMask = [.width, .height]
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.underPageBackgroundColor = window.backgroundColor
        window.contentView = webView
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        startBackend()
    }

    private func makeMenu() {
        let menu = NSMenu()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About GitLife", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Hide GitLife", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Quit GitLife", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        let appItem = NSMenuItem()
        appItem.submenu = appMenu
        menu.addItem(appItem)
        let editMenu = NSMenu(title: "Edit")
        for (title, action, key) in [("Undo", "undo:", "z"), ("Cut", "cut:", "x"),
                                     ("Copy", "copy:", "c"), ("Paste", "paste:", "v"), ("Select All", "selectAll:", "a")] {
            editMenu.addItem(withTitle: title, action: Selector(action), keyEquivalent: key)
        }
        let editItem = NSMenuItem(title: "Edit", action: nil, keyEquivalent: "")
        editItem.submenu = editMenu
        menu.addItem(editItem)
        let viewMenu = NSMenu(title: "View")
        for (title, action, key) in [("Back", "goBack:", "["), ("Forward", "goForward:", "]"),
                                     ("Reload", "reload:", "r")] {
            let item = viewMenu.addItem(withTitle: title, action: Selector(action), keyEquivalent: key)
            item.target = self
        }
        let viewItem = NSMenuItem(title: "View", action: nil, keyEquivalent: "")
        viewItem.submenu = viewMenu
        menu.addItem(viewItem)
        let windowMenu = NSMenu(title: "Window")
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "Close Window", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        let windowItem = NSMenuItem(title: "Window", action: nil, keyEquivalent: "")
        windowItem.submenu = windowMenu
        menu.addItem(windowItem)
        NSApp.mainMenu = menu
        NSApp.windowsMenu = windowMenu
    }

    @objc private func goBack(_ sender: Any?) { webView.goBack() }
    @objc private func goForward(_ sender: Any?) { webView.goForward() }
    @objc private func reload(_ sender: Any?) { webView.reload() }

    private func startBackend() {
        do {
            let resources = Bundle.main.resourceURL!
            let data = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Application Support/GitLife")
            try FileManager.default.createDirectory(at: data, withIntermediateDirectories: true,
                                                     attributes: [.posixPermissions: 0o700])
            let logURL = data.appendingPathComponent("desktop.log")
            if !FileManager.default.fileExists(atPath: logURL.path) {
                FileManager.default.createFile(atPath: logURL.path, contents: nil, attributes: [.posixPermissions: 0o600])
            }
            log = try FileHandle(forWritingTo: logURL)
            try log?.seekToEnd()
            let process = Process()
            process.executableURL = URL(fileURLWithPath: Bundle.main.object(forInfoDictionaryKey: "GitLifePython") as! String)
            process.arguments = [resources.appendingPathComponent("server.py").path,
                                 "--parent-pid", String(ProcessInfo.processInfo.processIdentifier)]
            var environment = ProcessInfo.processInfo.environment
            environment["PYTHONUNBUFFERED"] = "1"
            environment["PYTHONDONTWRITEBYTECODE"] = "1"
            process.environment = environment
            let pipe = Pipe()
            process.standardOutput = pipe
            process.standardError = log
            output = pipe
            backend = process
            pipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
                let bytes = handle.availableData
                guard !bytes.isEmpty else { return }
                DispatchQueue.main.async {
                    self?.readStartup(String(decoding: bytes, as: UTF8.self))
                }
            }
            process.terminationHandler = { [weak self] _ in
                DispatchQueue.main.async {
                    guard let self = self, !self.quitting else { return }
                    self.fail("The local server stopped. Reopen GitLife; port 47831 must be available. Details are in ~/Library/Application Support/GitLife/desktop.log.")
                }
            }
            try process.run()
            DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in
                guard let self = self, self.origin == nil, !self.quitting else { return }
                self.fail("The local server did not start. Check ~/Library/Application Support/GitLife/desktop.log.")
            }
        } catch {
            fail("Could not start GitLife: \(error.localizedDescription)")
        }
    }

    private func readStartup(_ text: String) {
        guard origin == nil else { return }
        startupOutput += text
        for line in startupOutput.components(separatedBy: "\n").dropLast() {
            let prefix = "GitLife is running at "
            guard line.hasPrefix(prefix), let url = URL(string: String(line.dropFirst(prefix.count))),
                  url.scheme == "http", url.host == "127.0.0.1", url.port != nil else { continue }
            origin = url
            output?.fileHandleForReading.readabilityHandler = nil
            webView.load(URLRequest(url: url))
            return
        }
    }

    private func fail(_ message: String) {
        guard !quitting else { return }
        quitting = true
        let alert = NSAlert()
        alert.messageText = "GitLife couldn’t open"
        alert.informativeText = message
        alert.runModal()
        NSApp.terminate(nil)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        let local = url.scheme == origin?.scheme && url.host == origin?.host && url.port == origin?.port
        if local && navigationAction.shouldPerformDownload {
            decisionHandler(.download)
        } else if local && navigationAction.targetFrame != nil {
            decisionHandler(.allow)
        } else {
            if local || ["https", "http", "mailto"].contains(url.scheme ?? "") {
                NSWorkspace.shared.open(url)
            }
            decisionHandler(.cancel)
        }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        return nil
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = "GitLife"
        alert.informativeText = message
        alert.beginSheetModal(for: window) { _ in completionHandler() }
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert()
        alert.messageText = "GitLife"
        alert.informativeText = message
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Cancel")
        completionHandler(alert.runModal() == .alertFirstButtonReturn)
    }

    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = parameters.allowsMultipleSelection
        panel.canChooseDirectories = false
        panel.beginSheetModal(for: window) { result in
            completionHandler(result == .OK ? panel.urls : nil)
        }
    }

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
        download.delegate = self
    }

    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
        download.delegate = self
    }

    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                  suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = suggestedFilename
        panel.beginSheetModal(for: window) { result in
            guard result == .OK, let destination = panel.url else { completionHandler(nil); return }
            // WebKit requires a new file; keep existing files intact and let the user choose another name.
            guard !FileManager.default.fileExists(atPath: destination.path) else {
                let alert = NSAlert()
                alert.messageText = "Choose a new filename"
                alert.informativeText = "A file already exists there. Download again with a different name."
                alert.runModal()
                completionHandler(nil)
                return
            }
            completionHandler(destination)
        }
    }

    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        let alert = NSAlert()
        alert.messageText = "Download failed"
        alert.informativeText = error.localizedDescription
        alert.beginSheetModal(for: window)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func applicationWillTerminate(_ notification: Notification) {
        quitting = true
        output?.fileHandleForReading.readabilityHandler = nil
        if let process = backend, process.isRunning { process.terminate() }
        try? log?.close()
    }
}

let application = NSApplication.shared
let delegate = AppDelegate()
application.setActivationPolicy(.regular)
application.delegate = delegate
application.run()
