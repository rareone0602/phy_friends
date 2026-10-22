"""The style guide page: STYLE.md and FWIENDS.md rendered to style.html (`python3 tools/pf.py style`).

The Markdown is the house's own small subset: headings, paragraphs, lists, tables, code blocks, rules, and inline
**bold**, *italic*, `code` and links. Each heading gets an id, the page opens with a contents line, and each §N in the
text links to its section.
"""
import html
import re
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parent.parent

LIST_ITEM = re.compile(r'( *)([-*]|\d+\.) +(.*)')


def md_inline(text):
    """Convert inline Markdown (**bold**, *italic*, `code`, [text](url)) to HTML; escape the rest."""
    codes = []  # Code spans are held out as \0n\0 so emphasis can wrap them but not match inside.

    def stash(m):
        codes.append(f'<code>{html.escape(m[1], quote=False)}</code>')
        return f'\0{len(codes) - 1}\0'
    text = html.escape(re.sub(r'`([^`]+)`', stash, text), quote=False)
    text = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', lambda m: '<a href="%s">%s</a>' % (m[2].replace('"', '%22'), m[1]), text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<![\w*])\*(?=\S)(.+?)(?<=\S)\*(?![\w*])', r'<em>\1</em>', text)
    return re.sub(r'\0(\d+)\0', lambda m: codes[int(m[1])], text)


def md_blocks(lines, tight=False):
    """Convert the block-level Markdown that STYLE.md uses to HTML.

    Supported: # headings, ---, paragraphs, - and 1. lists nested by indentation,
    > quotes, | tables and ``` code blocks. tight: emit paragraphs as bare text
    (inside a list item). A paragraph that runs straight into a list (no blank
    line) is marked class="lead".
    """
    out, i, n = [], 0, len(lines)
    while i < n:
        line = lines[i]
        m = LIST_ITEM.match(line)
        if not line.strip():
            i += 1
        elif line.lstrip().startswith('```'):
            j = i + 1
            while j < n and not lines[j].lstrip().startswith('```'):
                j += 1
            code = '\n'.join(lines[i + 1:j])
            out.append(f'<pre><code>{html.escape(code, quote=False)}</code></pre>')
            i = j + 1
        elif line.startswith('|'):
            j = i
            while j < n and lines[j].startswith('|'):
                j += 1
            rows = [[c.strip() for c in x.strip().strip('|').split('|')] for x in lines[i:j]]
            head, body = (rows[0], rows[2:]) if len(rows) > 1 and set(''.join(rows[1])) <= set('-: ') else (None, rows)
            cells = lambda tag, row: ''.join(f'<{tag}>{md_inline(c)}</{tag}>' for c in row)
            out.append('<table>\n' + (f'<thead><tr>{cells("th", head)}</tr></thead>\n' if head else '')
                       + '<tbody>\n' + '\n'.join(f'<tr>{cells("td", r)}</tr>' for r in body) + '\n</tbody>\n</table>')
            i = j
        elif line.strip() == '---':
            out.append('<hr>')
            i += 1
        elif re.match(r'#{1,6} ', line):
            hashes, text = line.split(None, 1)
            out.append(f'<h{len(hashes)} id="{heading_id(text)}">{md_inline(text.strip())}</h{len(hashes)}>')
            i += 1
        elif line.startswith('>'):
            j = i
            while j < n and lines[j].startswith('>'):
                j += 1
            out.append('<blockquote>\n' + md_blocks([re.sub(r'^> ?', '', x) for x in lines[i:j]]) + '\n</blockquote>')
            i = j
        elif m:
            indent, ordered, items = len(m[1]), m[2].endswith('.'), []
            while i < n and (m := LIST_ITEM.match(lines[i])) and len(m[1]) == indent and m[2].endswith('.') == ordered:
                w, body = len(m[0]) - len(m[3]), [m[3]]  # The item text starts at column w (indent + marker + space).
                i += 1
                while i < n and lines[i].strip() and len(lines[i]) - len(lines[i].lstrip()) > indent:
                    body.append(lines[i][min(w, len(lines[i]) - len(lines[i].lstrip())):])
                    i += 1
                items.append(f'<li>{md_blocks(body, tight=True)}</li>')
            tag = 'ol' if ordered else 'ul'
            out.append(f'<{tag}>\n' + '\n'.join(items) + f'\n</{tag}>')
        else:
            j = i + 1
            while j < n and lines[j].strip() and not (LIST_ITEM.match(lines[j]) or re.match(r'#{1,6} |>|---\s*$|\s*```|\|', lines[j])):
                j += 1
            text = md_inline(' '.join(x.strip() for x in lines[i:j]))
            lead = j < n and LIST_ITEM.match(lines[j])
            out.append(text if tight else f'<p class="lead">{text}</p>' if lead else f'<p>{text}</p>')
            i = j
    return '\n'.join(out)


def heading_id(text):
    """Return a heading's id: sN for section N ("3. words" takes s3), which its § references link to; else a slug."""
    number = re.match(r'(\d+)\. ', text)
    return f's{number[1]}' if number else re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


HEADING = re.compile(r'<h([12]) id="([^"]+)">(.*?)</h\1>')
# A code block or code span, which is left alone, or a section reference: §N, after the name of the
# document it points into when that is another one ("`STYLE.md` §5").
SECTION_REF = re.compile(r'<pre>.*?</pre>|(?:(?:<code>)?([\w-]+\.md)(?:</code>)?,? )?§(\d+)|<code>.*?</code>', re.S)


def link_section_refs(part, name, ids):
    """Link every §N in a part of the page to section N of the document it names, or else of its own.

    name: the part's source file name. ids: {source file name: the ids of its headings}. A reference
    into a document on the page must name one of its sections; one into any other document stays text.
    """
    def link(m):
        doc, number = m[1] or name, m[2]
        if number is None or doc not in ids:
            return m[0]
        if f's{number}' not in ids[doc]:
            raise SystemExit(f'{name}: §{number} names no section of {doc}')
        return m[0][:-len(number) - 1] + f'<a href="#s{number}">§{number}</a>'
    return SECTION_REF.sub(link, part)


def contents_lines(docs):
    """Return the page's contents: for each document, a line of small print (.meta) listing its headings.

    docs: for each document, its title and its headings' (id, inner HTML) pairs in order. Each line
    is a block of its own, so a blank rule parts the documents, and a later document's line opens
    with its part title, which names it.
    """
    def line(title, headings):
        label = html.escape(f'contents of {title}', quote=False).replace('"', '&quot;')
        items = ''.join(f'<li><a href="#{id_}">{text}</a></li>' for id_, text in headings)
        return f'<nav aria-label="{label}">\n<ul class="meta">{items}</ul>\n</nav>'
    return '\n'.join(line(title, headings) for title, headings in docs)


# The page is styled only by lib/style/site/notebook.css (the paper) and lib/style/site/pencil.css (the .doc
# column and everything drawn on it). It deliberately has no CSS of its own, so the style
# guide is rendered with the same stylesheets it documents.
STYLE_PAGE = Template("""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>$title</title>
<meta name="description" content="how phy makes things: the paper, the pencil, the words and the fwiends.">
<meta name="theme-color" content="#fbf9f3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#3d3c39" media="(prefers-color-scheme: dark)">
<link rel="icon" href="lib/style/site/icon.svg" type="image/svg+xml">
<link rel="icon" href="lib/style/site/icon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="lib/style/site/apple-touch-icon.png">
<!-- Generated from STYLE.md and FWIENDS.md by `python3 tools/pf.py style`: edit those, not this file. -->
<link rel="preload" href="lib/style/site/fonts/ShantellSans-Latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="lib/style/site/notebook.css">
<link rel="stylesheet" href="lib/style/site/pencil.css">
</head>
<body>
<script src="lib/style/site/graphite.js"></script>

<header>
  <h1>style guide</h1>
  <p class="intro">how phy makes things: the paper, the pencil, the words and the fwiends.</p>
  <nav aria-label="pages">
    <ul>
      <li><a href="index.html">fwiends</a></li>
      <li><span aria-current="page">style guide</span></li>
      <li><a href="specimen.html">specimen</a></li>
    </ul>
  </nav>
</header>

<main>
  <article class="doc">
$body
  </article>
</main>

<footer>
  <ul>
    <li><a href="index.html">back to the fwiends</a></li>
    <li>source: <a href="https://github.com/rareone0602/phy_friends" aria-label="github.com/rareone0602/phy_friends">github.com/<wbr>rareone0602/<wbr>phy_friends</a></li>
  </ul>
</footer>
</body>
</html>
""")


SOURCES = (ROOT / 'STYLE.md', ROOT / 'FWIENDS.md')
STYLE_HTML = ROOT / 'style.html'


def style_page(srcs=SOURCES, out=STYLE_HTML):
    """Render STYLE.md, then FWIENDS.md, to style.html (see style_html), and return the path written."""
    Path(out).write_text(style_html(srcs), encoding='utf-8')
    return out


def style_html(srcs=SOURCES):
    """Return the style guide page's text, rendered from STYLE.md, then FWIENDS.md.

    The first file's # title becomes the <title>; each later file's # title heads
    its own part of the page. The page's own h1 and intro are written in STYLE_PAGE.
    The writing opens with a contents line that lists every part title and section,
    and each §N in the text links to its section.
    """
    titles, parts = [], []
    for k, src in enumerate(srcs):
        lines = Path(src).read_text(encoding='utf-8').splitlines()
        head = lines.pop(0)[2:].strip() if lines and lines[0].startswith('# ') else None
        titles.append(head or ("phy's style guide" if k == 0 else Path(src).stem))
        if k and head:
            lines = ['---', '', '# ' + head, ''] + lines
        parts.append(md_blocks(lines))
    headings = [[(id_, text) for _, id_, text in HEADING.findall(part)] for part in parts]
    ids = [id_ for doc in headings for id_, _ in doc]
    if len(set(ids)) < len(ids):
        raise SystemExit(f'two headings share an id: {", ".join(sorted({x for x in ids if ids.count(x) > 1}))}')
    names = [Path(src).name for src in srcs]
    ids = {name: {id_ for id_, _ in doc} for name, doc in zip(names, headings)}
    body = [contents_lines(zip(titles, headings))] + [link_section_refs(part, name, ids) for part, name in zip(parts, names)]
    return STYLE_PAGE.substitute(title=html.escape(titles[0], quote=False), body='\n'.join(body))
