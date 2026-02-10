# Running ClawdBot on a DigitalOcean Droplet

*Published: January 26, 2026*

---

ClawdBot has been the talk of the town lately. Like most people, I initially ran it locally on my Mac. It worked well, but over time I started feeling the friction.

I did not want an always-on agent running on my personal machine. More importantly, I wanted it to perform actions that could be noisy or disruptive.

I was not interested in using it for:
- Creating reminders
- Scheduling calendar events
- Sending emails

I wanted it to do my development work. Things like:
- Cloning repositories
- Making code changes
- Pushing commits
- Installing MCPs
- Deploying apps and more

---

## Running ClawdBot on a Droplet

Instead of running it on a Mac Mini, I installed ClawdBot on a DigitalOcean Droplet.

Once ClawdBot is installed on a droplet, there is no GUI to interact with. To handle this, ClawdBot automatically provides an SSH tunneling command that lets you access the dashboard securely from your local machine.

There were a few rough edges during setup. Switching to a different model after onboarding was a slight headache. But apart from that, the rest of the setup and workflow was a breeze.

---

## Chat as the Interface

I then configured it to work with a Slack bot and also WhatsApp.

What felt different was not just the interface, but the fact that real development work could be done from tools I already live in.

The rule was simple:
- Any request goes to ClawdBot
- ClawdBot does everything on the droplet

---

## From Request to Deployment

I asked it to implement a feature and deploy the changes.

To be fair, even the Claude Code mobile app can help with implementation. But being able to do this via WhatsApp, Slack, or Discord, and have most of the work happen autonomously, gives this setup a very different edge.

What followed was a fully automated flow:
- ClawdBot cloned my repository on the droplet
- Made the required code changes
- Committed and pushed them to GitHub
- Used the DigitalOcean MCP server to deploy the updated app to App Platform

All of this happened in a matter of minutes. Apart from providing scoped DigitalOcean and GitHub tokens, there was no manual intervention. No local setup. No context switching.

---

## A Note on Credentials

For obvious reasons, this requires being thoughtful about credentials.

In my case:
- Tokens were tightly scoped
- Stored on the droplet
- Handled no differently from CI or deployment credentials

---

## Why This Feels Different

This is where things start to feel different.

The bot is operating inside real infrastructure, where skills and plugins allow it to do far more.

People are already exploring a wide range of use cases, from infrastructure automation to app maintenance to internal tooling.

This certainly feels like the beginning of something with huge potential.

---

*Originally posted on [X/Twitter](https://x.com/bnarasimha21/status/2015708943704572413)*
