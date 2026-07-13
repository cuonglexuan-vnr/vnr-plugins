# vnr-sa — VNR Solution Architect toolkit

A Claude Code plugin for the Solution Architect role, distributed via the `vnr-ai`
marketplace. It starts with one skill and will grow more SA workflows over time.

## Skills

| Skill | Purpose |
|-------|---------|
| `/vnr-md2docx` | Convert a VNR playbook Markdown document into a branded Word `.docx` deliverable (cover, revision/approval history, auto TOC, numbered headings, captioned tables, header/footer). |

## Install

Install into your Deliverables repo (project scope):

```bash
npx github:cuonglexuan-vnr/vnr-plugins init vnr-sa
```

or, from a local checkout of this marketplace:

```bash
claude plugin marketplace add <path-to-vnr-ai>
claude plugin install vnr-sa
```

## Requirements

- Python 3 with `python-docx` (`pip install python-docx`; the `/vnr-md2docx` wrappers auto-install it).
- Run inside the Deliverables repo — `/vnr-md2docx` uses its `templates/word/` brand template.
