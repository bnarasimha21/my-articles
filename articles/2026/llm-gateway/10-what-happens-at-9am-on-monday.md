# What Happens to Your AI App at 9am on Monday?

My LLM gateway retried its way through a 20% failure rate without dropping a single call. Then I simulated 9am on Monday, and 20 of 50 clients got an error anyway.

It started with a message from a platform lead:

> "Before this touches production: what happens when Anthropic rate-limits us at 9am on Monday, what happens when it is down, and what will it cost us a month? I want numbers, not vibes."

The customer is Ledgerly, the fictional invoicing SaaS from my last article, where I built an LLM ticket router and a plan to roll it out. The support lead liked the plan. The platform lead wanted to know what happens when things go wrong.

So I built a small gateway that every LLM call goes through. It retries errors that might succeed on a second try, can fall back to a second model, and logs every call with its cost. Then I tried to break it.

The short version: retries make random errors disappear. They did not survive a 9am burst, they cannot ride out an outage, and they will not tell you when caching quietly makes your bill go up.

---

## The 9am burst

Here is the simulation. 50 clients start at the same moment. The server accepts 10 requests per second and sends a 429 (rate limited) to everyone else. Even in a perfect world, the last client gets in during the fifth second.

My gateway tries each call 4 times and then gives up. Between tries it waits a little: up to half a second, then up to 1, then up to 2. That is about 3.5 seconds of waiting in total, and the crowd needs 5 seconds to clear.

With those limits, 30 of the 50 clients got an error with a fixed wait between tries. With exponential backoff, where the wait doubles each time, 20 got an error. Adding jitter, a random wait instead of an exact one, made no difference: still about 20 of 50.

That surprised me, because jitter is the standard advice for exactly this. So I took the attempt limit away and let every client retry until it got in, to see what jitter actually changes.

My prediction was that a fixed wait would do worst and exponential without jitter best. I was wrong on both.

| Policy (base wait 1 s) | Last client gets in at | Rejected requests |
|---|---|---|
| Fixed 1 s wait | 4.0 s | 100 |
| Exponential, no jitter | 15.0 s | 100 |
| Exponential with jitter | 10.4 s on average (slowest of 200 runs: 34.7 s) | 111 |

The fixed wait finished first, and it was fast at every setting I tried, because it simply retries often. Its low rejection count was luck, though. A 1 second wait matches the server's 1 second window exactly, so each wave of retries landed in a fresh window. With a 0.3 second wait it still finished first, in 4.2 seconds, but it threw 360 rejected requests at the server to get there.

Exponential without jitter was the slowest. Everyone who failed together retried together, and the server sat idle in the gaps between waves. Jitter spread them out: at the 0.3 second setting it had the fewest rejections (171) and finished in 9.7 seconds against 18.9.

So jitter makes the retries kinder to the server. It did not get more clients through a burst my gateway gives up on after 3.5 seconds. For that you need to stop the crowd forming in the first place. That means a rate limiter on your side, or less traffic at 9am. I have not simulated that fix yet.

The simulation is simple. It ignores the `retry-after` header a real 429 can carry, which my gateway honours as a minimum wait, so real waits could be longer and fewer clients might fail.

---

## When retries do work

The gateway has a chaos switch that makes a share of attempts fail on purpose, with an injected 429 or timeout, before they reach the network. These failures are random and independent. One call failing says nothing about the next.

I set it to 20% and worked out what to expect first. A call fails only if all 4 attempts fail: 0.2 × 0.2 × 0.2 × 0.2 = 0.16%. On average each call should need about 1.25 attempts.

Then I ran the router from the last article through the gateway: 40 tickets, 5 runs, on Claude Haiku 5.5. Once clean, once with chaos.

| Batch | Calls | Failed | Attempts per call | Median latency | Slowest 1 in 20 | Cost |
|---|---|---|---|---|---|---|
| Clean | 200 | 0 | 1.000 | 871 ms | 1,681 ms | $0.0078 |
| 20% of attempts fail | 200 | 0 | 1.255 | 917 ms | 2,085 ms | $0.0077 |

35 calls hit at least one failure. None of them failed. Retries hid the errors completely, at the price of about 25% more requests and about 400 ms more on the slowest calls.

The cost stayed flat only because my injected failures never reach the network. A real timeout may still be billed.

The first try at each batch stopped early, at about 130 calls. I do not know why, because I had piped the output through a filter and hid whatever error it printed. The table is from the reruns, which completed.

One number I got wrong before writing any code. Anthropic's Python library (the SDK) retries twice on its own by default. I asked myself: if I wrap it in my own loop of 4 attempts, what is the worst case number of requests for one call? I said 3.

It is 12. Each of my 4 attempts can turn into 3 requests. Two retry loops that do not know about each other multiply. The fix is one setting, `max_retries=0`, so only the gateway retries.

---

## When Anthropic is down

Retries buy about 3.5 seconds, or longer if the server sends a `retry-after`. The whole call has a 90 second deadline. That helps with a hiccup and does nothing in a 20 minute outage.

The gateway can also fall back to a second model. It is off by default. When the first model runs out of attempts, or the next wait would blow the deadline, the gateway gives the fallback model 2 attempts. A bad request (a 400) never falls back, because a second model would get the same bad request. I have tested this against a simulated provider only.

The fallback brings its own problem. In the router article, Haiku changed its answer between runs on some tickets, and Sonnet never did. My rule for sending unclear tickets to a human, based on how often runs agree, was tuned on Haiku. If Sonnet quietly took over, that rule would stop meaning what I measured. So the result tells the caller which model answered, and the caller can send fallback answers to a human.

And a second model from the same provider does not help when that provider is down. For ticket routing, Ledgerly already has a fallback that does not depend on Anthropic: the keyword rules. That is not wired into the gateway yet. The rollout plan from the last article already makes the rules the fallback once the LLM is in charge.

---

## 6 workers, 6 times the rate limit

Anthropic limits each organization on requests and tokens per minute. The gateway has an optional limiter that hands out permits at a steady rate, and every call waits for one before it goes out. It counts requests, not tokens.

Then the platform lead asked: "We run 6 worker processes. What happens to your limit?"

I got half of it. Each process has its own limiter, so together they can send up to 6 times the rate, and the provider still sends 429s. I did not know the fix. Anthropic counts the limit across the whole organization, so the limiter has to live somewhere every worker can see. That could be a shared store like Redis, or one central gateway that every worker calls. Splitting the limit by hand, a sixth per worker, wastes capacity when workers are idle and breaks the day someone adds a seventh.

---

## What it costs a month

First, a correction. My last article said Sonnet would cost about $85 a month at 2,000 tickets a day. That number came from the Claude Code CLI's own cost field, which is not what the API bills.

Measured through the gateway, a ticket uses about 333 input tokens and 9 output tokens on Haiku. At 2,000 tickets a day that is about $2 a month on Haiku.

At those same token counts Sonnet would be about $45. But I never measured Sonnet's tokens on this task, and Sonnet thinks before it answers by default, which is billed as output. So the honest Sonnet figure is somewhere between $45 and the old $85 until I measure it.

The prices I used were $0.10 and $0.50 per million input and output tokens for Haiku 5.5, and $2 and $10 for Sonnet 5.5. Sonnet costs 20 times as much per token, so the model choice matters far more than any tuning. Turning Haiku's thinking down to low effort cut its output tokens nearly in half and the bill by only about 6%, because the input is most of the cost.

At 50,000 tickets a day, Haiku comes to about $57 a month. I had guessed $30.

---

## The caching trap

If many calls start with the same long text, the provider can cache it. On Haiku and Sonnet the first call pays 1.25 times the normal input price to store it, and calls in the next 5 minutes read it back at a tenth of the price.

I tested it with a long, synthetic system prompt: 3,856 tokens of repeated policy text, followed by a short question on each of 20 calls. I guessed caching would cut the cost to a tenth. Worked out properly, 1.25 for the first call plus 0.1 for each of the other 19 is 3.15, against 20 without caching. That is about 6.3 times cheaper.

| Run | Stored in cache | Read from cache | Cost |
|---|---|---|---|
| No caching | 0 | 0 | $0.00795 |
| Caching on | 3,856 | 73,264 | $0.00145 (5.5x cheaper) |
| Caching on, current time at the top of the prompt | 77,380 | 0 | $0.00991 (25% more expensive) |

5.5 times cheaper, a little under the estimate, because the questions and answers are never cached.

Now imagine a teammate adds the current time to the top of the system prompt. It looks harmless. But the cache only matches if the start of the prompt is identical, so every call stored a fresh copy at the premium price and never read one back. Caching made the bill 25% higher than no caching at all.

> Nothing errored. The only sign was a zero in `cache_read_input_tokens`.

Put anything that changes, like the time, the user's name or the ticket, after the part you want cached. Two things I have not tested: many calls arriving at once before the cache exists, and the router's own prompt, which at about 333 tokens is probably too short to cache at all.

This is also why the gateway logs every call: the model, attempts, latency, all four token counts and the cost. It never stores the prompt or the reply, because tickets carry customer data. When the bill jumps, those columns tell you whether it was more calls, more retries, a prompt that grew, or a cache that stopped working.

---

## What I would tell Ledgerly's platform lead

Is it ready for 9am on Monday? Not yet.

Random errors are covered. With 20% of attempts failing, all 200 calls completed. The Monday burst is not. Before launch, I would turn on the rate limiter, share it across all 6 workers, and move work that can wait off the morning peak, or onto the Batch API, which is cheaper and returns results within 24 hours.

When Anthropic is down, the gateway buys seconds and the keyword rules have to take over. I would wire that up, and add a circuit breaker so calls fail immediately during an outage instead of each one working through its retries.

The bill is about $2 a month on Haiku at 2,000 tickets a day. I would check it against the real log in the first week, and agree on three alerts before launch: daily spend, attempts per call, and cache reads.

---

## If you are building something similar

1. Make the gateway testable offline. I pass in the provider, the clock and the sleep, so tests can use a simulated provider and a clock they control. 48 tests run in about 3 seconds and cost nothing.
2. Let one layer own retries. Wrapped around the SDK's own retries, my 4 attempts could become 12 requests.
3. Test a burst, not just random errors. My gateway shrugged off 20% random failures and still lost 20 of 50 clients to a simulated 9am crowd.
4. Check caching in the usage numbers. A timestamp at the top of the prompt made caching more expensive than no caching, and nothing errored.

What does your LLM call log track that mine does not?
