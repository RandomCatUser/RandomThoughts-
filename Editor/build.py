#!/usr/bin/env python3
"""Article Builder — command line publisher for the Random Thoughts blog.

Reads a Markdown draft (with a small front-matter block) and produces a
complete post page matching the blog's structure, then optionally wires it
into the homepage/search index (docs/assets/js/common.js -> window.RT_POSTS).

Usage:
    python build.py draft.md                       # generate + print entry
    python build.py draft.md --apply               # also write common.js entry
    python build.py draft.md --docs path/to/docs   # custom docs directory

Draft format (front matter between --- lines, body is Markdown):

    ---
    title: A Quiet Essay
    subtitle: An italic line under the title.
    category: Tech & Culture
    description: Shown on cards and in search.
    date: Sep 5, 2026
    tags: Tech, Life
    cover: posts/assets/cover.jpg
    coverAlt: Describe the image
    featured: false
    slug: a-quiet-essay
    ---

    ## First heading

    Some **bold** text, *italics*, a [link](https://example.com), and a quote:

    > The pull quote worth highlighting.

Only Python's standard library is required.
"""

import argparse
import html
import os
import re
import sys
from datetime import date as _date

SITE = "https://randomcatuser.github.io/RandomThoughts-"
AUTHOR_NAME = "Dihan Ramanayaka"
AUTHOR_PHOTO = (
    "https://github.com/RandomCatUser/RandomCatUser/blob/main/workflows/MyProfile.webp?raw=true"
)


# ---------------------------------------------------------------------------
# Front matter
# ---------------------------------------------------------------------------

def parse_front_matter(text):
    """Return (meta: dict, body: str) for a draft containing a --- block."""
    if not text.startswith("---"):
        return {}, text
    lines = text.splitlines()
    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        return {}, text
    meta = {}
    for line in lines[1:end]:
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        meta[key.strip().lower()] = value.strip()
    body = "\n".join(lines[end + 1:]).strip("\n")
    return meta, body


def as_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def esc(text):
    return html.escape(str(text if text is not None else ""), quote=True)


def slugify(text):
    text = str(text or "").lower()
    text = re.sub(r"\b(?:and|the)\b", " ", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:60]


def today_display():
    d = _date.today()
    return d.strftime("%b %d, %Y").replace(" 0", " ")


def display_to_iso(display):
    m = re.match(r"^([A-Za-z]{3}) (\d{1,2}), (\d{4})$", (display or "").strip())
    if not m:
        return _date.today().isoformat()
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    mon = m.group(1).title()
    idx = months.index(mon) if mon in months else 0
    return "%s-%02d-%02d" % (int(m.group(3)), idx + 1, int(m.group(2)))


# ---------------------------------------------------------------------------
# Minimal Markdown -> HTML (the subset used by this blog's posts)
# ---------------------------------------------------------------------------

def inline(text):
    text = html.escape(text, quote=False)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)", r'<img alt="\1" src="\2">', text)
    text = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", text)
    text = re.sub(r"(?<!\w)_([^_]+)_(?!\w)", r"<em>\1</em>", text)
    return text


def render_blocks(lines):
    out = []
    i, n = 0, len(lines)

    def paragraph(acc):
        inner = "</p>\n<p>".join(inline(l.strip()) for l in acc if l.strip())
        return "<p>" + inner + "</p>"

    while i < n:
        line = lines[i]
        if not line.strip():
            i += 1
            continue

        if line.strip().startswith("```"):
            block = []
            i += 1
            while i < n and not lines[i].strip().startswith("```"):
                block.append(lines[i])
                i += 1
            i += 1  # closing fence
            out.append("<pre><code>" + html.escape("\n".join(block)) + "</code></pre>")
            continue

        m = re.match(r"^(#{1,3})\s+", line)
        if m:
            level = len(m.group(1))
            text = inline(re.sub(r"^#+\s*", "", line).strip())
            out.append("<h%d>%s</h%d>" % (level, text, level))
            i += 1
            continue

        if line.strip().startswith(">"):
            quotes = []
            while i < n and lines[i].strip().startswith(">"):
                quotes.append(re.sub(r"^>\s?", "", lines[i]))
                i += 1
            inner = "<p>" + "</p>\n<p>".join(
                inline(q.strip()) for q in quotes if q.strip()
            ) + "</p>"
            out.append("<blockquote>\n%s\n</blockquote>" % inner)
            continue

        if re.match(r"^\s*[-*]\s+", line):
            items = []
            while i < n and re.match(r"^\s*[-*]\s+", lines[i]):
                items.append(re.sub(r"^\s*[-*]\s+", "", lines[i]).strip())
                i += 1
            lis = "".join("<li>%s</li>" % inline(it) for it in items if it)
            out.append("<ul>\n%s\n</ul>" % lis)
            continue

        if re.match(r"^\s*\d+\.\s+", line):
            items = []
            while i < n and re.match(r"^\s*\d+\.\s+", lines[i]):
                items.append(re.sub(r"^\s*\d+\.\s+", "", lines[i]).strip())
                i += 1
            lis = "".join("<li>%s</li>" % inline(it) for it in items if it)
            out.append("<ol>\n%s\n</ol>" % lis)
            continue

        acc = []
        while i < n and lines[i].strip() and not re.match(r"^#{1,3}\s+", lines[i]) \
                and not lines[i].strip().startswith(("```", ">")) \
                and not re.match(r"^\s*[-*]\s+", lines[i]) \
                and not re.match(r"^\s*\d+\.\s+", lines[i]):
            acc.append(lines[i])
            i += 1
        out.append(paragraph(acc))

    return "\n\n".join(out)


def decorate_body(md):
    """Mirror the web editor: add the blog's Tailwind/rt-* classes."""
    html_body = render_blocks(md.splitlines())
    html_body = re.sub(r"<blockquote>",
                       '<blockquote class="border-l-4 rt-quote pl-6 py-2 my-8 text-2xl font-serif italic">',
                       html_body)
    html_body = re.sub(r"<h1>",
                       '<h1 class="rt-body-title text-5xl font-bold mt-10 mb-8 tracking-tight">',
                       html_body)
    html_body = re.sub(r"<h2>",
                       '<h2 class="rt-body-title text-4xl font-bold mt-16 mb-6 tracking-tight">',
                       html_body)
    html_body = re.sub(r"<h3>",
                       '<h3 class="rt-body-title text-3xl font-bold mt-12 mb-4 tracking-tight">',
                       html_body)
    html_body = re.sub(r"<img ",
                       '<img class="w-full object-cover rounded-2xl my-10" ',
                       html_body)
    return html_body


# ---------------------------------------------------------------------------
# Post generation
# ---------------------------------------------------------------------------

def build_post(meta, body_text):
    title = meta.get("title", "Untitled").strip()
    slug = (meta.get("slug") or slugify(title) or "untitled").strip()
    date_display = (meta.get("date") or today_display()).strip()
    iso = display_to_iso(date_display)
    description = meta.get("description", "").strip()
    cover = meta.get("cover", "").strip()
    cover_alt = (meta.get("coveralt") or title).strip()
    tags = [t.strip() for t in meta.get("tags", "").split(",") if t.strip()]
    featured = as_bool(meta.get("featured"))
    category = meta.get("category", "").strip()
    subtitle = meta.get("subtitle", "").strip()
    canonical = "%s/posts/%s.html" % (SITE, slug)

    body = decorate_body(body_text)
    cover_img = (
        '<img src="%s" alt="%s" class="w-full aspect-video object-cover rounded-2xl mb-12">'
        % (esc(cover), esc(cover_alt))
        if cover else ""
    )
    cat_html = (
        '<span class="rt-body-cat text-xs uppercase tracking-[0.2em] font-bold">%s</span>'
        % esc(category)
        if category else ""
    )
    sub_html = (
        '<p class="text-xl rt-body-sub font-light italic">%s</p>' % esc(subtitle)
        if subtitle else ""
    )
    indented = "\n".join("        " + l for l in body.splitlines())

    head = [
        "<!DOCTYPE html>",
        '<html lang="en">',
        "<head>",
        '    <meta charset="UTF-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '    <title>%s | Random Thoughts Digest</title>' % esc(title),
        '    <meta name="description" content="%s">' % esc(description),
        '    <meta name="robots" content="index, follow">',
        '    <link rel="canonical" href="%s">' % canonical,
        '    <link rel="icon" type="image/webp" href="%s">' % AUTHOR_PHOTO,
        "",
        "    <!-- Open Graph -->",
        '    <meta property="og:type" content="article">',
        '    <meta property="og:site_name" content="Random Thoughts">',
        '    <meta property="og:title" content="%s | Random Thoughts Digest">' % esc(title),
        '    <meta property="og:description" content="%s">' % esc(description),
        '    <meta property="og:url" content="%s">' % canonical,
        '    <meta property="og:image" content="%s">' % esc(cover),
        '    <meta property="article:published_time" content="%s">' % iso,
        "",
        "    <!-- Twitter Card -->",
        '    <meta name="twitter:card" content="summary">',
        '    <meta name="twitter:title" content="%s | Random Thoughts Digest">' % esc(title),
        '    <meta name="twitter:description" content="%s">' % esc(description),
        '    <meta name="twitter:image" content="%s">' % esc(cover),
        '    <script src="https://cdn.tailwindcss.com"></script>',
        "",
        "    <!-- Fonts -->",
        '    <link rel="preconnect" href="https://fonts.googleapis.com">',
        '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        '    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">',
        "",
        "    <!-- Font Awesome (player icons) -->",
        '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">',
        "    <!-- jsmediatags (metadata parsing) -->",
        '    <script src="https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js"></script>',
        "",
        '    <link rel="stylesheet" href="../assets/css/common.css">',
        '    <link rel="stylesheet" href="posts.css">',
        "</head>",
        '<body class="antialiased">',
        "",
        "    <!-- Header (injected by common.js) -->",
        '    <div id="site-header"></div>',
        "",
        '    <main class="mx-auto max-w-3xl px-5 md:px-8 article-body">',
        '        <header class="mb-12">',
    ]
    if cat_html:
        head.append("            " + cat_html)
    head.append('            <h1 class="rt-body-title text-5xl md:text-7xl font-bold mt-4 mb-6 tracking-tight italic">%s</h1>' % esc(title))
    if sub_html:
        head.append("            " + sub_html)
    head += [
        "        </header>",
        "",
    ]
    if cover_img:
        head.append("        " + cover_img)
    head += [
        indented,
        "",
        '        <footer class="mt-20 pt-10 border-t rt-foot text-sm">',
        "            <p>훌륭합니다! 기사를 끝까지 읽으셨습니다.</p>",
        "        </footer>",
        "    </main>",
        "",
        "    <!-- Footer (injected by common.js) -->",
        '    <div id="site-footer"></div>',
        "",
        "    <!-- Dynamic island music player (injected by common.js) -->",
        '    <div id="sc-player"></div>',
        "",
        '    <script src="../assets/js/common.js"></script>',
        "</body>",
        "</html>",
    ]
    page = "\n".join(l for l in head if l != "") + "\n"
    return slug, page


def build_entry(meta, slug, tags):
    title = meta.get("title", "Untitled").strip()
    description = meta.get("description", "").strip()
    cover = meta.get("cover", "").strip()
    cover_alt = (meta.get("coveralt") or title).strip()
    date_display = (meta.get("date") or today_display()).strip()
    featured = "true" if as_bool(meta.get("featured")) else "false"
    tag_list = ", ".join('"%s"' % t.replace('"', "") for t in tags)
    if not tag_list:
        tag_list = '"General"'
    return (
        "    {\n"
        "        id: \"%s\",\n"
        "        title: \"%s\",\n"
        "        description: \"%s\",\n"
        "        cover: \"%s\",\n"
        "        coverAlt: \"%s\",\n"
        "        tags: [%s],\n"
        "        date: \"%s\",\n"
        "        url: \"posts/%s.html\",\n"
        "        featured: %s,\n"
        "        contributors: [\n"
        "            { name: \"%s\", photo: \"%s\" }\n"
        "        ]\n"
        "    },\n"
    ) % (
        slug.replace('"', ""), title.replace('"', ""), description.replace('"', ""),
        cover.replace('"', ""), cover_alt.replace('"', ""), tag_list, date_display,
        slug.replace('"', ""), featured, AUTHOR_NAME, AUTHOR_PHOTO,
    )


def insert_entry(common_js_path, entry, slug):
    if not os.path.isfile(common_js_path):
        raise RuntimeError(
            "Could not find %s — copy it in or check the --docs path." % common_js_path)
    with open(common_js_path, "r", encoding="utf-8") as f:
        data = f.read()
    marker = "window.RT_POSTS = ["
    idx = data.find(marker)
    if idx == -1:
        raise RuntimeError("Could not locate window.RT_POSTS in " + common_js_path)
    close_idx = data.find("\n    ];", idx)
    if close_idx == -1:
        raise RuntimeError("Could not locate the closing bracket of RT_POSTS")
    block = data[idx:close_idx]
    if re.search(r'\bid:\s*"' + re.escape(slug) + r'"', block):
        raise RuntimeError(
            "RT_POSTS already contains an entry with id \"%s\" — skipping to avoid a duplicate."
            % slug)
    insert_at = close_idx + 1  # right after the newline, before "    ];"
    updated = data[:insert_at] + "\n" + entry + data[insert_at:]
    with open(common_js_path, "w", encoding="utf-8") as f:
        f.write(updated)
    return updated


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv=None):
    parser = argparse.ArgumentParser(description="Build a Random Thoughts post page.")
    parser.add_argument("draft", help="Path to the .md draft (front matter + markdown).")
    parser.add_argument("--docs", default=None, help="Docs directory (default: repo docs).")
    parser.add_argument("--apply", action="store_true",
                        help="Insert the RT_POSTS entry into docs/assets/js/common.js.")
    args = parser.parse_args(argv)

    editor_dir = os.path.dirname(os.path.abspath(__file__))
    docs_dir = os.path.abspath(args.docs) if args.docs else os.path.normpath(
        os.path.join(editor_dir, "..", "docs"))

    with open(args.draft, "r", encoding="utf-8") as f:
        text = f.read()
    meta, body = parse_front_matter(text)
    if not meta.get("title"):
        parser.error("Draft is missing a title in its front matter.")

    slug, page = build_post(meta, body)
    tags = [t.strip() for t in meta.get("tags", "").split(",") if t.strip()]

    posts_dir = os.path.join(docs_dir, "posts")
    os.makedirs(posts_dir, exist_ok=True)
    out_path = os.path.join(posts_dir, slug + ".html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(page)

    entry = "\n".join(
        l for l in build_entry(meta, slug, tags).rstrip("\n").splitlines()
    ) + "\n"

    print("Wrote: %s" % os.path.relpath(out_path, os.getcwd()))
    print()
    print(entry)

    if args.apply:
        common_js = os.path.join(docs_dir, "assets", "js", "common.js")
        try:
            insert_entry(common_js, entry, slug)
        except RuntimeError as err:
            print(str(err))
            return 1
        print("Inserted entry into %s" % os.path.relpath(common_js, os.getcwd()))
    else:
        print("To also wire the post into the homepage/search, run with --apply")


if __name__ == "__main__":
    sys.exit(main())