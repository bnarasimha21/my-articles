# I Got Locked Out of My Own GitHub. An AI Agent Did It.

I was using Claude Code to clean up my GitHub repositories. Updating descriptions for repos that were missing them, batch-organizing things I had been putting off for months. The kind of tedious housekeeping that is perfect for an AI agent.

It was glorious. In minutes, the agent swept through dozens of repos. Reading metadata. Updating descriptions. Pushing changes. Work that would have taken me an afternoon was done before my coffee got cold.

Then I asked it to list all my repositories.

**Access denied.**

GitHub's API gateway had flagged my activity. Dozens of rapid-fire API calls in quick succession, and suddenly I looked like an attacker. My legitimate, authenticated, paid-account usage was indistinguishable from a DDoS attack.

I got access back after a short cooldown. No lasting damage.

**The infrastructure we have built to protect APIs was designed for a world where humans were the primary consumers. That world is ending.**


## Why Agents Break Rate Limiting

Traditional API rate limiting is straightforward. Set a fixed number of requests per minute. Apply it uniformly. Anything over the limit gets throttled or blocked.

This works because human-driven API usage is predictable. A developer building a frontend makes a few calls per page load. A mobile app syncs data in small, regular intervals. The traffic is steady. Spikes are gradual.

AI agents do not work like that.

When an agent decides to "clean up all repositories," it does not pace itself. It identifies every repo, evaluates each one, makes decisions, and fires off API calls in rapid succession. It is not malicious. It is just efficient.

But to an API gateway, "efficient" and "attack" look identical.

And here is what makes this harder. Actual attackers are now using AI to make their traffic look more human-like. Legitimate AI agents are generating traffic that looks more bot-like. The signals are inverting.

This is already happening everywhere. AI coding agents hitting version control and CI/CD platforms. Customer support agents querying CRMs and ticketing systems simultaneously. DevOps agents triggering cascades of API calls across cloud providers.

A human developer makes 50 API calls in an hour.

An AI agent doing the same work makes 500 in five minutes.

Same total work. Completely different traffic pattern. Exactly what rate limiters are trained to flag.


## Three Actors, One Rate Limiter

The core challenge is not about raising rate limits. It is a classification problem with three actors that are increasingly hard to tell apart.

**Humans.** Predictable, slow, session-based. The traffic pattern rate limiters were designed for.

**Legitimate AI Agents.** Fast, bursty, authenticated. Traffic patterns that resemble attacks. Operating on behalf of real users doing real work.

**Malicious Bots.** Using AI to mimic legitimate traffic. Some now mimic agent-like patterns to hide among the growing volume of legitimate agent traffic.

Traditional rate limiting treats this as binary. Within limits or not. But the question we need to answer is harder: who is making these calls, why, and should we allow this specific burst?

The industry is starting to respond. Adaptive rate limiting systems that consider your historical usage before blocking you. Agent identity protocols that give agents their own authentication class, separate from human API keys. Intent-aware gateways that evaluate what requests are doing, not just how many there are.

The direction is right. But most APIs have not caught up yet.


## If You Are Building APIs

Here is what I would start thinking about now.

**Create separate rate limit tiers for agent traffic.** Do not force agents through the same limits as browser-based users. Offer authenticated agent tiers with higher burst limits but the same total quota.

**Implement transparent rate limit headers.** Every response should include `X-RateLimit-Remaining` and `X-RateLimit-Reset`. AI agents can self-regulate if they have the information. Most rate limit violations happen because agents have no visibility into where they stand.

**Design for burst, not just throughput.** A sliding window algorithm is better than a fixed window for agent traffic. A token bucket approach that allows short bursts while maintaining long-term rate averages is even better.

**Distinguish between read and write operations.** An agent reading 100 repos to find which ones need updates is very different from one writing to 100 repos. Your rate limiting should reflect this.

**Log agent actions separately.** When something goes wrong, you need to know whether a human or an agent caused it. Build this distinction into your observability stack from day one.


## The Bigger Picture

What happened to me on GitHub is a small preview of a systemic shift. We are moving from a world where APIs serve humans through apps to a world where APIs serve agents on behalf of humans. The traffic patterns, authentication models, and abuse detection systems we have built over the past 15 years were designed for the first world.

The second world needs different infrastructure. Not just higher limits. Fundamentally different approaches to identity, intent, and trust.

For my repo cleanup, a brief lockout was an inconvenience. But imagine an AI agent managing a production deployment or orchestrating a financial transaction, and getting rate-limited mid-operation because the gateway could not tell it apart from an attack.

That is not an edge case anymore. **That is Tuesday in 2026.**
