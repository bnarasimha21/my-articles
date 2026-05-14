# Nix: How I Built My Personal AI Around One Claude Subscription

*Published: May 13, 2026*

---

The only difference between us and Tony Stark is that he had unlimited tokens.

Everyone who has watched Iron Man has at some point pictured what it would be like to have a Jarvis. An assistant that is always there, knows everything about you, takes actions on your behalf, talks to you like a person. Today's models can absolutely do that. The thing in the way is not the intelligence. It is the meter ticking every time you use them.

I have been chipping away at this problem for over a year. What I ended up with is Nix, my personal assistant, running on one Claude subscription. This is how it got there.

---

## A short history of trying

I was one of the earliest users of OpenClaw. For a while I had it wired to my Claude subscription, which gave me what felt like the closest thing to Jarvis I had ever used. Then Anthropic announced that the subscription could not be used with third-party agent frameworks. I lost the setup overnight.

I switched to Claude Code's own channels plugin system. It needed a lot of plumbing. But it worked. The constraints were what they were, and I could build inside them.

So I built Nix.

Nix is my personal assistant. Voice-first on my Mac, available on my phone over Telegram. It answers questions and it takes actions. Web search, my email, my calendar, scoped folders on my file system, my GitHub. It can create files, edit files, write code, open pull requests. I talk to it the way I would talk to a smart engineer who already knows what I am working on.

The whole thing runs on one Claude subscription. That is the part that makes it sustainable.

---

## How it is different from other solutions

There are plenty of personal-AI products out there. Here is where Nix lands differently.

→ **Voice-first conversation, not voice notes.** I do not record a message, send it, and wait for a reply. I talk, it answers, we have a conversation. The feedback loop is human.

→ **Claude subscription, no per-token meter.** Not API calls. Not OpenClaw or any other third-party harness. Just the standard Claude subscription doing the work.

→ **Same assistant on mobile and Mac.** Same memory, same identity, same project state. Pinging it from Telegram on the train and asking it at my desk an hour later are continuous, not separate.

→ **Runs on my own Mac.** No vendor's cloud agent in between. The files are mine, the runtime is mine, the credentials never leave.

---

## The technical core

The whole setup turns on three properties: one long-running Claude Code session, tmux to make it survive disconnects, and a LaunchAgent to make it survive reboots.

**One long-running session.** Claude Code can run as a non-interactive command that returns a result. By giving the same session ID on every call, I keep the assistant continuous instead of starting from scratch each time:

```bash
# first turn — seed a session
claude -p "Hi, you are Nix" --session-id 9f2b...  --output-format json

# every subsequent turn — resume that session
claude --resume 9f2b... -p "what is on my plate today?" --output-format json
```

Resuming means I do not re-pay the system prompt and history on every call. Across a day, this is the difference between a chatty assistant and an unusable one.

**tmux to make the session resilient.** I run Nix's primary session inside a named tmux window. If my terminal closes, my SSH dies, my screen sleeps, the session is unaffected:

```bash
# start (or attach to) the Nix tmux window
tmux new-session -d -s nix
tmux send-keys -t nix "claude" Enter
```

Anything that needs to talk to Nix sends input into this tmux pane. The Telegram bot pipes messages in, reads replies out, and forwards them.

**A LaunchAgent so it survives reboots.** macOS reboots, the Mac sleeps, the network blips. A LaunchAgent makes sure the tmux session and the Telegram bot come back automatically:

```xml
<key>Label</key><string>io.narsi.nix</string>
<key>ProgramArguments</key>
<array>
  <string>/bin/bash</string>
  <string>-lc</string>
  <string>tmux new-session -d -s nix 'claude'</string>
</array>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
```

Drop the plist in `~/Library/LaunchAgents`, `launchctl bootstrap` it, done. The assistant is now genuinely always-on without anything more than my Mac being on.

---

## Two surfaces, one Nix

The phone half is a small bun server that talks to the Telegram Bot API. Inbound messages get piped to the tmux session. Outbound replies go back to Telegram. About a hundred lines of code.

The Mac half is a web dashboard at `localhost:3737` with a floating microphone orb. The wake word is "Hey Nix". I press it, talk, the browser does speech-to-text in the page, sends the text to a local endpoint that runs a fresh `claude -p` subprocess, and the response comes back as text plus voice.

Different surfaces, different interaction styles — but the same Nix, the same engine, the same memory underneath.

---

## One brain, two surfaces

The deeper trick is not the subscription. It is that Nix reads from the same memory files across every surface — the same identity, the same project state, the same logged conversations.

When I ping Nix from Telegram on the train, and later open the voice dashboard at my desk an hour later, Nix already knows what we just talked about. Not because the surfaces are talking to each other. Because they are both reading the same files. There is one "me" written down on disk, and any surface I open picks up exactly where the last one left off.

The memory layer is just Markdown files in a known folder, plus a SQLite log of every Telegram message:

```
~/.claude/projects/<project>/memory/
├── MEMORY.md                      # one-line index of everything below
├── user_preferences.md            # who I am, how I work
├── project_<name>.md              # state of an ongoing project
└── feedback_<topic>.md            # corrections I have given over time
```

The model reads these on each session start. New decisions get added as new files. Old facts that no longer hold get removed. Over months it becomes a real picture of me, written by me and by the assistant together.

---

## What this costs

The flat Claude subscription is the only Claude-side cost.

Outside that, I pay for:

→ OpenAI's text-to-speech for Nix's voice replies, a few cents per long session
→ A cheap DigitalOcean droplet that hosts other agents I run separately

That is it. No per-token meter. No surprise bill at month-end. The trade is that I had to build the plumbing once. It was a long Saturday.

---

## What it is not

Honesty matters here.

This is not a magical unlimited setup. Claude Code has its own rate limits per subscription tier. If I tried to drive a hundred concurrent tasks through it, I would hit those limits. For one person with a phone and a laptop, the headroom is large.

This is also not a workaround for Claude's terms. The subscription is for personal Claude Code usage. I am not reselling it, exposing it to the public internet, or proxying queries for other people. Nix is a tool for me. That distinction matters.

Lastly, the assistant is only as good as the memory and prompts I give it. The setup is the easy half. The discipline of writing useful memory files, scoping prompts, and pruning stale context is the rest of the work.

---

## Why it matters

Most people I talk to assume that running a personal AI 24/7 means paying through the nose for tokens. That mental model pushes the goalposts to "only when I have a specific question."

A subscription-powered setup flips it. The assistant runs all the time, watches my work, holds context across sessions, and does not penalise me for using it more. That changes the kind of question I think to ask. I no longer hesitate to ping Nix with "what is on my plate this week" because the answer is free at the margin.

The leverage is not in any one feature. It is in removing the token-counter from my head.

---

## Where to start if you want to copy the idea

You do not need every piece on day one. If I were starting over, I would do this in three steps.

First, get Claude Code installed and learn `claude -p` with `--session-id` and `--resume`. Run a few prompts from your terminal until the idea of "one session, many turns" feels natural.

Second, pick one interface you already live in. Telegram, Slack, Discord, your shell. Wire that to the resumable session. You now have an always-on assistant.

Third, add memory. A folder of Markdown files the assistant reads on each start, plus a logger that captures the conversation. That alone is what makes it feel different from a stateless chat app.

Voice and dashboards are nice-to-haves. The first two steps are the unlock.

---

*If you want the technical details on any one piece (the tmux + LaunchAgent setup, the Telegram bot, the memory pattern, the voice surface), let me know in the comments and I will write that one up next.*

#ai #claude #personalassistant #automation #buildinpublic
