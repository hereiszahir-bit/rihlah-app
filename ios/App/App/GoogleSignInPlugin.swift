import UIKit
import WebKit
import GoogleSignIn
import FirebaseCore

class GoogleSignInHandler: NSObject, WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "googleSignIn" else { return }

        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootVC = windowScene.windows.first(where: { $0.isKeyWindow })?.rootViewController else {
            callbackToJS(message: message, result: nil, error: "No root view controller")
            return
        }

        GIDSignIn.sharedInstance.signIn(withPresenting: rootVC) { [weak self] result, error in
            if let error = error {
                self?.callbackToJS(message: message, result: nil, error: error.localizedDescription)
                return
            }

            guard let user = result?.user,
                  let idToken = user.idToken?.tokenString else {
                self?.callbackToJS(message: message, result: nil, error: "No ID token")
                return
            }

            self?.callbackToJS(message: message, result: idToken, error: nil)
        }
    }

    private func callbackToJS(message: WKScriptMessage, result: String?, error: String?) {
        DispatchQueue.main.async {
            let webView = message.webView
            if let error = error {
                let js = "window._googleSignInReject && window._googleSignInReject(new Error('\(error.replacingOccurrences(of: "'", with: "\\'"))'))"
                webView?.evaluateJavaScript(js, completionHandler: nil)
            } else if let result = result {
                let js = "window._googleSignInResolve && window._googleSignInResolve('\(result)')"
                webView?.evaluateJavaScript(js, completionHandler: nil)
            }
        }
    }
}
