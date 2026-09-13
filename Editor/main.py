import os
import sys


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    index = os.path.join(here, "index.html")

    if not os.path.isfile(index):
        sys.stderr.write("Editor page not found: %s\n" % index)
        sys.exit(1)

    try:
        from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEngineSettings
        from PyQt5.QtCore import QUrl
        from PyQt5.QtWidgets import QApplication
    except ImportError as exc:
        sys.stderr.write(
            "Missing PyQt5 / PyQtWebEngine (%s).\n"
            "Install with:  pip install PyQt5 PyQtWebEngine\n" % exc
        )
        sys.exit(1)

    app = QApplication(sys.argv)
    app.setApplicationName("Random Thoughts Studio")

    settings = QWebEngineSettings.globalSettings()
    settings.setAttribute(QWebEngineSettings.JavascriptEnabled, True)
    settings.setAttribute(QWebEngineSettings.LocalStorageEnabled, True)
    settings.setAttribute(QWebEngineSettings.JavascriptCanOpenWindows, True)

    win = QWebEngineView()
    win.setWindowTitle("Random Thoughts — Test Editor")
    win.resize(1280, 860)
    win.load(QUrl.fromLocalFile(index))
    win.show()

    sys.exit(app.exec_())


if __name__ == "__main__":
    main()