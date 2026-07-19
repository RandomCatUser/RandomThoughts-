#!/usr/bin/env python3
"""
Editorial Blog Builder
-----------------------
A PyQt5 desktop app for building an editorial-style blog post by dragging
blocks from a palette onto a live HTML canvas (using QWebEngineView).
Blocks are edited in place directly within the live website preview.

Run:
    python3 blog_builder.py

Requires:
    pip install PyQt5 PyQtWebEngine
"""

import sys
import os
import re
import json
import html as html_lib
import tempfile
import webbrowser
import base64
import mimetypes
from html.parser import HTMLParser

from PyQt5.QtCore import (
    Qt, QMimeData, QSize, QUrl, QPoint, QRect, QRectF, QTimer, QPointF, QObject, pyqtSlot
)
from PyQt5.QtGui import (
    QDrag, QIcon, QPixmap, QPainter, QColor, QPen, QFont, QPolygonF, QPainterPath
)
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QListWidget, QListWidgetItem, QAbstractItemView, QLabel, QLineEdit,
    QTextEdit, QToolButton, QFrame, QFileDialog, QMessageBox, QToolBar,
    QAction, QScrollArea, QDialog, QGridLayout, QSizePolicy, QPushButton, QSplitter,
    QGraphicsDropShadowEffect
)
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEnginePage, QWebEngineSettings
from PyQt5.QtWebChannel import QWebChannel

# ---------------------------------------------------------------------------
# Style constants (Premium Dark Mode)
# ---------------------------------------------------------------------------
UI_BG_COLOR = "#181825"      # Deepest background (Midnight)
UI_PANEL_BG = "#1e1e2e"      # Panel/Card background
UI_TEXT_COLOR = "#cdd6f4"    # High-contrast soft white
UI_MUTED_COLOR = "#6c7086"   # Muted gray text
UI_ACCENT_COLOR = "#a6e3a1"  # Fresh, vibrant green
UI_BORDER_COLOR = "#313244"  # Subtle, cool gray borders

# Light Mode for the HTML Document/Canvas (Paper)
DOC_BG_COLOR = "#f4f2eb"      
DOC_CONTAINER_BG = "#ffffff"  
DOC_TEXT_COLOR = "#1a1a1a"
DOC_BODY_TEXT_COLOR = "#374151"
DOC_MUTED_COLOR = "#8a8a8a"
DOC_ACCENT_COLOR = "#5a6a3b"   # Olive green for doc
DOC_BORDER_COLOR = "#e6e3d8"

SERIF_FONT = "Georgia, 'Playfair Display', serif"
SANS_FONT = "'Segoe UI', Inter, sans-serif"

BLOCK_TYPES = [
    ("category", "Category / Kicker"),
    ("title", "Title (H1)"),
    ("subtitle", "Subtitle"),
    ("date", "Date"),
    ("cover_image", "Cover Image"),
    ("heading", "Section Heading (H2)"),
    ("paragraph", "Paragraph"),
    ("quote", "Pull Quote"),
    ("image", "Inline Image"),
    ("divider", "Divider Line"),
    ("spacer", "Empty Space"),
    ("footer", "Footer Note"),
]
BLOCK_LABELS = dict(BLOCK_TYPES)

MIME_BLOCKTYPE = "application/x-blogbuilder-blocktype"

DEFAULT_CONTENT = {
    "category": "Tech & Culture",
    "title": "Your Article Title Here",
    "subtitle": "A short, italic subtitle that frames the piece.",
    "date": "January 1, 2026",
    "cover_image": "",
    "heading": "A New Section",
    "paragraph": "Write your paragraph here. This is the main body text of the article.",
    "quote": "A striking quote goes here.",
    "image": "",
    "divider": "",
    "spacer": "",
    "footer": "Thanks for reading.",
}

# ---------------------------------------------------------------------------
# Procedurally-drawn icons (Modern Vector Style)
# ---------------------------------------------------------------------------
def make_icon(kind, size=18, color="#cdd6f4"):
    pixmap = QPixmap(size, size)
    pixmap.fill(Qt.transparent)
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.Antialiasing)
    pen = QPen(QColor(color))
    pen.setWidth(max(1, int(size * 0.08)))
    pen.setCapStyle(Qt.RoundCap)
    pen.setJoinStyle(Qt.RoundJoin)
    painter.setPen(pen)
    m = size * 0.16

    # ---- Toolbar / chrome icons -------------------------------------------------
    if kind == "new":
        pen.setWidth(max(1, int(size * 0.09)))
        painter.setPen(pen)
        painter.setBrush(Qt.NoBrush)
        path_rect = QRectF(size * 0.2, size * 0.12, size * 0.5, size * 0.76)
        painter.drawRoundedRect(path_rect, 2, 2)
        painter.drawLine(QPointF(size * 0.45, size * 0.42), QPointF(size * 0.45, size * 0.7))
        painter.drawLine(QPointF(size * 0.31, size * 0.56), QPointF(size * 0.59, size * 0.56))
    elif kind == "import":
        painter.drawLine(QPointF(size * 0.5, m), QPointF(size * 0.5, size * 0.6))
        painter.setBrush(QColor(color))
        painter.setPen(Qt.NoPen)
        painter.drawPolygon(QPolygonF([
            QPointF(size * 0.3, size * 0.46), QPointF(size * 0.7, size * 0.46),
            QPointF(size * 0.5, size * 0.7),
        ]))
        painter.setPen(pen)
        painter.drawLine(QPointF(m, size - m), QPointF(size - m, size - m))
    elif kind == "export":
        painter.drawLine(QPointF(size * 0.5, size * 0.7), QPointF(size * 0.5, size * 0.14))
        painter.setBrush(QColor(color))
        painter.setPen(Qt.NoPen)
        painter.drawPolygon(QPolygonF([
            QPointF(size * 0.3, size * 0.34), QPointF(size * 0.7, size * 0.34),
            QPointF(size * 0.5, size * 0.1),
        ]))
        painter.setPen(pen)
        painter.drawLine(QPointF(m, size - m), QPointF(size - m, size - m))
    elif kind == "preview":
        painter.drawEllipse(QPointF(size / 2, size / 2), size * 0.4, size * 0.26)
        painter.setBrush(QColor(color))
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(QPointF(size / 2, size / 2), size * 0.11, size * 0.11)
    elif kind == "settings":
        center = QPointF(size / 2, size / 2)
        painter.setBrush(QColor(color))
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(center, size * 0.34, size * 0.34)
        for i in range(6):
            painter.save()
            painter.translate(center)
            painter.rotate(i * 60)
            painter.drawRect(QRectF(-size * 0.07, -size * 0.47, size * 0.14, size * 0.14))
            painter.restore()
        painter.setBrush(QColor(UI_PANEL_BG))
        painter.drawEllipse(center, size * 0.15, size * 0.15)
    elif kind == "delete":
        painter.drawLine(QPointF(m, size * 0.3), QPointF(size - m, size * 0.3))
        painter.drawRoundedRect(QRectF(size * 0.27, size * 0.3, size * 0.46, size * 0.56), 2, 2)
        painter.drawLine(QPointF(size * 0.38, m), QPointF(size * 0.62, m))
        painter.drawLine(QPointF(size * 0.4, size * 0.42), QPointF(size * 0.4, size * 0.74))
        painter.drawLine(QPointF(size * 0.6, size * 0.42), QPointF(size * 0.6, size * 0.74))

    # ---- Content-block icons ------------------------------------------------------
    elif kind == "tag":
        painter.setBrush(Qt.NoBrush)
        painter.drawPolygon(QPolygonF([
            QPointF(m * 0.7, size * 0.5), QPointF(size * 0.46, m * 0.8),
            QPointF(size - m * 0.7, m * 0.8), QPointF(size - m * 0.7, size * 0.55),
            QPointF(size * 0.46, size - m * 0.8),
        ]))
        painter.setBrush(QColor(color))
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(QPointF(size * 0.58, size * 0.34), size * 0.06, size * 0.06)
    elif kind == "heading1" or kind == "heading2":
        font = QFont("Georgia", int(size * 0.44))
        font.setBold(True)
        painter.setFont(font)
        painter.setPen(QColor(color))
        label = "H1" if kind == "heading1" else "H2"
        painter.drawText(QRectF(0, 0, size, size), Qt.AlignCenter, label)
    elif kind == "italic_text":
        font = QFont(SERIF_FONT.split(",")[0].strip(" '"), int(size * 0.55))
        font.setItalic(True)
        font.setBold(True)
        painter.setFont(font)
        painter.setPen(QColor(color))
        painter.drawText(QRectF(0, 0, size, size), Qt.AlignCenter, "Aa")
    elif kind == "calendar":
        painter.setBrush(Qt.NoBrush)
        body = QRectF(m, size * 0.26, size - 2 * m, size - size * 0.26 - m * 0.6)
        painter.drawRoundedRect(body, 2, 2)
        painter.drawLine(QPointF(size * 0.3, m * 0.5), QPointF(size * 0.3, size * 0.34))
        painter.drawLine(QPointF(size * 0.7, m * 0.5), QPointF(size * 0.7, size * 0.34))
        painter.drawLine(QPointF(m, size * 0.46), QPointF(size - m, size * 0.46))
        painter.setPen(Qt.NoPen)
        painter.setBrush(QColor(color))
        painter.drawEllipse(QPointF(size * 0.5, size * 0.68), size * 0.08, size * 0.08)
    elif kind == "landscape":
        painter.setBrush(Qt.NoBrush)
        painter.drawRoundedRect(QRectF(m * 0.7, m * 0.7, size - 1.4 * m, size - 1.4 * m), 3, 3)
        painter.setPen(Qt.NoPen)
        painter.setBrush(QColor(color))
        painter.drawEllipse(QPointF(size * 0.35, size * 0.36), size * 0.09, size * 0.09)
        painter.drawPolygon(QPolygonF([
            QPointF(m * 0.7, size - m * 0.9), QPointF(size * 0.4, size * 0.45),
            QPointF(size * 0.6, size * 0.66), QPointF(size * 0.75, size * 0.5),
            QPointF(size - m * 0.7, size - m * 0.9),
        ]))
    elif kind == "photo":
        painter.setBrush(Qt.NoBrush)
        painter.drawRoundedRect(QRectF(m * 0.7, m * 0.7, size - 1.4 * m, size - 1.4 * m), 3, 3)
        painter.setPen(Qt.NoPen)
        painter.setBrush(QColor(color))
        painter.drawEllipse(QPointF(size * 0.64, size * 0.36), size * 0.08, size * 0.08)
        painter.drawPolygon(QPolygonF([
            QPointF(m * 0.7, size - m * 0.9), QPointF(size * 0.42, size * 0.5),
            QPointF(size * 0.58, size * 0.68), QPointF(size - m * 0.7, size * 0.44),
            QPointF(size - m * 0.7, size - m * 0.9),
        ]))
    elif kind == "paragraph_lines":
        painter.setBrush(Qt.NoBrush)
        widths = (0.82, 0.7, 0.78, 0.5)
        for i, w in enumerate(widths):
            y = size * (0.26 + i * 0.18)
            painter.drawLine(QPointF(size * 0.14, y), QPointF(size * (0.14 + w), y))
    elif kind == "quote_mark":
        font = QFont("Georgia", int(size * 0.85))
        font.setBold(True)
        painter.setFont(font)
        painter.setPen(QColor(color))
        painter.drawText(QRectF(0, -size * 0.14, size, size), Qt.AlignCenter, "\u201C")
    elif kind == "footer_note":
        painter.drawLine(QPointF(m, size * 0.36), QPointF(size - m, size * 0.36))
        painter.drawLine(QPointF(m, size * 0.58), QPointF(size * 0.62, size * 0.58))
        painter.setPen(Qt.NoPen)
        painter.setBrush(QColor(color))
        painter.drawEllipse(QPointF(size * 0.78, size * 0.58), size * 0.055, size * 0.055)
    elif kind == "grip":
        for row in (0.28, 0.5, 0.72):
            painter.drawLine(QPointF(size * 0.24, size * row), QPointF(size * 0.76, size * row))
    elif kind == "divider":
        # Dashed line with dots
        painter.setBrush(QColor(color))
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(QPointF(size * 0.2, size * 0.5), size * 0.04, size * 0.04)
        painter.drawEllipse(QPointF(size * 0.8, size * 0.5), size * 0.04, size * 0.04)
        pen.setStyle(Qt.DashLine)
        painter.setPen(pen)
        painter.drawLine(QPointF(size * 0.3, size * 0.5), QPointF(size * 0.7, size * 0.5))
    elif kind == "spacer":
        # Up/down arrows indicating space
        path = QPainterPath()
        path.moveTo(size * 0.5, size * 0.2)
        path.lineTo(size * 0.35, size * 0.35)
        path.lineTo(size * 0.65, size * 0.35)
        path.closeSubpath()
        painter.setBrush(QColor(color))
        painter.drawPath(path)
        
        path2 = QPainterPath()
        path2.moveTo(size * 0.5, size * 0.8)
        path2.lineTo(size * 0.35, size * 0.65)
        path2.lineTo(size * 0.65, size * 0.65)
        path2.closeSubpath()
        painter.drawPath(path2)
        
        pen.setStyle(Qt.DashLine)
        painter.setPen(pen)
        painter.drawLine(QPointF(size * 0.5, size * 0.4), QPointF(size * 0.5, size * 0.6))

    elif kind == "image":
        # Fallback generic image icon
        painter.drawRect(QRectF(m, m, size - 2 * m, size - 2 * m))
        painter.setBrush(QColor(color))
        painter.drawEllipse(QPointF(size * 0.37, size * 0.39), size * 0.07, size * 0.07)
        painter.drawPolygon(QPolygonF([
            QPointF(m, size - m), QPointF(size * 0.45, size * 0.5),
            QPointF(size * 0.65, size * 0.68), QPointF(size * 0.8, size * 0.5),
            QPointF(size - m, size - m),
        ]))

    painter.end()
    return QIcon(pixmap)


def icon_button(kind, tooltip, size=22, color="#cdd6f4"):
    btn = QToolButton()
    btn.setIcon(make_icon(kind, size=18, color=color))
    btn.setIconSize(QSize(16, 16))
    btn.setToolTip(tooltip)
    btn.setCursor(Qt.PointingHandCursor)
    btn.setAutoRaise(True)
    btn.setFixedSize(size, size)
    btn.setStyleSheet(f"""
        QToolButton {{ border: none; border-radius: 6px; background: transparent; }}
        QToolButton:hover {{ background: {UI_BORDER_COLOR}; }}
    """)
    return btn


def soft_shadow(blur=24, y_offset=6, alpha=100):
    """Returns a subtle drop-shadow effect used to lift cards/panels off the page."""
    effect = QGraphicsDropShadowEffect()
    effect.setBlurRadius(blur)
    effect.setOffset(0, y_offset)
    effect.setColor(QColor(0, 0, 0, alpha))
    return effect


def make_app_icon():
    pixmap = QPixmap(64, 64)
    pixmap.fill(Qt.transparent)
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.Antialiasing)
    painter.setBrush(QColor(UI_PANEL_BG))
    painter.setPen(QPen(QColor(UI_ACCENT_COLOR), 3))
    painter.drawRoundedRect(4, 4, 56, 56, 12, 12)
    painter.setPen(QPen(QColor(UI_TEXT_COLOR), 3))
    painter.drawLine(QPointF(16, 22), QPointF(48, 22))
    painter.setPen(QPen(QColor(UI_ACCENT_COLOR), 3))
    painter.drawLine(QPointF(16, 34), QPointF(40, 34))
    painter.drawLine(QPointF(16, 44), QPointF(34, 44))
    painter.end()
    return QIcon(pixmap)


# ---------------------------------------------------------------------------
# Custom Widget for Palette Items (Cute Draggable Cards)
# ---------------------------------------------------------------------------
class PaletteItemWidget(QWidget):
    def __init__(self, icon, text, parent=None, chip_color="#2d3b26"):
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 8, 14, 8)
        layout.setSpacing(12)

        chip = QLabel()
        chip.setFixedSize(34, 34)
        chip.setAlignment(Qt.AlignCenter)
        chip.setStyleSheet(f"""
            background: {chip_color};
            border-radius: 9px;
            border: none;
        """)
        icon_lbl = QLabel(chip)
        icon_lbl.setPixmap(icon.pixmap(20, 20))
        icon_lbl.setGeometry(7, 7, 20, 20)
        icon_lbl.setStyleSheet("background: transparent; border: none;")

        lbl_text = QLabel(text)
        lbl_text.setStyleSheet("background: transparent; border: none; font-size: 13px; font-weight: 600; color: #cdd6f4;")

        grip = QLabel("⋮⋮")
        grip.setStyleSheet("color: #45475a; font-weight: bold; font-size: 12px; background: transparent; border: none;")

        layout.addWidget(chip)
        layout.addWidget(lbl_text)
        layout.addStretch()
        layout.addWidget(grip)


# ---------------------------------------------------------------------------
# Image Edit Dialog
# ---------------------------------------------------------------------------
class ImageDialog(QDialog):
    def __init__(self, current_path="", parent=None):
        super().__init__(parent)
        self.setWindowTitle("Image Settings")
        self.setMinimumWidth(450)
        self.setStyleSheet(f"background: {UI_PANEL_BG}; color: {UI_TEXT_COLOR}; font-family: {SANS_FONT};")

        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(12)

        lbl = QLabel("Image URL or Local Path")
        lbl.setStyleSheet("font-size: 14px; font-weight: bold; color: #fff;")
        layout.addWidget(lbl)

        self.path_edit = QLineEdit(current_path)
        self.path_edit.setPlaceholderText("e.g., https://example.com/image.jpg or C:/images/pic.png")
        self.path_edit.setStyleSheet(f"padding: 10px; border: 1px solid {UI_BORDER_COLOR}; border-radius: 8px; background: {UI_BG_COLOR}; color: {UI_TEXT_COLOR}; font-size: 13px;")
        layout.addWidget(self.path_edit)

        btn_row = QHBoxLayout()
        btn_row.setSpacing(10)
        browse_btn = QPushButton("  Browse Local File...")
        browse_btn.setCursor(Qt.PointingHandCursor)
        browse_btn.setStyleSheet(f"""
            QPushButton {{ background: {UI_ACCENT_COLOR}; color: #1a1a1a; border: none; 
                           padding: 10px 16px; border-radius: 8px; font-weight: bold; font-size: 13px; }}
            QPushButton:hover {{ background: #b4ebaf; }}
        """)
        browse_btn.clicked.connect(self._browse)
        btn_row.addWidget(browse_btn)
        btn_row.addStretch()
        layout.addLayout(btn_row)

        ok_btn = QPushButton("Apply Image")
        ok_btn.setCursor(Qt.PointingHandCursor)
        ok_btn.setStyleSheet(f"""
            QPushButton {{ background: {UI_BG_COLOR}; color: {UI_TEXT_COLOR}; border: 1px solid {UI_BORDER_COLOR}; 
                           padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; }}
            QPushButton:hover {{ background: #313244; }}
        """)
        ok_btn.clicked.connect(self.accept)
        layout.addWidget(ok_btn, alignment=Qt.AlignRight)

    def _browse(self):
        path, _ = QFileDialog.getOpenFileName(
            self, "Choose image", "", "Images (*.png *.jpg *.jpeg *.gif *.webp)")
        if path:
            self.path_edit.setText(path)

    def get_path(self):
        return self.path_edit.text().strip()


# ---------------------------------------------------------------------------
# Palette (source list of draggable block types)
# ---------------------------------------------------------------------------
class PaletteList(QListWidget):
    ICON_FOR_TYPE = {
        "category": "tag", "title": "heading1", "subtitle": "italic_text", "date": "calendar",
        "cover_image": "landscape", "heading": "heading2", "paragraph": "paragraph_lines",
        "quote": "quote_mark", "image": "photo", "footer": "footer_note",
        "divider": "divider", "spacer": "spacer",
    }
    COLOR_FOR_TYPE = {
        "category": "#9dc78c", "title": "#9dc78c", "subtitle": "#9dc78c", "date": "#9dc78c",
        "cover_image": "#7ab4c4", "image": "#7ab4c4",
        "heading": "#d8a05a", "paragraph": "#d8a05a", "quote": "#d8a05a",
        "footer": "#a1a1aa", "divider": "#a1a1aa", "spacer": "#a1a1aa",
    }
    CHIP_FOR_TYPE = {
        "category": "#2d3b26", "title": "#2d3b26", "subtitle": "#2d3b26", "date": "#2d3b26",
        "cover_image": "#1e353d", "image": "#1e353d",
        "heading": "#3b2f1c", "paragraph": "#3b2f1c", "quote": "#3b2f1c",
        "footer": "#33333d", "divider": "#33333d", "spacer": "#33333d",
    }

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setDragEnabled(True)
        self.setDragDropMode(QAbstractItemView.DragOnly)
        self.setSelectionMode(QAbstractItemView.SingleSelection)
        self.setIconSize(QSize(18, 18))
        
        for key, label in BLOCK_TYPES:
            item = QListWidgetItem()
            item.setData(Qt.UserRole, key)
            color = self.COLOR_FOR_TYPE.get(key, UI_ACCENT_COLOR)
            chip = self.CHIP_FOR_TYPE.get(key, "#33333d")
            icon = make_icon(self.ICON_FOR_TYPE.get(key, "new"), size=20, color=color)
            widget = PaletteItemWidget(icon, label, chip_color=chip)
            item.setSizeHint(widget.sizeHint())
            self.addItem(item)
            self.setItemWidget(item, widget)

        self.setStyleSheet(f"""
            QListWidget {{
                background: transparent; border: none; padding: 0; outline: none;
            }}
            QListWidget::item {{
                background: {UI_PANEL_BG}; border: 1px solid transparent;
                border-radius: 10px; margin: 4px 0px;
            }}
            QListWidget::item:hover {{
                background: #262637; border: 1px solid {UI_BORDER_COLOR};
            }}
            QListWidget::item:selected {{
                background: #262637; border: 1px solid {UI_ACCENT_COLOR};
            }}
            /* Custom Scrollbars */
            QScrollBar:vertical {{ border: none; background: transparent; width: 8px; margin: 0; }}
            QScrollBar::handle:vertical {{ background: {UI_BORDER_COLOR}; border-radius: 4px; min-height: 30px; }}
            QScrollBar::handle:vertical:hover {{ background: #45475a; }}
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0; }}
            QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical {{ background: transparent; }}
        """)

    def startDrag(self, supportedActions):
        item = self.currentItem()
        if item is None:
            return
        key = item.data(Qt.UserRole)
        mime = QMimeData()
        mime.setData(MIME_BLOCKTYPE, key.encode("utf-8"))
        mime.setText(key)
        drag = QDrag(self)
        drag.setMimeData(mime)
        widget = self.itemWidget(item)
        if widget:
            drag.setPixmap(widget.grab())
            drag.setHotSpot(QPoint(20, 20))
        drag.exec_(Qt.CopyAction)


# ---------------------------------------------------------------------------
# Backend Object for JS <-> Python Communication
# ---------------------------------------------------------------------------
class EditorBackend(QObject):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.app = parent

    @pyqtSlot(str, str)
    def update_block_content(self, block_id, text):
        index = int(block_id)
        if 0 <= index < len(self.app.blocks):
            self.app.blocks[index]["content"] = text

    @pyqtSlot(str, str, str)
    def reorder_blocks(self, src_id, dest_id, position):
        src = int(src_id)
        dest = int(dest_id)
        if not (0 <= src < len(self.app.blocks)) or src == dest:
            return
        block = self.app.blocks.pop(src)
        if src < dest:
            dest -= 1
        if position == "after":
            dest += 1
        dest = max(0, min(dest, len(self.app.blocks)))
        self.app.blocks.insert(dest, block)
        self.app._render_canvas()

    @pyqtSlot(str)
    def delete_block(self, block_id):
        index = int(block_id)
        if 0 <= index < len(self.app.blocks):
            del self.app.blocks[index]
            self.app._render_canvas()

    @pyqtSlot(str)
    def edit_image(self, block_id):
        index = int(block_id)
        if 0 <= index < len(self.app.blocks):
            current_path = self.app.blocks[index]["content"]
            dialog = ImageDialog(current_path, self.app)
            if dialog.exec_():
                new_path = dialog.get_path()
                self.app.blocks[index]["content"] = new_path
                self.app._render_canvas()


# ---------------------------------------------------------------------------
# Web Engine View acting as the live canvas
# ---------------------------------------------------------------------------
class CanvasWebEngineView(QWebEngineView):
    def __init__(self, add_block_callback, parent=None):
        super().__init__(parent)
        self.add_block_callback = add_block_callback
        self.setAcceptDrops(True)
        self.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        
        self.page().settings().setAttribute(QWebEngineSettings.LocalContentCanAccessFileUrls, True)
        self.page().settings().setAttribute(QWebEngineSettings.LocalContentCanAccessRemoteUrls, True)

        self.channel = QWebChannel()
        self.backend = EditorBackend(parent)
        self.channel.registerObject('backend', self.backend)
        self.page().setWebChannel(self.channel)

    def dragEnterEvent(self, event):
        if event.mimeData().hasFormat(MIME_BLOCKTYPE):
            event.acceptProposedAction()
        else:
            super().dragEnterEvent(event)

    def dragMoveEvent(self, event):
        if event.mimeData().hasFormat(MIME_BLOCKTYPE):
            event.acceptProposedAction()
        else:
            super().dragMoveEvent(event)

    def dropEvent(self, event):
        if event.mimeData().hasFormat(MIME_BLOCKTYPE):
            event.acceptProposedAction()
            pos = event.pos()
            block_type = bytes(event.mimeData().data(MIME_BLOCKTYPE)).decode("utf-8")
            
            js = f"""
            (function() {{
                var el = document.elementFromPoint({pos.x()}, {pos.y()});
                if (el) {{
                    var wrapper = el.closest('.block-wrapper');
                    if (wrapper) {{
                        var rect = wrapper.getBoundingClientRect();
                        var mid = rect.top + rect.height / 2;
                        return JSON.stringify({{ id: wrapper.dataset.blockId, pos: {pos.y()} < mid ? 'before' : 'after' }});
                    }}
                }}
                return JSON.stringify({{ id: '-1', pos: 'after' }});
            }})();
            """
            def callback(result):
                data = json.loads(result)
                dest_id = int(data['id']) if data['id'] != '-1' else None
                position = data['pos']
                self.add_block_callback(block_type, dest_id, position)
            
            self.page().runJavaScript(js, callback)
        else:
            super().dropEvent(event)


# ---------------------------------------------------------------------------
# Main window
# ---------------------------------------------------------------------------
class BlogBuilder(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Editorial Blog Builder")
        self.setWindowIcon(make_app_icon())
        self.resize(1440, 900)
        self.setStyleSheet(f"""
            QMainWindow {{
                background: {UI_BG_COLOR};
            }}
        """)

        self.blocks = []
        self._build_ui()
        self._seed_default_post()

    def _build_ui(self):
        toolbar = QToolBar("Main")
        toolbar.setMovable(False)
        toolbar.setIconSize(QSize(20, 20))
        toolbar.setStyleSheet(f"""
            QToolBar {{ 
                background: {UI_PANEL_BG}; 
                border-bottom: 1px solid {UI_BORDER_COLOR}; 
                padding: 12px 18px; spacing: 8px; 
            }}
            QToolButton {{ 
                padding: 8px 14px; border-radius: 8px; 
                color: {UI_TEXT_COLOR}; font-weight: 600; font-size: 13px; 
                background: transparent; border: 1px solid transparent;
            }}
            QToolButton:hover {{ 
                background: #262637; border: 1px solid {UI_BORDER_COLOR}; 
            }}
            QToolButton:pressed {{
                background: {UI_BORDER_COLOR};
            }}
            QToolButton:checked {{ 
                background: {UI_ACCENT_COLOR}; color: #1a1a1a; border: 1px solid #b4ebaf;
            }}
        """)
        self.addToolBar(toolbar)

        brand = QLabel()
        brand_pixmap = make_app_icon().pixmap(28, 28)
        brand.setPixmap(brand_pixmap)
        brand.setStyleSheet("background: transparent; padding: 0 6px 0 2px;")
        toolbar.addWidget(brand)
        brand_text = QLabel("Editorial")
        brand_text.setStyleSheet(f"font-family:{SERIF_FONT}; font-size:18px; font-weight:bold; font-style: italic; color:{UI_TEXT_COLOR}; padding-right: 16px;")
        toolbar.addWidget(brand_text)
        toolbar.addSeparator()

        new_action = QAction(make_icon("new", color=UI_TEXT_COLOR), "  New Post", self)
        new_action.triggered.connect(self.new_post)
        toolbar.addAction(new_action)

        import_action = QAction(make_icon("import", color=UI_TEXT_COLOR), "  Import HTML", self)
        import_action.triggered.connect(self.import_html)
        toolbar.addAction(import_action)

        export_action = QAction(make_icon("export", color=UI_TEXT_COLOR), "  Export HTML", self)
        export_action.triggered.connect(self.export_html)
        toolbar.addAction(export_action)

        toolbar.addSeparator()

        preview_action = QAction(make_icon("preview", color=UI_ACCENT_COLOR), "  Preview in Browser", self)
        preview_action.triggered.connect(self.preview_html)
        toolbar.addAction(preview_action)

        self.settings_action = QAction(make_icon("settings", color=UI_TEXT_COLOR), "  Toggle Settings", self)
        self.settings_action.setCheckable(True)
        self.settings_action.setChecked(True)
        self.settings_action.triggered.connect(self._toggle_settings)
        toolbar.addAction(self.settings_action)

        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QVBoxLayout(central)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        splitter = QSplitter(Qt.Horizontal)
        splitter.setHandleWidth(8)
        splitter.setStyleSheet("""
            QSplitter::handle { background: transparent; }
            QSplitter::handle:hover { background: rgba(166, 227, 161, 0.15); border-radius: 4px; }
        """)

        # Left: palette
        left_panel = QWidget()
        left_panel.setStyleSheet(f"background: {UI_BG_COLOR};")
        left_layout = QVBoxLayout(left_panel)
        left_layout.setContentsMargins(24, 24, 12, 24)
        left_layout.setSpacing(10)
        title_label = QLabel("Content Blocks")
        title_label.setStyleSheet(f"font-family:{SERIF_FONT}; font-size:22px; font-weight:bold; color:{UI_TEXT_COLOR};")
        hint_label = QLabel("Drag elements onto the live canvas.")
        hint_label.setStyleSheet(f"color:{UI_MUTED_COLOR}; font-size:12px;")
        hint_label.setWordWrap(True)
        self.palette = PaletteList()
        left_layout.addWidget(title_label)
        left_layout.addWidget(hint_label)
        left_layout.addWidget(self.palette)
        
        # Middle: canvas area (Live Web Engine)
        mid_panel = QWidget()
        mid_panel.setStyleSheet(f"background: {UI_BG_COLOR};")
        mid_layout = QVBoxLayout(mid_panel)
        mid_layout.setContentsMargins(12, 24, 12, 24)
        mid_layout.setSpacing(8)

        canvas_title = QLabel("Live Article Canvas")
        canvas_title.setStyleSheet(f"font-family:{SERIF_FONT}; font-size:22px; font-weight:bold; color:{UI_TEXT_COLOR};")
        canvas_sub = QLabel("Click text to edit directly. Drag blocks to reorder.")
        canvas_sub.setStyleSheet(f"color:{UI_MUTED_COLOR}; font-size:12px;")
        canvas_sub.setWordWrap(True)
        mid_layout.addWidget(canvas_title)
        mid_layout.addWidget(canvas_sub)

        self.canvas = CanvasWebEngineView(self.add_block, self)
        self.canvas.setStyleSheet(f"""
            QWebEngineView {{
                border: 1px solid {UI_BORDER_COLOR}; 
                border-radius: 12px; 
                background: {DOC_BG_COLOR};
            }}
        """)
        mid_layout.addWidget(self.canvas)

        # Right: metadata sidebar
        self.right_panel = QWidget()
        self.right_panel.setObjectName("RightPanel")
        self.right_panel.setStyleSheet(f"""
            QWidget#RightPanel {{ 
                background: {UI_BG_COLOR}; 
                border-left: 1px solid {UI_BORDER_COLOR}; 
            }}
        """)
        right_layout = QVBoxLayout(self.right_panel)
        right_layout.setContentsMargins(24, 24, 24, 24)
        right_layout.setSpacing(12)
        meta_title = QLabel("Post Settings")
        meta_title.setStyleSheet(f"font-family:{SERIF_FONT}; font-size:22px; font-weight:bold; color:{UI_TEXT_COLOR};")
        right_layout.addWidget(meta_title)

        form = QFrame()
        form.setObjectName("SettingsCard")
        form.setStyleSheet(f"""
            QFrame#SettingsCard {{ 
                background: {UI_PANEL_BG}; 
                border: 1px solid {UI_BORDER_COLOR}; 
                border-radius: 12px; 
            }}
        """)
        form.setGraphicsEffect(soft_shadow(blur=20, y_offset=4, alpha=80))
        form_layout = QGridLayout(form)
        form_layout.setContentsMargins(20, 20, 20, 20)
        form_layout.setSpacing(12)

        self.site_name_edit = QLineEdit("Random Thoughts Digest")
        self.author_home_edit = QLineEdit("https://example.github.io/")
        self.accent_color_edit = QLineEdit(DOC_ACCENT_COLOR)

        row = 0
        for label_text, widget in [
            ("Site name", self.site_name_edit),
            ("Home link URL", self.author_home_edit),
            ("Accent color (hex)", self.accent_color_edit),
        ]:
            lbl = QLabel(label_text)
            lbl.setStyleSheet("font-size:11px; color:#6c7086; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;")
            widget.setStyleSheet(f"""
                QLineEdit {{
                    padding: 10px; border: 1px solid {UI_BORDER_COLOR}; 
                    border-radius: 6px; background: {UI_BG_COLOR}; font-size: 13px; color: {UI_TEXT_COLOR};
                }}
                QLineEdit:focus {{ border: 1px solid {UI_ACCENT_COLOR}; background: #1e1e2e; }}
            """)
            form_layout.addWidget(lbl, row, 0)
            row += 1
            form_layout.addWidget(widget, row, 0)
            row += 1
        right_layout.addWidget(form)
        right_layout.addStretch()

        note = QLabel(
            "💡 <b>Pro Tip:</b><br>Double-click an image block to change its URL or upload a local file. "
            "Export embeds local images so the HTML file is fully standalone and shareable.")
        note.setWordWrap(True)
        note.setStyleSheet(f"""
            QLabel {{
                color: #a1a1aa; font-size: 12px; line-height: 1.6; 
                margin-top: 10px; padding: 16px 18px; 
                background: #1e1e2e; 
                border: 1px solid {UI_BORDER_COLOR};
                border-left: 3px solid {UI_ACCENT_COLOR};
                border-radius: 8px;
            }}
        """)
        right_layout.addWidget(note)

        splitter.addWidget(left_panel)
        splitter.addWidget(mid_panel)
        splitter.addWidget(self.right_panel)
        splitter.setStretchFactor(0, 0)
        splitter.setStretchFactor(1, 1)
        splitter.setStretchFactor(2, 0)
        splitter.setSizes([280, 900, 320])

        main_layout.addWidget(splitter)

    def _toggle_settings(self):
        self.right_panel.setVisible(self.settings_action.isChecked())

    def _seed_default_post(self):
        for key in ["category", "title", "subtitle", "date", "cover_image",
                     "heading", "paragraph", "quote", "paragraph", "footer"]:
            self.blocks.append({"type": key, "content": DEFAULT_CONTENT[key]})
        self._render_canvas()

    def add_block(self, block_type, dest_id=None, position='before'):
        block = {"type": block_type, "content": DEFAULT_CONTENT.get(block_type, "")}
        if dest_id is None:
            self.blocks.append(block)
        else:
            if position == 'after':
                dest_id += 1
            self.blocks.insert(dest_id, block)
        self._render_canvas()

    def _render_canvas(self):
        html_out = self._build_editable_html()
        self.canvas.setHtml(html_out, QUrl("file:///"))

    def new_post(self):
        confirm = QMessageBox.question(
            self, "New Post", "Clear the canvas and start a new post?",
            QMessageBox.Yes | QMessageBox.No)
        if confirm == QMessageBox.Yes:
            self.blocks = []
            self._render_canvas()

    def export_html(self):
        path, _ = QFileDialog.getSaveFileName(
            self, "Export HTML", "post.html", "HTML Files (*.html)")
        if not path:
            return
        html_out = self._build_html()
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(html_out)
            QMessageBox.information(self, "Exported", f"Post exported to:\n{path}")
        except OSError as e:
            QMessageBox.critical(self, "Export failed", str(e))

    def import_html(self):
        path, _ = QFileDialog.getOpenFileName(
            self, "Import HTML", "", "HTML Files (*.html *.htm)")
        if not path:
            return
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
        except OSError as e:
            QMessageBox.critical(self, "Import failed", str(e))
            return

        parser = ArticleHTMLParser()
        parser.feed(content)
        self.blocks = parser.blocks
        if parser.site_name:
            self.site_name_edit.setText(parser.site_name)
        if parser.home_link:
            self.author_home_edit.setText(parser.home_link)
        self._render_canvas()
        QMessageBox.information(self, "Imported", f"Loaded {len(self.blocks)} blocks from file.")

    def preview_html(self):
        html_out = self._build_html()
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w", encoding="utf-8")
        tmp.write(html_out)
        tmp.close()
        webbrowser.open("file://" + tmp.name)

    def _format_image_src(self, path):
        if not path:
            return ""
        if path.startswith("http://") or path.startswith("https://"):
            return path
        if os.path.exists(path):
            mime, _ = mimetypes.guess_type(path)
            if mime is None:
                mime = "image/jpeg"
            try:
                with open(path, "rb") as f:
                    encoded = base64.b64encode(f.read()).decode("utf-8")
                return f"data:{mime};base64,{encoded}"
            except Exception:
                return ""
        return path

    def _build_editable_html(self):
        accent = self.accent_color_edit.text().strip() or DOC_ACCENT_COLOR
        site_name = html_lib.escape(self.site_name_edit.text().strip() or "My Blog")
        home_link = html_lib.escape(self.author_home_edit.text().strip() or "#")

        body_html_parts = []
        for index, block in enumerate(self.blocks):
            t = block["type"]
            c = block["content"]
            esc = html_lib.escape(c)
            
            toolbar_html = f"""
            <div class="block-toolbar">
                <span class="drag-handle" draggable="true">↕</span>
                <span class="delete-btn" data-block-id="{index}">×</span>
            </div>
            """
            
            content_html = ""
            if t == "category":
                content_html = f'<span contenteditable="true" data-block-id="{index}" class="cat">{esc}</span>'
            elif t == "title":
                content_html = f'<h1 contenteditable="true" data-block-id="{index}" class="title">{esc}</h1>'
            elif t == "subtitle":
                content_html = f'<p contenteditable="true" data-block-id="{index}" class="sub">{esc}</p>'
            elif t == "date":
                content_html = f'<span contenteditable="true" data-block-id="{index}" class="date">{esc}</span>'
            elif t in ("cover_image", "image"):
                src = self._format_image_src(c)
                img_cls = "cover-img" if t == "cover_image" else "inline-img"
                if not src:
                    content_html = f'<div data-block-id="{index}" class="img-ph {img_cls}">Double-click to choose image</div>'
                else:
                    content_html = f'<img data-block-id="{index}" src="{src}" alt="" class="{img_cls}">'
            elif t == "heading":
                content_html = f'<h2 contenteditable="true" data-block-id="{index}" class="heading">{esc}</h2>'
            elif t == "paragraph":
                p = html_lib.escape(c).replace("\n", "<br>")
                content_html = f'<p contenteditable="true" data-block-id="{index}" class="para">{p}</p>'
            elif t == "quote":
                q = esc.replace("\n", "<br>")
                content_html = f'<blockquote contenteditable="true" data-block-id="{index}" class="quote" style="border-color:{accent};">{q}</blockquote>'
            elif t == "divider":
                content_html = f'<hr class="divider">'
            elif t == "spacer":
                content_html = f'<div class="spacer"></div>'
            elif t == "footer":
                f = esc.replace("\n", "<br>")
                content_html = f'<p contenteditable="true" data-block-id="{index}" class="footer">{f}</p>'

            body_html_parts.append(f'<div class="block-wrapper" data-block-id="{index}">{toolbar_html}{content_html}</div>')

        body_html = "\n        ".join(body_html_parts)

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap');
        
        * {{ box-sizing: border-box; }}
        body {{ 
            font-family: 'Inter', sans-serif; 
            background-color: {DOC_BG_COLOR}; 
            color: {DOC_TEXT_COLOR}; 
            padding: 60px 24px; 
            margin: 0; 
        }}
        
        /* Cute custom scrollbars */
        ::-webkit-scrollbar {{ width: 10px; height: 10px; }}
        ::-webkit-scrollbar-track {{ background: #f0ede2; }}
        ::-webkit-scrollbar-thumb {{ background: #ccc8b9; border-radius: 5px; border: 2px solid #f0ede2; }}
        ::-webkit-scrollbar-thumb:hover {{ background: #b3afa0; }}
        
        .container {{ 
            max-width: 760px; margin: 0 auto; 
            background: {DOC_CONTAINER_BG}; padding: 60px 70px; 
            border-radius: 16px; 
            box-shadow: 0 15px 50px rgba(0,0,0,0.06); 
        }}
        
        .nav {{ 
            display: flex; justify-content: space-between; align-items: center; 
            padding-bottom: 32px; border-bottom: 1px solid {DOC_BORDER_COLOR}; margin-bottom: 48px; 
        }}
        .nav a {{ font-size: 16px; font-weight: 600; font-style: italic; text-decoration: none; color: {DOC_TEXT_COLOR}; transition: color 0.2s; }}
        .nav a:hover {{ color: {accent}; }}
        .nav .site {{ font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: {DOC_MUTED_COLOR}; }}
        
        .cat {{ display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: {accent}; margin-bottom: 16px; }}
        .title {{ font-family: 'Playfair Display', serif; font-size: 46px; font-weight: 900; font-style: italic; margin: 0 0 16px 0; line-height: 1.1; letter-spacing: -1px; }}
        .sub {{ font-family: 'Playfair Display', serif; font-size: 22px; color: #57534e; font-weight: 400; font-style: italic; margin: 0 0 48px 0; line-height: 1.4; }}
        .date {{ display: inline-block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: {DOC_MUTED_COLOR}; }}
        
        .cover-img {{ width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 12px; margin-bottom: 48px; display: block; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }}
        .inline-img {{ width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 12px; margin: 36px 0; display: block; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }}
        .img-ph {{ 
            display: flex; align-items: center; justify-content: center; 
            background: #f8f6ef; color: #b8b5aa; font-size: 14px; font-weight: 500; cursor: pointer; 
            border: 2px dashed #e2dfd2; border-radius: 12px; transition: all 0.2s; 
        }}
        .img-ph:hover {{ background: #f0ede2; border-color: #c4be9e; }}
        
        .heading {{ font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; margin: 56px 0 20px 0; letter-spacing: -0.5px; }}
        .para {{ font-size: 17px; line-height: 1.8; color: {DOC_BODY_TEXT_COLOR}; margin: 0 0 28px 0; font-weight: 400; }}
        .quote {{ 
            border-left: 4px solid {accent}; padding: 8px 0 8px 28px; margin: 40px 0; 
            font-family: 'Playfair Display', serif; font-size: 24px; font-style: italic; 
            color: #1a1a1a; line-height: 1.4; 
        }}
        .divider {{ border: none; border-top: 1px solid {DOC_BORDER_COLOR}; margin: 40px 0; }}
        .spacer {{ height: 60px; }}
        .footer {{ font-size: 14px; color: {DOC_MUTED_COLOR}; margin-top: 56px; padding-top: 28px; border-top: 1px solid {DOC_BORDER_COLOR}; font-weight: 500; }}
        
        [contenteditable]:focus {{ outline: none; box-shadow: 0 0 0 3px rgba(90, 106, 59, 0.15); border-radius: 4px; }}
        [contenteditable] {{ transition: box-shadow 0.2s; padding: 2px 4px; margin: -2px -4px; }}
        
        .block-wrapper {{ position: relative; padding: 2px 0; border-radius: 6px; transition: background 0.2s; }}
        .block-wrapper:hover {{ background: rgba(90, 106, 59, 0.02); }}
        
        .block-toolbar {{ 
            position: absolute; top: -14px; right: -10px; 
            display: none; z-index: 100; 
            background: rgba(255,255,255,0.95); 
            border: 1px solid {DOC_BORDER_COLOR}; border-radius: 8px; 
            box-shadow: 0 8px 20px rgba(0,0,0,0.08); 
            backdrop-filter: blur(4px);
        }}
        .block-wrapper:hover .block-toolbar {{ display: flex; gap: 2px; padding: 3px; }}
        
        .drag-handle, .delete-btn {{ 
            width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; 
            font-size: 14px; cursor: pointer; user-select: none; border-radius: 6px; transition: all 0.2s; 
        }}
        .drag-handle {{ color: #888; cursor: grab; }}
        .drag-handle:hover {{ background: #f0ede2; color: #333; }}
        .delete-btn {{ color: #d00; font-weight: bold; }}
        .delete-btn:hover {{ background: #fee; color: #a00; }}
        
        .drop-before {{ box-shadow: inset 0 4px 0 0 {accent}, 0 2px 10px rgba(90,106,59,0.2); border-radius: 4px; }}
        .drop-after {{ box-shadow: inset 0 -4px 0 0 {accent}, 0 2px 10px rgba(90,106,59,0.2); border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="nav">
            <a href="{home_link}">&larr; Home</a>
            <span class="site">{site_name}</span>
        </div>
        <div class="article-body">
            {body_html}
        </div>
    </div>

    <script src="qrc:///qtwebchannel/qwebchannel.js"></script>
    <script>
        new QWebChannel(qt.webChannelTransport, function(channel) {{
            window.backend = channel.objects.backend;
        }});

        let draggedId = null;

        document.addEventListener('dragstart', function(e) {{
            const handle = e.target.closest('.drag-handle');
            if (handle) {{
                const wrapper = handle.closest('.block-wrapper');
                draggedId = wrapper.dataset.blockId;
                e.dataTransfer.setData('text/plain', draggedId);
                e.dataTransfer.effectAllowed = 'move';
            }} else {{
                e.preventDefault();
            }}
        }});

        document.addEventListener('dragover', function(e) {{
            const wrapper = e.target.closest('.block-wrapper');
            document.querySelectorAll('.drop-before').forEach(el => el.classList.remove('drop-before'));
            document.querySelectorAll('.drop-after').forEach(el => el.classList.remove('drop-after'));

            if (wrapper && draggedId !== wrapper.dataset.blockId) {{
                e.preventDefault();
                const rect = wrapper.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (e.clientY < mid) wrapper.classList.add('drop-before');
                else wrapper.classList.add('drop-after');
            }}
        }});

        document.addEventListener('drop', function(e) {{
            const wrapper = e.target.closest('.block-wrapper');
            if (wrapper && draggedId !== null && draggedId !== wrapper.dataset.blockId) {{
                e.preventDefault();
                const destId = wrapper.dataset.blockId;
                const rect = wrapper.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                const position = e.clientY < mid ? 'before' : 'after';
                if (window.backend) window.backend.reorder_blocks(draggedId, destId, position);
            }}
            draggedId = null;
            document.querySelectorAll('.drop-before').forEach(el => el.classList.remove('drop-before'));
            document.querySelectorAll('.drop-after').forEach(el => el.classList.remove('drop-after'));
        }});

        document.addEventListener('blur', function(e) {{
            if (e.target.hasAttribute('contenteditable')) {{
                const id = e.target.dataset.blockId;
                const text = e.target.innerText;
                if (window.backend) window.backend.update_block_content(id, text);
            }}
        }}, true);

        document.addEventListener('click', function(e) {{
            if (e.target.classList.contains('delete-btn')) {{
                e.stopPropagation();
                const id = e.target.dataset.blockId;
                if (window.backend) window.backend.delete_block(id);
            }}
        }});

        document.addEventListener('dblclick', function(e) {{
            if (e.target.tagName === 'IMG' || e.target.classList.contains('img-ph')) {{
                e.stopPropagation();
                const id = e.target.dataset.blockId;
                if (window.backend) window.backend.edit_image(id);
            }}
        }});
    </script>
</body>
</html>
"""

    def _build_html(self):
        accent = self.accent_color_edit.text().strip() or DOC_ACCENT_COLOR
        site_name = html_lib.escape(self.site_name_edit.text().strip() or "My Blog")
        home_link = html_lib.escape(self.author_home_edit.text().strip() or "#")

        header_map = {"category": "", "title": "", "subtitle": "", "date": "", "cover_image": ""}
        body_blocks = []
        for block in self.blocks:
            t = block["type"]
            c = block["content"]
            if t in header_map and header_map[t] == "":
                header_map[t] = c
            else:
                body_blocks.append(block)

        body_html_parts = []
        for block in body_blocks:
            t = block["type"]
            c = block["content"]
            esc = html_lib.escape(c)
            if t == "heading":
                body_html_parts.append(f'<h2 class="heading">{esc}</h2>')
            elif t == "paragraph":
                p = html_lib.escape(c).replace("\n", "<br>")
                body_html_parts.append(f'<p class="para">{p}</p>')
            elif t == "quote":
                q = esc.replace("\n", "<br>")
                body_html_parts.append(f'<blockquote class="quote" style="border-color:{accent};">{q}</blockquote>')
            elif t == "image":
                src = html_lib.escape(self._format_image_src(c), quote=True)
                if src:
                    body_html_parts.append(f'<img src="{src}" alt="" class="inline-img">')
            elif t == "divider":
                body_html_parts.append(f'<hr class="divider">')
            elif t == "spacer":
                body_html_parts.append(f'<div class="spacer"></div>')
            elif t == "footer":
                f = esc.replace("\n", "<br>")
                body_html_parts.append(f'<p class="footer">{f}</p>')

        body_html = "\n        ".join(body_html_parts)

        cover_src = html_lib.escape(self._format_image_src(header_map["cover_image"]), quote=True)
        category = html_lib.escape(header_map["category"])
        title = html_lib.escape(header_map["title"])
        subtitle = html_lib.escape(header_map["subtitle"])
        date = html_lib.escape(header_map["date"])
        cover_img_html = f'<img src="{cover_src}" alt="{title}" class="cover-img">' if cover_src else ""

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | {site_name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap');
        * {{ box-sizing: border-box; }}
        body {{ font-family: 'Inter', sans-serif; background-color: {DOC_BG_COLOR}; color: {DOC_TEXT_COLOR}; padding: 60px 24px; margin: 0; }}
        .container {{ max-width: 760px; margin: 0 auto; background: {DOC_CONTAINER_BG}; padding: 60px 70px; border-radius: 16px; box-shadow: 0 15px 50px rgba(0,0,0,0.06); }}
        .nav {{ display: flex; justify-content: space-between; align-items: center; padding-bottom: 32px; border-bottom: 1px solid {DOC_BORDER_COLOR}; margin-bottom: 48px; }}
        .nav a {{ font-size: 16px; font-weight: 600; font-style: italic; text-decoration: none; color: {DOC_TEXT_COLOR}; }}
        .nav a:hover {{ color: {accent}; }}
        .nav .site {{ font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: {DOC_MUTED_COLOR}; }}
        .cat {{ display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: {accent}; margin-bottom: 16px; }}
        .title {{ font-family: 'Playfair Display', serif; font-size: 46px; font-weight: 900; font-style: italic; margin: 0 0 16px 0; line-height: 1.1; letter-spacing: -1px; }}
        .sub {{ font-family: 'Playfair Display', serif; font-size: 22px; color: #57534e; font-weight: 400; font-style: italic; margin: 0 0 20px 0; line-height: 1.4; }}
        .date {{ display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: {DOC_MUTED_COLOR}; margin: 0 0 48px 0; }}
        .cover-img {{ width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 12px; margin-bottom: 48px; display: block; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }}
        .inline-img {{ width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 12px; margin: 36px 0; display: block; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }}
        .heading {{ font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; margin: 56px 0 20px 0; letter-spacing: -0.5px; }}
        .para {{ font-size: 17px; line-height: 1.8; color: {DOC_BODY_TEXT_COLOR}; margin: 0 0 28px 0; font-weight: 400; }}
        .quote {{ border-left: 4px solid {accent}; padding: 8px 0 8px 28px; margin: 40px 0; font-family: 'Playfair Display', serif; font-size: 24px; font-style: italic; color: #1a1a1a; line-height: 1.4; }}
        .divider {{ border: none; border-top: 1px solid {DOC_BORDER_COLOR}; margin: 40px 0; }}
        .spacer {{ height: 60px; }}
        .footer {{ font-size: 14px; color: {DOC_MUTED_COLOR}; margin-top: 56px; padding-top: 28px; border-top: 1px solid {DOC_BORDER_COLOR}; font-weight: 500; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="nav">
            <a href="{home_link}">&larr; Home</a>
            <span class="site">{site_name}</span>
        </div>
        <div class="article-body">
            <span class="cat">{category}</span>
            <h1 class="title">{title}</h1>
            <p class="sub">{subtitle}</p>
            <span class="date">{date}</span>
            {cover_img_html}
            {body_html}
        </div>
    </div>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# HTML importer
# ---------------------------------------------------------------------------
class ArticleHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.blocks = []
        self.site_name = ""
        self.home_link = ""
        self._in_main = False
        self._in_header = False
        self._in_footer = False
        self._tag_stack = []
        self._current_tag = None
        self._current_attrs = {}
        self._text_buffer = ""
        self._header_done = False
        self._first_img_taken = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        self._tag_stack.append(tag)

        if tag == "a" and not self._in_main:
            self.home_link = attrs_dict.get("href", "")
        if tag == "div" and "article-body" in attrs_dict.get("class", ""):
            self._in_main = True
        if tag == "img":
            src = attrs_dict.get("src", "")
            if self._in_main and not self._first_img_taken:
                self.blocks.append({"type": "cover_image", "content": src})
                self._first_img_taken = True
            elif self._in_main:
                self.blocks.append({"type": "image", "content": src})
        if tag == "hr":
            self.blocks.append({"type": "divider", "content": ""})
        if tag == "div" and "spacer" in attrs_dict.get("class", ""):
            self.blocks.append({"type": "spacer", "content": ""})
        if tag in ("h1", "h2", "p", "span", "blockquote", "title"):
            self._current_tag = tag
            self._current_attrs = attrs_dict
            self._text_buffer = ""

    def handle_endtag(self, tag):
        if self._tag_stack and self._tag_stack[-1] == tag:
            self._tag_stack.pop()
        if tag == "div" and self._in_main:
            self._in_main = False

        if tag == self._current_tag:
            text = re.sub(r"\s+", " ", self._text_buffer).strip()
            text = html_lib.unescape(text)
            if text:
                if tag == "title" and not self._in_main:
                    parts = text.split("|")
                    if len(parts) > 1:
                        self.site_name = parts[-1].strip()
                elif tag == "span" and "cat" in self._current_attrs.get("class", ""):
                    self.blocks.append({"type": "category", "content": text})
                elif tag == "h1" and "title" in self._current_attrs.get("class", ""):
                    self.blocks.append({"type": "title", "content": text})
                elif tag == "p" and "sub" in self._current_attrs.get("class", ""):
                    self.blocks.append({"type": "subtitle", "content": text})
                elif tag == "h2" and "heading" in self._current_attrs.get("class", ""):
                    self.blocks.append({"type": "heading", "content": text})
                elif tag == "p" and "para" in self._current_attrs.get("class", ""):
                    self.blocks.append({"type": "paragraph", "content": text})
                elif tag == "blockquote":
                    text = text.strip("\u201c\u201d\"")
                    self.blocks.append({"type": "quote", "content": text})
                elif tag == "p" and "footer" in self._current_attrs.get("class", ""):
                    self.blocks.append({"type": "footer", "content": text})
                elif tag == "span" and "site" in self._current_attrs.get("class", ""):
                    self.blocks.append({"type": "date", "content": text})
            self._current_tag = None
            self._current_attrs = {}
            self._text_buffer = ""

    def handle_data(self, data):
        if self._current_tag is not None:
            self._text_buffer += data


def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    window = BlogBuilder()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()