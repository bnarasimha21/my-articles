# Nix: Always On, Always Aware: How I Built My Personal AI

---

The next wave of AI isn't a better chatbot. It's agents you talk to. Always on, always aware of your world, able to actually do things. I built mine. Here's what it took.

I was one of the earliest users of OpenClaw. For a while I had it wired to my Claude subscription and it worked well. When that path closed, I took it as a reason to start from scratch, rebuilding on top of Claude Code as the engine and designing something properly.

That's Nix. It runs on my Mac as a native app, voice-activated and always listening. It's also a Telegram bot on my phone. Both surfaces share the same memory, the same context, the same Nix.

---

## What Nix can do

**Talks to me.** Voice on the Mac, Telegram on the phone.

**Knows my world.** Reads and replies to email, manages my calendar, moves reminders around when plans change, and reads and updates Notion pages. It knows what's on today without me having to look.

**Acts on my Mac.** Controls a browser (navigate, click, fill forms, take screenshots), reads and writes files, writes code, opens pull requests on GitHub.

One assistant. Two surfaces. Same memory underneath.

---

## What makes it actually useful

Most personal AI setups are still just a chat window. You open it, ask something, and close it. The assistant has no idea what you did yesterday, what's on your calendar, or what you were building last week. And it certainly can't open a browser and do something for you.

Nix is different in three ways.

**Always on.** Nix is not an app I open. It is a process that is already running. The voice orb sits on my screen. The Telegram bot is awake on my phone. There is no cold start, no "let me catch you up on context". When I have a question, I ask it. When I have a thing to do, I say it.

**Shared memory across surfaces.** Nix reads from the same memory files no matter where I talk to it. The same identity, the same project state, the same logged conversations. When I ping Nix from Telegram on the train, and open the Mac app at my desk an hour later, Nix already knows what we talked about.

Not because the surfaces are calling each other. Because they are both reading the same files.

**Actually does things.** Nix doesn't just answer. It acts. It opens a browser, navigates, clicks, fills forms, reads emails, moves calendar events. When I ask it to do something, I watch it happen. That's the gap most AI setups never close.

---

There is one source of truth on disk. Any surface I open picks up exactly where the last one left off.

The memory layer is just Markdown files in a known folder, plus a SQLite log of every conversation, Telegram or voice:

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

On my phone, Nix is a Telegram chat. I message it like a friend. Replies stream back with the typing indicator and fill in word by word.

On my Mac, Nix is a native menu-bar app. A small orb sits up there all day showing status: idle, listening, thinking, speaking. Two ways to invoke it:

- Say "Hey Nix" from anywhere and it wakes up
- Hit `⌘⌥N` to pop open a quick window for a spoken query

No tab to find, no app to bring to the front. Nix is just there. Chat history persists across app launches; reopen the app and the conversation picks up exactly where you left it.

I say "Hey Nix, what's on my calendar" and hear the answer almost immediately, as if I'm talking to a friend. If Nix is mid-sentence and I start talking, it stops. Barge-in works via voice or just hitting the spacebar.

When I ask it to do something real like move a meeting, check an email, or open a pull request, I watch the browser take over. It navigates, clicks, fills, confirms. I sit back. It is what makes this feel different from every other AI setup I have tried.

Different surfaces, different interaction styles. But the same Nix, the same engine, the same memory underneath.

---

## The decisions that actually made it work

A few unsexy choices along the way made the difference between "this kind of works" and "this is always on".

**Skipping the Claude Code Telegram plugin.** My first cut wired Telegram through Claude Code's channels plugin system. Every incoming message reloaded the full Claude Code harness: MCP plugins, system prompt, ToolSearch dance, a cold start every single turn. For a chat surface where you want a reply in a second or two, that is the wrong shape.

I replaced it with a small Python bridge that long-polls the Telegram Bot API directly and pipes each message into one warm `claude` subprocess running in stream-json mode with no plugins loaded. The subprocess stays alive across messages. The prompt cache stays hot. Replies stream back almost immediately.

The lesson: plugin systems exist for a reason, but for a single user on a single chat surface, going direct is faster and simpler.

---

**STT: browser API to local whisper-server.** The voice surface started on `webkitSpeechRecognition`, the browser's built-in speech recognition. The problem: its language model biases toward common English. "Nix" kept getting transcribed as "next", "mix", or "knicks". Technical jargon and accented speech fared worse.

I moved to Silero VAD in the browser (chunks the mic stream into speech segments) feeding a local **whisper-server**, whisper.cpp's HTTP server binary, Metal-accelerated on Apple Silicon. The browser POSTs short WAV blobs to `/api/voice/stt` and gets a transcript back. Wake word "Nix" now lands reliably. Still local. Still free.

---

**TTS: OpenAI to Google.** Voice replies started on OpenAI's `tts-1` (~$15 per million characters). Good voice, but a meter ticking on every reply. Switched to Google Cloud Chirp3 HD voices, comparable quality, **free up to a million characters per month**, which is more than I generate in a normal month.

The TTS layer also auto-detects when usage is approaching the monthly free-tier cap and falls back to Neural2 automatically, so quality degrades gracefully instead of hitting an error. OpenAI and macOS `say` remain as further fallbacks if needed.

---

**Resumable sessions with `claude -p`.** The foundation of the whole thing is `claude -p` with `--session-id` and `--resume`. Instead of spawning a fresh Claude process for every message, you resume the same session. The context is already loaded. The prompt cache is already warm.

This is what makes Nix feel like a continuous conversation rather than a series of isolated requests, and it's the same trick that makes both the Telegram bridge and the Mac app feel like they're talking to the same Nix.

---

**A semantic search layer over my entire history.** The flat memory files are great for structured facts: who I am, what projects I'm on. But they don't capture the texture of past conversations.

For that, I built a local sqlite-vec database that embeds every past Telegram conversation and GitHub repo commit. When I ask "what was the plan for X?" or "where did we leave off on Y?", Nix runs a vector search over months of history before answering. The flat files tell Nix who I am. The search index tells Nix what we've talked about.

Today it indexes Telegram and GitHub, but the architecture is pluggable:

- Notion pages
- Email threads
- Calendar history
- Browser bookmarks

Together they're the closest thing I have to a second brain.

---

**Playwright MCP for browser automation.** Instead of writing custom browser automation code, Nix uses Playwright MCP, a Model Context Protocol server that gives Claude full browser control out of the box:

- Navigate, click, fill forms, take screenshots, scrape content
- All available as native tools without a single line of custom automation code

It's the reason "open a pull request" or "check my email" just works.

---

**Channel-source tagging.** Every message is wrapped in a source tag (`<channel source="mac">` or `<channel source="telegram">`) before it reaches Claude. This lets the system know which surface a message came from, route it correctly, and deduplicate logging without any manual bookkeeping.

**Auto-logging via Claude Code hooks.** The conversation logger runs as a Claude Code hook, not a script I call manually. Every turn, question and answer, gets written to a shared SQLite database automatically. Both surfaces write to the same log, keyed by source tag. No surface has to remember to log anything. The memory just accumulates.

---

The pattern across all: drop the convenient default, pick the option that runs warm, local, or free at personal scale.

---

## What makes it feel real-time

Picking the right pieces is half the battle. The other half is running them so the voice loop does not feel laggy.

**Keep whisper warm.** The first version of the STT endpoint spawned `whisper-cli` per request. Every call paid a 6-12 second cold start to load the model and compile Metal shaders. End-to-end latency was **7-19 seconds**, fine for a transcription tool, unusable for a voice assistant.

I switched to running `whisper-server` as a long-lived child of the Node process. The model loads once at startup. Metal shaders compile once. The Node server POSTs each audio chunk to `127.0.0.1:8181` and gets a transcript back in **about 150 ms**.

**A 50x speedup from a single architectural change.**

The child is supervised: if it crashes, the parent respawns it with a small backoff; if Node shuts down, the child gets a clean SIGTERM. Keep the expensive process alive across requests, and supervise it so the savings do not come at the cost of fragility.

---

**Chunk the reply into sentences for TTS.** The naive approach is to wait for the full model reply, hand the whole thing to TTS, then start playback. For a multi-sentence answer that means a long silent gap before Nix says anything.

Instead, the client watches the streaming reply for sentence boundaries: `.`, `!`, `?` followed by whitespace, or paragraph breaks. As soon as a complete sentence is available, it gets pushed onto a queue. A drain loop fetches and plays sentences one at a time while later ones are still streaming in.

The result: Nix starts speaking the first sentence while the model is still writing the third.

This matters even more for complex requests that involve tool calls: checking the calendar, reading an email, opening a pull request. Those tasks take longer, and without sentence chunking, Nix would go silent while it works. With it, Nix narrates as it goes: you hear what it's doing in real time, not a long pause followed by a wall of text. That's the difference between a voice assistant and a voice search bar.

---

**Mac-side latency tuning.** Beyond the server-side optimisations, the Swift client on the Mac has its own latency budget. Tuning the audio pipeline (buffer sizes, AVAudioConverter settings, how quickly the mic hands off to the STT endpoint) saved another 500-700 ms per turn.

The server can be fast and the client can still be the bottleneck; you have to tune both ends.

The pattern here is the same idea in a different shape: keep work warm, and pipeline it. Cold-start once, pay nothing per request. Stream output and start consuming it before the producer finishes.

---

## Surviving reboots and crashes

Two pieces of infrastructure keep Nix running through everything macOS throws at it.

**tmux to make the session resilient.** Nix runs inside a named tmux window. If my terminal closes or my screen sleeps, the session is unaffected:

```bash
tmux new-session -d -s nix
tmux send-keys -t nix "claude" Enter
```

**A LaunchAgent so it survives reboots.** A LaunchAgent makes sure the tmux session and the Telegram bot come back automatically after a reboot:

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

**`caffeinate` to survive long tasks.** macOS will put the machine to sleep mid-task if left idle long enough. For a voice assistant that might be browsing, reading emails, or running a multi-step agent task, that's a silent killer. Wrapping the Telegram bridge in `caffeinate` keeps the Mac awake for the duration of any active session, with no interrupted tasks and no half-finished replies.

---

## Honest caveats

This is for personal use only. The Claude subscription is not meant for commercial applications or multi-user products.

Nix runs on the interactive tier of Claude Code, which is flat-fee and works well within its rate limits for a single user. If I tried to drive a hundred concurrent tasks through it, I would hit those limits. The headroom is for one person with a phone and a laptop, not a fleet.

Outside the subscription, Nix depends on Google's text-to-speech for voice replies. Free up to a million characters per month, which covers almost everything I throw at it.

And the assistant is only as good as the memory and prompts I give it. The setup is the easy half. The discipline of writing useful memory files, scoping prompts, and pruning stale context is the rest of the work.

---

Three months ago I was sending voice notes to a bot. Today I have Nix. The difference is everything in this article.

#claude #personalassistant #automation #buildinpublic
