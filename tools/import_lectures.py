"""Import the course's Beamer chapters as editable MkDocs pages.

Usage: python tools/import_lectures.py PATH_TO_LATEX
Optional import tools: pypandoc_binary, pymupdf, numpy; pdflatex on PATH.
Normal site builds need none of these tools. Original source is read-only.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

import numpy as np
import pymupdf
import pypandoc
import markdown as markdown_renderer


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/lectures"
WORK = ROOT / "artifacts/lecture-import"
FRAME = re.compile(r"\\begin\{frame\}(?:\[([^\]]*)\])?\s*\{", re.M)


def group(text, position, left="{", right="}"):
    while position < len(text) and text[position].isspace():
        position += 1
    if position >= len(text) or text[position] != left:
        raise ValueError(f"Expected {left!r}: {text[position:position+100]!r}")
    start, depth = position + 1, 1
    position += 1
    while position < len(text):
        if text[position] == "\\":
            position += 2
            continue
        if text[position] == left:
            depth += 1
        elif text[position] == right:
            depth -= 1
            if not depth:
                return text[start:position], position + 1
        position += 1
    raise ValueError("Unclosed group")


def commands(text, name, count, transform, optional=False):
    pattern = re.compile(r"\\" + re.escape(name) + r"(?![a-zA-Z])")
    pieces, cursor = [], 0
    for match in pattern.finditer(text):
        if match.start() < cursor:
            continue
        position = match.end()
        option = ""
        while position < len(text) and text[position].isspace():
            position += 1
        if optional and position < len(text) and text[position] == "[":
            option, position = group(text, position, "[", "]")
        args = []
        try:
            for _ in range(count):
                value, position = group(text, position)
                args.append(value)
        except ValueError:
            continue
        pieces.extend((text[cursor:match.start()], transform(args, option)))
        cursor = position
    return "".join(pieces) + text[cursor:]


def safe_name(value):
    value = value.replace("/", "of")
    value = re.sub(r"[^a-zA-Z0-9._-]+", "-", value).strip("-")
    return value or "example.txt"


def normalize_line_breaks(text):
    """Use Python-Markdown hard breaks without changing code or display math."""
    lines, code, math = [], False, False
    for line in text.splitlines():
        if line.lstrip().startswith("```"):
            code = not code
        if not code and line.strip() == "$$":
            math = not math
        if not code and not math and line.endswith("\\"):
            line = line[:-1] + "  "
        lines.append(line)
    return "\n".join(lines) + "\n"


def plain(value):
    value = commands(value, "lvl", 1, lambda a, o: "")
    value = commands(value, "texorpdfstring", 2, lambda a, o: a[1])
    for name in ("textbf", "textit", "texttt", "code", "textsuperscript", "textsubscript", "text"):
        value = commands(value, name, 1, lambda a, o: a[0])
    value = value.replace(r"\&", "&").replace(r"\_", "_").replace(r"\%", "%")
    value = value.replace(r"\textmu", "µ").replace(r"\textdegree", "°")
    value = value.replace("---", "—").replace("--", "–")
    return re.sub(r"\\[a-zA-Z]+\s*", "", value).replace("{", "").replace("}", "").strip()


class Importer:
    def __init__(self, source):
        self.source = source.resolve()
        self.blocks = {}
        self.diagrams = []
        self.images = {}
        self.raw = []
        self.coverage = []
        self.example_count = 0
        self.chapter = ""
        self.frame_title = ""
        self.figure_context = ""
        self.bibliography = self.read_bibliography()

    def block(self, content, inline=False):
        key = f"EPPLACEHOLDER{len(self.blocks):06d}"
        self.blocks[key] = content
        return key if inline else f"\n\\par {key} \\par\n"

    def expand(self, path, seen=None):
        seen = set() if seen is None else seen
        path = path.resolve()
        if path in seen:
            return ""
        seen.add(path)
        text = path.read_text(encoding="utf-8")
        return re.sub(r"\\input\{([^}]+)\}", lambda m: self.expand(self.source / (m[1] + ".tex"), seen), text)

    def read_bibliography(self):
        entries = {}
        text = (self.source / "esp32-references.bib").read_text(encoding="utf-8")
        for match in re.finditer(r"@\w+\s*\{\s*([^,]+),", text):
            body, _ = group(text, text.index("{", match.start()))
            fields = {}
            for field in re.finditer(r"(\w+)\s*=\s*", body):
                pos = field.end()
                if pos < len(body) and body[pos] == "{":
                    fields[field[1].lower()] = group(body, pos)[0]
                elif pos < len(body) and body[pos] == '"':
                    fields[field[1].lower()] = body[pos + 1:body.find('"', pos + 1)]
            entries[match[1].strip()] = fields
        return entries

    def code(self, code, name):
        display = name.strip() or "example.cpp"
        digest = hashlib.sha256(code.encode()).hexdigest()[:8]
        filename = safe_name(display)
        if not re.search(r"\.[A-Za-z0-9]+$", filename):
            filename += ".txt"
        target = OUTPUT / "examples" / self.chapter / filename
        if target.exists() and target.read_text(encoding="utf-8") != code:
            target = target.with_name(target.stem + "-" + digest + target.suffix)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(code, encoding="utf-8")
        self.example_count += 1
        language = "cpp" if any(ext in display for ext in (".ino", ".h", ".cpp")) else "text"
        if display.endswith(".py"):
            language = "python"
        relative = target.relative_to(OUTPUT).as_posix()
        return self.block(f'```{language} title="{display.replace(chr(34), chr(39))}"\n{code.rstrip()}\n```\n\n[Download this example]({relative}){{ download }}')

    def image(self, path):
        source = (self.source / path).resolve()
        if not source.is_file():
            raise FileNotFoundError(source)
        relative = Path("assets") / source.relative_to(self.source)
        target = OUTPUT / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.suffix.lower() == ".pdf":
            target = target.with_suffix(".png")
            relative = relative.with_suffix(".png")
            pdf = pymupdf.open(source)
            pdf[0].get_pixmap(matrix=pymupdf.Matrix(2, 2)).save(target)
        else:
            shutil.copy2(source, target)
        self.images[path] = relative.as_posix()
        return self.block(f'![{plain(self.frame_title)}]({relative.as_posix()}){{ .lecture-figure loading=lazy }}')

    def diagram(self, match, frame_prefix):
        number = len(self.diagrams) + 1
        name = f"{self.chapter}-{number:03d}.png"
        # Definitions before a drawing may control its scale, labels or TikZ styles.
        context = self.figure_context
        for definition in re.finditer(r"\\(?:def\\[A-Za-z]+|pgfmathsetmacro|tikzset)\s*", frame_prefix):
            try:
                _, end = group(frame_prefix, definition.end())
                if "pgfmathsetmacro" in definition[0]:
                    _, end = group(frame_prefix, end)
                context += "\n" + frame_prefix[definition.start():end]
            except ValueError:
                pass
        self.diagrams.append({"name": name, "context": context, "tex": match[0], "title": plain(self.frame_title)})
        return self.block(f'![{plain(self.frame_title)}](assets/diagrams/{name}){{ .lecture-figure loading=lazy }}')

    def prepare_frame(self, body):
        # Protect literal C++ before touching LaTeX comments or commands.
        body = re.sub(r"\\begin\{arduino\}(?:\[([^\]]*)\])?\s*\n(.*?)\\end\{arduino\}",
                      lambda m: self.code(m[2], (re.search(r"file=([^,\]]+)", m[1] or "") or ["", "example.cpp"])[1]), body, flags=re.S)

        def external_code(args, option):
            path, first, last, label = args
            source = (self.source / path).read_text(encoding="utf-8").splitlines(keepends=True)
            return self.code("".join(source[int(first)-1:int(last)]), label)
        body = commands(body, "stateexamplecode", 4, external_code)
        original = body
        body = re.sub(r"\\begin\{(tikzpicture|circuitikz)\}.*?\\end\{\1\}",
                      lambda m: self.diagram(m, original[:m.start()]), body, flags=re.S)
        body = commands(body, "code", 1, lambda a, o: self.block("`" + self.unescape_code(a[0]).replace("`", "") + "`", inline=True))
        body = re.sub(r"(?<!\\)%[^\n]*", "", body)
        body = commands(body, "includegraphics", 1, lambda a, o: self.image(a[0]), optional=True)
        body = commands(body, "trysim", 2, lambda a, o: self.simulation(a[0], a[1]))
        body = commands(body, "answer", 1, lambda a, o: self.answer(a[0]))
        body = commands(body, "cite", 1, lambda a, o: "; ".join(self.citation(key.strip()) for key in a[0].split(",")))
        body = commands(body, "source", 1, lambda a, o: r"\par\textit{Sources: " + a[0] + "}\\par")
        for env, kind in (("infobox", "info"), ("warnbox", "warning"), ("tipbox", "tip"), ("notebox", "note"), ("exbox", "example")):
            begin = re.compile(r"\\begin\{" + env + r"\}(?:\[[^\]]*\])?\s*")
            cursor, chunks = 0, []
            for match in begin.finditer(body):
                title, end = group(body, match.end())
                chunks.extend((body[cursor:match.start()], r"\begin{quote}\textbf{EPBOX" + kind.upper() + ": " + (title or kind.title()) + r"}\par "))
                cursor = end
            body = "".join(chunks) + body[cursor:]
            body = body.replace(r"\end{" + env + "}", r"\end{quote}")
        body = re.sub(r"\\begin\{reslist\}\s*\{([^}]+)\}\s*\{[^}]+\}", r"\\subsubsection{\1}\\begin{itemize}", body)
        body = body.replace(r"\end{reslist}", r"\end{itemize}").replace(r"\resslot", "")
        body = body.replace(r"\begin{documents}", r"\begin{itemize}").replace(r"\end{documents}", r"\end{itemize}")
        for command in ("resitem", "docitem"):
            body = commands(body, command, 2, lambda a, o: r"\item\href{" + a[1] + "}{" + a[0] + "}")
        body = commands(body, "docref", 2, lambda a, o: r"\href{" + a[1] + "}{" + a[0] + "}")
        body = commands(body, "statcard", 2, lambda a, o: r"\par\textbf{" + a[0] + "}: " + a[1] + r"\par", optional=True)
        body = commands(body, "pinbadge", 1, lambda a, o: r"\texttt{" + a[0] + "}", optional=True)
        for command in ("hdr", "muted", "hl"):
            body = commands(body, command, 1, lambda a, o: r"\textbf{" + a[0] + "}")
        body = commands(body, "lvl", 1, lambda a, o: "")
        body = commands(body, "texorpdfstring", 2, lambda a, o: a[0])
        body = commands(body, "fitbox", 3, lambda a, o: a[2])
        body = commands(body, "resizebox", 3, lambda a, o: a[2])
        for command in ("textcolor", "colorbox"):
            body = commands(body, command, 2, lambda a, o: a[1])
        for command in ("column", "vspace", "hspace", "color", "setcounter", "addtocounter"):
            body = commands(body, command, 1 if command not in ("setcounter", "addtocounter") else 2, lambda a, o: "", optional=True)
        for command in ("setlength", "renewcommand", "fontsize"):
            body = commands(body, command, 2, lambda a, o: "")
        body = re.sub(r"\\begin\{(?:columns|twocols|center|tcolorbox)\}(?:\[[^\]]*\])?", "\n", body)
        body = re.sub(r"\\end\{(?:columns|twocols|center|tcolorbox)\}", "\n", body)
        body = re.sub(r"\\begin\{minipage\}(?:\[[^\]]*\])?\{[^}]*\}", "\n", body).replace(r"\end{minipage}", "\n")
        body = re.sub(r"\\(?:tiny|scriptsize|footnotesize|small|large|Large|normalsize|centering|raggedright|noindent|nexttwocol|begingroup|endgroup|selectfont)(?![A-Za-z])", "", body)
        body = re.sub(r"\\(?:uncover|only|visible)<[^>]*>", "", body)
        body = body.replace(r"\timertickslideincluded", "")
        body = re.sub(r"\\vspace\*?\{[^}]*\}|\\hspace\*?\{[^}]*\}", "", body)
        return body

    def unescape_code(self, text):
        text = text.replace(r"\textbackslash{}", "\\").replace(r"\textbackslash", "\\")
        return re.sub(r"\\([_{}%&#$])", r"\1", text).replace("~", " ")

    def inline_markdown(self, text):
        text = commands(text, "code", 1, lambda a, o: "`" + self.unescape_code(a[0]) + "`")
        for command, marker in (("textbf", "**"), ("texttt", "`"), ("textit", "*")):
            text = commands(text, command, 1, lambda a, o: marker + a[0] + marker)
        pieces = re.split(r"(\$[^\n$]*\$)", text)
        for index in range(0, len(pieces), 2):
            pieces[index] = (self.unescape_code(pieces[index]).replace(r"\par", "\n\n")
                             .replace(r"\qquad", " ").replace(r"\quad", " ")
                             .replace(r"\,", " ").replace(r"\ ", " ")
                             .replace(r"\dots{}", "…"))
        return "".join(pieces).strip()

    def citation(self, key):
        data = self.bibliography.get(key, {})
        label = data.get("shorttitle", data.get("title", key))
        return r"\href{references.md\#" + key.replace("_", "-") + "}{" + plain(label) + "}"

    def answer(self, text):
        content = self.inline_markdown(text)
        for key, value in self.blocks.items():
            if key in content:
                content = content.replace(key, value)
        html = markdown_renderer.markdown(content, extensions=["pymdownx.arithmatex"], extension_configs={"pymdownx.arithmatex": {"generic": True}})
        return self.block('<details class="lecture-answer"><summary>Check your answer</summary>' + html.replace("\n", " ") + '</details>')

    def dashboard_url(self, relative):
        app, _, query = relative.partition("?")
        return "../dashboard.md?lab=" + app + ("&" + query if query else "")

    def simulation(self, title, url):
        if "/web/" in url:
            relative = url.split("/web/", 1)[1]
            url = self.dashboard_url(relative)
        return self.block(f'[Try simulation: {plain(title)}]({url}){{ .md-button .lecture-simulation }}')

    def restore(self, text):
        # Block placeholders can sit within lists and quotes; keep their indentation.
        pattern = re.compile(r"^([ >\t]*)(EPPLACEHOLDER\d+)[ \t]*$", re.M)
        for _ in range(5):
            text = pattern.sub(lambda m: "\n".join(m[1] + line if line else m[1].rstrip() for line in self.blocks[m[2]].splitlines()), text)
            for key, value in self.blocks.items():
                if key in text:
                    text = text.replace(key, value)
        lines, result, i = text.splitlines(), [], 0
        while i < len(lines):
            match = re.match(r"> \*\*EPBOX([A-Z]+): (.*?)\*\*$", lines[i])
            if not match:
                result.append(lines[i]); i += 1; continue
            kind, title = match.groups()
            result.append(f'!!! {kind.lower()} "{plain(title).replace(chr(34), chr(39))}"')
            i += 1
            while i < len(lines) and lines[i].startswith(">"):
                result.append("    " + re.sub(r"^> ?", "", lines[i])); i += 1
            result.append("")
        return "\n".join(result).strip() + "\n"

    def chapter_page(self, slug):
        self.chapter = slug
        text = self.expand(self.source / "chapters" / (slug + ".tex"))
        section = re.search(r"\\section\{([^}]+)\}", text)
        title = plain(section[1]) if section else slug.replace("-", " ").title()
        frames, positions, cursor = [], [], 0
        # Global drawing styles in between slides also apply to standalone figures.
        outside = re.sub(r"\\begin\{frame\}.*?\\end\{frame\}", "", text, flags=re.S)
        self.figure_context = ""
        for match in re.finditer(r"\\(?:tikzset|newcommand)\b", outside):
            try:
                if "newcommand" in match[0]:
                    _, end = group(outside, match.end())
                    while end < len(outside) and outside[end].isspace(): end += 1
                    while end < len(outside) and outside[end] == "[":
                        _, end = group(outside, end, "[", "]")
                    _, end = group(outside, end)
                    self.figure_context += outside[match.start():end] + "\n"
                    continue
                _, end = group(outside, match.end())
                self.figure_context += outside[match.start():end] + "\n"
            except ValueError:
                pass
        while match := FRAME.search(text, cursor):
            frame_title, start = group(text, match.end() - 1)
            end = text.index(r"\end{frame}", start)
            self.frame_title = frame_title
            body = self.prepare_frame(text[start:end])
            frames.append(r"\subsection{" + plain(frame_title).replace("&", r"\&") + "}\n" + body)
            positions.append(plain(frame_title))
            cursor = end + len(r"\end{frame}")
        latex = "\n\n".join(frames)
        ast = json.loads(pypandoc.convert_text(latex, "json", format="latex"))
        def inspect(node):
            if isinstance(node, dict):
                if node.get("t") in ("RawInline", "RawBlock") and node.get("c", [None])[0] in ("latex", "tex"):
                    self.raw.append({"chapter": slug, "raw": node["c"][1]})
                for value in node.values(): inspect(value)
            elif isinstance(node, list):
                for value in node: inspect(value)
        inspect(ast)
        markdown = pypandoc.convert_text(json.dumps(ast), "gfm+tex_math_dollars-tex_math_gfm", format="json", extra_args=["--wrap=none", "--markdown-headings=atx"])
        markdown = normalize_line_breaks(self.restore(markdown))
        markdown = re.sub(r"^### [^\n]+\n(?:\s*\n)*(?=#+ |\Z)", "", markdown, flags=re.M)
        markdown = re.sub(r"https://costawess.github.io/Programming-Dashboard/web/([^\s)]+)", lambda m: self.dashboard_url(m[1]), markdown)
        for old, new in (("previous slide", "previous section"), ("next slides", "following sections"), ("next slide", "next section")):
            markdown = markdown.replace(old, new)
        project_folder = {"state-machines": "state-machines", "timing-interrupts": "timers", "spi-logic-analyzer": "logic-analyzer"}.get(slug)
        if project_folder:
            markdown += "\n## Complete project sketches\n\n"
            for sketch in sorted((self.source / "examples" / project_folder).rglob("*.ino")):
                relative = Path("examples/projects") / sketch.relative_to(self.source / "examples")
                target = OUTPUT / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(sketch, target)
                markdown += f"- [{sketch.stem.replace('-', ' ').title()}]({relative.as_posix()}){{ download }}\n"
        page = f'---\ntitle: "{title.replace(chr(34), chr(39))}"\n---\n\n# {title}\n\n' + markdown
        (OUTPUT / (slug + ".md")).write_text(page, encoding="utf-8")
        self.coverage.append({"slug": slug, "title": title, "sections": positions})
        print(f"Imported {slug}: {len(frames)} sections", flush=True)

    def references(self):
        parts = ["# References", "Sources cited throughout the lecture material."]
        for key, data in self.bibliography.items():
            title = plain(data.get("title", key))
            url = data.get("url")
            parts.append(f'## {title} {{ #{key.replace("_", "-")} }}')
            if data.get("author"): parts.append(plain(data["author"]))
            if data.get("year"): parts.append(data["year"])
            if url: parts.append(f"[{title}]({url})")
            if data.get("note"): parts.append(plain(data["note"]))
        (OUTPUT / "references.md").write_text("\n\n".join(parts) + "\n", encoding="utf-8")

    def render_diagrams(self):
        destination = OUTPUT / "assets/diagrams"
        destination.mkdir(parents=True, exist_ok=True)
        tex = [r"\documentclass[aspectratio=169]{beamer}", r"\input{config/electronics-theme}", r"\input{config/esp32-preamble}",
               r"\setbeamertemplate{background}{}", r"\setbeamertemplate{background canvas}{}", r"\setbeamertemplate{headline}{}", r"\setbeamertemplate{footline}{}", r"\setbeamertemplate{navigation symbols}{}", r"\begin{document}"]
        for i, diagram in enumerate(self.diagrams):
            tex.extend([f"\\typeout{{EPDIAGRAM:{i}:{diagram['name']}}}", r"\begin{frame}[plain,fragile]\centering", diagram["context"], diagram["tex"], r"\end{frame}"])
        tex.append(r"\end{document}")
        path = WORK / "lecture-diagrams.tex"
        path.write_text("\n".join(tex), encoding="utf-8")
        result = subprocess.run(["pdflatex", "-disable-installer", "-interaction=nonstopmode", "-halt-on-error", f"-output-directory={WORK}", str(path)], cwd=self.source, capture_output=True, timeout=180)
        (WORK / "diagram-build.log").write_bytes(result.stdout + result.stderr)
        if result.returncode:
            raise RuntimeError("Diagram compilation failed: " + result.stdout.decode(errors="replace")[-3500:])
        pdf = pymupdf.open(WORK / "lecture-diagrams.pdf")
        if len(pdf) != len(self.diagrams):
            raise RuntimeError(f"Expected {len(self.diagrams)} drawings, got {len(pdf)} PDF pages")
        for page, diagram in zip(pdf, self.diagrams):
            pix = page.get_pixmap(matrix=pymupdf.Matrix(2.5, 2.5), alpha=False)
            samples = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
            ys, xs = np.where(np.any(samples[:, :, :3] < 242, axis=2))
            if len(xs):
                clip = pymupdf.Rect(max(0, xs.min()/2.5-5), max(0, ys.min()/2.5-5), min(page.rect.width, xs.max()/2.5+5), min(page.rect.height, ys.max()/2.5+5))
                page.get_pixmap(matrix=pymupdf.Matrix(2.5, 2.5), clip=clip).save(destination / diagram["name"])
        print(f"Rendered {len(self.diagrams)} diagrams", flush=True)

    def run(self):
        OUTPUT.mkdir(parents=True, exist_ok=True)
        WORK.mkdir(parents=True, exist_ok=True)
        main = (self.source / "esp32-arduino.tex").read_text(encoding="utf-8")
        chapters = re.findall(r"^\\input\{chapters/([^/}]+)\}", main, re.M)
        for slug in chapters:
            if slug not in ("opening", "closing", "references"):
                self.chapter_page(slug)
        self.references()
        (WORK / "audit.json").write_text(json.dumps({"coverage": self.coverage, "raw_latex": self.raw, "diagrams": self.diagrams, "examples": self.example_count}, indent=2, ensure_ascii=False), encoding="utf-8")
        manifest = {"chapters": [{"slug": c["slug"], "title": c["title"], "sections": len(c["sections"])} for c in self.coverage],
                    "total_sections": sum(len(c["sections"]) for c in self.coverage), "diagram_count": len(self.diagrams),
                    "code_example_count": self.example_count, "unconverted_latex_count": len(self.raw)}
        (ROOT / "tools/lecture-import-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if self.raw:
            raise RuntimeError("Unconverted LaTeX remains; inspect artifacts/lecture-import/audit.json before publishing.")
        self.render_diagrams()
        print(f"Done: {len(self.coverage)} chapters, {sum(len(c['sections']) for c in self.coverage)} sections, {self.example_count} code examples. Raw LaTeX items for review: {len(self.raw)}", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    Importer(parser.parse_args().source).run()
