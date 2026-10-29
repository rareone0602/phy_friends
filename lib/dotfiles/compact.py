#!/usr/bin/env python3
"""Apply only the shared Claude Code and Codex compaction defaults."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil

LIMIT = 400000


def save(path, content):
    """Keep the original once and write only when the content changes."""
    if path.exists() and path.read_text() == content:
        return
    backup = path.with_name(path.name + '.before-compaction')
    if path.exists() and not backup.exists():
        shutil.copy2(path, backup)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def apply(home):
    """Preserve unrelated settings, credentials, and model context limits."""
    claude = Path(os.environ.get('CLAUDE_CONFIG_DIR', str(home / '.claude'))) / 'settings.json'
    codex = Path(os.environ.get('CODEX_HOME', str(home / '.codex'))) / 'config.toml'
    settings = json.loads(claude.read_text()) if claude.exists() else {}
    for key in ('CLAUDE_CODE_AUTO_COMPACT_WINDOW', 'CLAUDE_AUTOCOMPACT_PCT_OVERRIDE'):
        if key in os.environ or key in settings.get('env', {}):
            raise ValueError('Resolve the overriding compaction environment variable first: ' + key)
    settings['autoCompactWindow'] = LIMIT
    for model in settings.get('modelSettings', {}).values():
        if 'autoCompactWindow' in model:
            model['autoCompactWindow'] = LIMIT
    text = codex.read_text() if codex.exists() else ''
    # Only the root table defines the user default; preserve all nested tables.
    boundary = re.search(r'^\s*\[', text, re.MULTILINE)
    index = boundary.start() if boundary else len(text)
    root, tables = text[:index], text[index:]
    setting = 'model_auto_compact_token_limit = ' + str(LIMIT)
    pattern = r'^model_auto_compact_token_limit\s*=.*$'
    if re.search(pattern, root, re.MULTILINE):
        root = re.sub(pattern, setting, root, flags=re.MULTILINE)
    else:
        root = setting + '\n' + root
    # Prepare both outputs before writing either one.
    save(claude, json.dumps(settings, indent=2) + '\n')
    save(codex, root + tables)
    print('Claude Code: autoCompactWindow = ' + str(LIMIT))
    print('Codex: model_auto_compact_token_limit = ' + str(LIMIT))
    print('Restart existing agent sessions to load the defaults.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--home', type=Path, default=Path.home())
    args = parser.parse_args()
    apply(args.home)
