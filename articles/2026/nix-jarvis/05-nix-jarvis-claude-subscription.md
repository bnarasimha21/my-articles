# Nix and Jarvis: How I Built My Personal AI Around One Claude Subscription

*Published: May 13, 2026*

---

I have wanted an AI assistant that is genuinely always-on. Not a chat window I open when I need help, but something I can ping from anywhere and that already knows what I am working on.

The straightforward path is to wire it to an API and pay per token. That works for an hour of usage. It does not work for a real always-on setup. The token bill becomes the bottleneck before the assistant becomes useful.

So I built mine on top of a single Claude subscription. Two assistants, one flat monthly cost, no per-token meter running in the background.

---

## What I actually have

Two assistants, two different interfaces, sharing one brain.

**Nix** lives on my phone. When I message my Telegram bot, Nix replies. It runs as a Claude Code session inside a tmux window on my Mac Mini, kept alive by a Launch Agent. The session has memory files, my GitHub repos under `~/Documents/MyGitHub`, my career-ops folder, and a Telegram plugin that streams messages in and out.

**Jarvis** lives on my Mac. It is a small web dashboard at `localhost:3737` with a floating microphone orb. I say "Hey Jarvis", it listens, answers in voice, and shows the response in a chat panel. It can pull up my calendar, search Gmail, summarise GitHub activity, and read out reminders.

Both of them are built on the same underlying engine. They just have different jobs.

---

## The trick: subscription as the engine

Most personal AI setups have a hard choice baked in. Use the API and pay per million tokens. Or use the chat app and accept that it is not callable from your code.

There is a third path. Claude Code is a CLI, and `claude -p` is a non-interactive mode that runs a prompt and returns a result. The CLI authenticates against the Claude subscription. That means I can call Claude from any script, any background process, any Telegram bot, and the cost is flat. I pay for the subscription. The CLI is the gateway.

That single observation drives the whole setup.

Nix is a Claude Code session that never quits. Jarvis spawns `claude -p` as a subprocess when it needs heavy lifting. Both routes pay the subscription, not per-token fees.

---

## How the two pieces fit together

Picture it like this:

```
Phone (Telegram) ────► tmux session ──► Claude Code (Nix)
                                          │
                                          ▼
                                  memory + brain + skills

Mac browser ──► Jarvis dashboard ──► Voice STT
                                  ├─► Claude API (short replies, low tokens)
                                  └─► claude -p subprocess (heavy lifting)
                                        │
                                        ▼
                                  same engine, subscription-priced
```

The split is deliberate. Jarvis's voice replies use the Anthropic API directly because speed matters when you are mid-sentence. A short reply is cheap. Heavy tasks like "draft a tailored CV from this job posting" or "go fix that bug in my repo" get delegated to `claude -p` because they would burn through API credits otherwise.

Voice replies feel snappy. Background work runs without watching a meter.

---

## What makes this work in practice

Three pieces that took longer than I expected.

**Persistence.** A Claude Code session has to stay alive between messages or the assistant has no continuity. I run mine in tmux, supervised by a Launch Agent. If the session crashes, the Launch Agent restarts it. If my Mac reboots, tmux comes up at login and the bot reconnects. The bot itself is a small bun server that talks to the Telegram Bot API and pipes messages into the Claude Code session.

**Memory.** A subscription-powered assistant is only as useful as what it remembers between conversations. I keep two memory layers. Short-term is a chat logger that writes every message to a SQLite file, so a session restart does not lose this morning's context. Long-term is a folder of memory files I trust the model to read on each session start. Names, preferences, project state, things I have decided. The files are plain Markdown and I can read them too.

**A personal knowledge base.** I built a small tool called Narsi-Brain that ingests my Telegram chats and GitHub repos every ten minutes and stores them in a vector database. Whenever I ask Nix "what was the status of project X?", a hook intercepts my prompt and adds the most relevant snippets from past conversations to the context. It costs nothing extra. The brain is local. The relevance work is a tiny embedding model, not a Claude call.

The combined effect is that Nix can answer "what did we decide about the openflow rubric last week?" without me having to find the chat.

---

## What this costs

The flat Claude subscription is the only Claude-side cost. Outside that, I pay for:

→ OpenAI's text-to-speech for Jarvis's voice replies (a few cents per long session)
→ A small Anthropic API balance for Jarvis's short voice replies (less than a dollar a month at my usage)
→ A cheap DigitalOcean droplet that hosts other agents I run separately

The two AI personalities cost me less per month than running a single chat app via API would. The trade is that I had to build the plumbing once. It was a long Saturday.

---

## What it is not

Honesty matters here.

This is not a magical unlimited setup. Claude Code has its own rate limits per subscription tier. If I tried to drive a hundred concurrent tasks through it, I would hit those limits. For one person with a phone and a laptop, the headroom is large.

This is also not isolated from Claude's terms. The subscription is for personal Claude Code usage. I am not reselling it, exposing it to the public internet, or proxying queries for other people. Nix and Jarvis are tools for me. That distinction matters and it is the basis for the setup being acceptable.

Lastly, the assistant is only as good as the memory and prompts I give it. The setup is the easy half. The discipline of writing useful memory files, scoping prompts, and pruning stale context is the rest of the work. I am still iterating on that.

---

## Why it matters

Most people I talk to assume that running a personal AI 24/7 means paying through the nose for tokens. That is the default mental model and it pushes the goalposts to "only when I have a specific question."

A subscription-powered setup flips it. The assistant runs all the time, watches my work, holds context across sessions, and does not penalise me for using it more. That changes the kind of question I think to ask. I no longer hesitate to ping Nix with "what is on my plate this week?" because the answer is free at the margin.

The leverage is not in any one feature. It is in removing the token-counter from my head.

---

## Where to start if you want to copy the idea

You do not need both pieces on day one. If I were starting over, I would do this in three steps.

First, get Claude Code installed and learn `claude -p`. Run a few prompts from your terminal. Get comfortable with the idea that the CLI is the gateway, not the chat UI.

Second, pick one interface that you already live in. Telegram, Slack, Discord, your shell. Wire that to a `claude -p` call. You now have an always-on assistant.

Third, add memory. A folder of Markdown files the assistant reads on each start. A logger that captures the conversation. That is enough to feel different from a stateless chat app.

Voice and dashboards are nice-to-haves. The first two steps are the unlock.

---

*If you want the technical details on any one piece (the tmux + Launch Agent setup, the Telegram bot, the memory pattern, the Narsi-Brain ingest pipeline), let me know in the comments and I will write that one up next.*

#ai #claude #personalassistant #automation #buildinpublic
