# Nix: My Always-On AI That Runs on One Claude Subscription

---

The only difference between us and Tony Stark is that he had unlimited tokens.

Everyone who has watched Iron Man has pictured having a Jarvis. Today's models can do the thinking half of that. The thing in the way is not the intelligence. It is the cost of using them constantly. What I ended up with is Nix, my personal assistant, running on one Claude subscription.

---

## A short history of trying

I was one of the earliest users of OpenClaw. For a while I had it wired to my Claude subscription, which gave me what felt like the closest thing to Jarvis I had ever used. It was close, but not quite. I was sending voice messages over Telegram, not having a real conversation. Then Anthropic announced that the subscription could not be used with third-party agent frameworks. I lost the setup overnight.

I switched to Claude Code's own channels plugin system. It needed a lot of plumbing. But it worked. The constraints were what they were, and I could build inside them.

So I built Nix.

---

## What Nix can do

Search the web. Read and reply to email. Manage my calendar. Control a browser — navigate, click, fill forms, take screenshots. Read and write files on my Mac. Write code, edit files, open pull requests on GitHub. Read and update Notion pages. Have a voice conversation on my Mac. Answer on my phone over Telegram.

All of that. One assistant. One subscription.

---

## The two things that make it work

Most personal AI setups fail at one of two things: cost or continuity.

**Cost:** Nix runs on a flat Claude subscription, not API calls. No per-token meter. No surprise bill at month-end. For one person, the headroom is large. That is the part that makes it sustainable.

**Continuity:** Nix reads from the same memory files across every surface. The same identity, the same project state, the same logged conversations. When I ping Nix from Telegram on the train, and open the voice dashboard at my desk an hour later, Nix already knows what we talked about. Not because the surfaces are talking to each other. Because they are both reading the same files.

There is one "me" written down on disk. Any surface I open picks up exactly where the last one left off.

The memory layer is just Markdown files in a known folder, plus a SQLite log of every Telegram message:

```
~/.claude/projects/<project>/memory/
├── MEMORY.md                      # one-line index of everything below
├── user_preferences.md            # who I am, how I work
├── project_<name>.md              # state of an ongoing project
└── feedback_<topic>.md            # corrections I have given over time
```

The model reads these on each session start. New decisions get added as new files. Old facts get removed. Over months it becomes a real picture of me, written by me and the assistant together.

---

## Two surfaces, one Nix

The phone half is a small bun server that talks to the Telegram Bot API. Inbound messages get piped to a Claude session. Outbound replies go back to Telegram. About a hundred lines of code.

The Mac half is a web dashboard at `localhost:3737` with a floating microphone orb. The wake word is "Hey Nix". I talk, the browser does speech-to-text, sends the text to a local endpoint, and the response comes back as text plus voice.

Different surfaces, different interaction styles. But the same Nix, the same engine, the same memory underneath.

---

## The technical core

Three things make the whole setup work reliably.

**One long-running session.** Claude Code can run as a non-interactive command. By giving the same session ID on every call, I keep the assistant continuous instead of starting from scratch each time:

```bash
# first turn — seed a session
claude -p "Hi, you are Nix" --session-id 9f2b...  --output-format json

# every subsequent turn — resume that session
claude --resume 9f2b... -p "what is on my plate today?" --output-format json
```

Resuming means I do not re-pay the system prompt and history on every call. Across a day, this is the difference between a chatty assistant and an unusable one.

**tmux to make the session resilient.** I run Nix inside a named tmux window. If my terminal closes, my screen sleeps, the session is unaffected:

```bash
tmux new-session -d -s nix
tmux send-keys -t nix "claude" Enter
```

**A LaunchAgent so it survives reboots.** macOS reboots, the Mac sleeps. A LaunchAgent makes sure the tmux session and the Telegram bot come back automatically:

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

Drop the plist in `~/Library/LaunchAgents`, `launchctl bootstrap` it, done.

---

## What this costs

The flat Claude subscription is the only cost. No API keys. No per-token billing.

Outside that:

→ Google's text-to-speech for Nix's voice replies, free up to 1 million characters a month, which covers almost everything I throw at it

That is it. No per-token meter. No surprise bill at month-end. The trade is that I had to build the plumbing once. It was a long Saturday.

---

## What it is not

One thing before anything else: this is for personal use only. The Claude subscription is not meant for commercial applications or multi-user products.

Honesty matters here.

This is not a magical unlimited setup. Claude Code has its own rate limits per subscription tier. If I tried to drive a hundred concurrent tasks through it, I would hit those limits. For one person with a phone and a laptop, the headroom is large.

Lastly, the assistant is only as good as the memory and prompts I give it. The setup is the easy half. The discipline of writing useful memory files, scoping prompts, and pruning stale context is the rest of the work.

---

## Why it matters

Most people I talk to assume that running a personal AI 24/7 means paying through the nose for tokens. That mental model makes you hesitate. You only ask when you really have to.

A subscription-powered setup flips it. The assistant runs all the time, holds context across sessions, and does not penalise me for using it more. I use it the way I use Google Search — constantly, without thinking about cost. Morning briefings, quick questions, long coding sessions, browser automation. It is just there.

The leverage is not in any one feature. It is in removing the token-counter from my head.

---

## Where to start if you want to copy the idea

You do not need every piece on day one. If I were starting over, I would do this in three steps.

First, get Claude Code installed and learn `claude -p` with `--session-id` and `--resume`. Run a few prompts from your terminal until the idea of "one session, many turns" feels natural.

Second, pick one interface you already live in. Telegram, Slack, Discord, your shell. Wire that to the resumable session. You now have an always-on assistant.

Third, add memory. A folder of Markdown files the assistant reads on each start, plus a logger that captures the conversation. That alone is what makes it feel different from a stateless chat app.

Voice is not a nice-to-have. It is what makes it feel like Jarvis. The moment I stopped typing and started talking, everything changed. I ask, I watch it happen. Calendar checked, code written, files created. That feedback loop is what makes this worth building.

---

*If you want the technical details on any one piece (the tmux + LaunchAgent setup, the Telegram bot, the memory pattern, the voice surface), let me know in the comments and I will write that one up next.*

---

Three months ago I was sending voice notes to a bot. Today I have a conversation with an assistant that knows my projects, reads my email, controls my browser, and costs me nothing extra per question. That gap is what this article is about.

#ai #claude #personalassistant #automation #buildinpublic
