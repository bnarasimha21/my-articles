# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Content-only repository of articles and posts originally published on LinkedIn and X/Twitter. No build tools, tests, or dependencies — just Markdown files and metadata.

## Structure

- `articles/<year>/<project>/<slug>.md` — Article source content in Markdown
- `articles/<year>/<project>/<slug>-linkedin.txt` — LinkedIn copy-paste version
- `articles/<year>/<project>/<slug>-x-article.txt` — X article copy-paste version
- `metadata.json` — Central index of all articles (title, date, tags, status, source)
- `README.md` — Auto-maintained table of articles (keep in sync with metadata.json)

## Conventions

- Article filenames: `NN-slug-name.md` (zero-padded sequence number per year)
- Articles without `"status"` in metadata.json are published; drafts have `"status": "draft"`
- README table: published = ✓, drafts = 📝 Draft
- When adding/updating an article, update both `metadata.json` and the README table

---

## Article Writing Guidelines

## LinkedIn Formatting Rules

When preparing articles for LinkedIn, follow these rules:

### What LinkedIn DOES NOT support:
- Markdown headers (# ## ###)
- Code blocks (```)
- Tables
- Hyperlinked text [text](url)
- Bold/italic markdown syntax

### What LinkedIn DOES support:
- Plain text
- Line breaks (use liberally)
- Bullet points (• or -)
- Arrows (→)
- Emojis (great for section headers)
- Em dashes (—) for section breaks
- Hashtags at the end

### LinkedIn Formatting Pattern:

```
Title (plain text, no #)

Opening hook (2-3 sentences max)

—

🎯 Section Header (emoji + text, no markdown)

Short paragraph (2-3 sentences).

Key points:
→ Point one
→ Point two
→ Point three

—

#hashtag1 #hashtag2 #hashtag3
```

### LinkedIn Style:
1. Keep paragraphs SHORT (2-3 sentences max)
2. Use line breaks between paragraphs
3. Use — (em dash) as section dividers
4. Start sections with relevant emoji
5. Use → for lists instead of bullets when showing flow
6. End with 3-6 relevant hashtags
7. No em dashes within sentences (Narsi's preference)
8. Professional but conversational tone

---

## X Article Formatting Rules

X articles are long-form posts. Different from LinkedIn:

### What X articles DOES NOT support:
- Markdown of any kind
- Emojis as section headers (too LinkedIn-ish)
- Em dash dividers
- Hashtags (unless very minimal)

### What X articles DOES support:
- Plain text
- Line breaks
- Simple, clean formatting

### X Article Formatting Pattern:

```
Title

Opening hook (punchy, direct)


Section Header (plain text, extra line break above)

Short paragraphs. One to two sentences each.

Even shorter than LinkedIn. More whitespace.


Next Section

Continue with minimal formatting.

Let the writing breathe.


Conclusion

End with clear takeaway or CTA.
No hashtags unless really necessary.
```

### X Article Style:
1. Even shorter paragraphs than LinkedIn (1-2 sentences)
2. More whitespace (double line breaks between sections)
3. Plain text headers (no emoji, no formatting)
4. Punchy, casual tone
5. No hashtags (or 1-2 max, only if relevant)
6. No em dashes anywhere
7. More conversational than LinkedIn
8. Get to the point faster

### Key Differences from LinkedIn:
| LinkedIn | X Article |
|----------|-----------|
| 🎯 Emoji headers | Plain text headers |
| — dividers | Extra line breaks |
| 3-6 hashtags | None or minimal |
| Professional tone | Casual tone |
| Structured sections | Flowing narrative |

---

## File Naming Convention

For each article, create these versions:

| File | Purpose |
|------|---------|
| `XX-article-name.md` | Source (full markdown) |
| `XX-article-name-linkedin.txt` | LinkedIn copy-paste |
| `XX-article-name-x-article.txt` | X article copy-paste |

---

## Workflow

1. Write article in markdown (for GitHub/blog)
2. Create `-linkedin.txt` version (emojis, dividers, hashtags)
3. Create `-x-article.txt` version (plain, minimal, punchy)
4. User can copy-paste directly to each platform
