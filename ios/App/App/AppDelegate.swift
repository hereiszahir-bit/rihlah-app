import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.configureWebView()
        }
        return true
    }

    private func configureWebView() {
        guard let rootVC = window?.rootViewController else { return }
        if let webView = findWebView(in: rootVC.view) {
            webView.scrollView.bounces = false
            webView.backgroundColor = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1) // #0a0a0a
            self.window?.backgroundColor = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1)
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
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        if let url = userActivity.webpageURL {
            return ApplicationDelegateProxy.shared.application(application, open: url, options: [:])
        }
        return false
    }
}
