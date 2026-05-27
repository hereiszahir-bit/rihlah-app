import UIKit
import Capacitor
import FirebaseCore
import GoogleSignIn
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    let googleSignInHandler = GoogleSignInHandler()

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }

        // Register the WKScriptMessageHandler after the webview is set up
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.registerMessageHandler()
        }

        return true
    }

    private func registerMessageHandler() {
        guard let rootVC = window?.rootViewController else { return }
        // Find the WKWebView in the view hierarchy
        if let webView = findWebView(in: rootVC.view) {
            webView.configuration.userContentController.add(googleSignInHandler, name: "googleSignIn")
            webView.scrollView.bounces = false
            webView.backgroundColor = .white
            self.window?.backgroundColor = .white
        }
    }

    private func findWebView(in view: UIView) -> WKWebView? {
        if let webView = view as? WKWebView {
            return webView
        }
        for subview in view.subviews {
            if let webView = findWebView(in: subview) {
                return webView
            }
        }
        return nil
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        if GIDSignIn.sharedInstance.handle(url) {
            return true
        }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        if let url = userActivity.webpageURL {
            return ApplicationDelegateProxy.shared.application(application, open: url, options: [:])
        }
        return false
    }
}
