# What Happens to Your LLM App at 9am on Monday?

In my last article I built an LLM ticket router for Ledgerly, a fictional invoicing SaaS, and wrote a plan to roll it out in stages. The support lead liked the plan. Then their platform lead read it and sent one message:

> "Before this touches production: what happens when Anthropic rate-limits us at 9am on Monday, what happens when it is down, and what will it cost us a month? I want numbers, not vibes."

Those are three fair questions, and "we call the API" answers none of them. So I built the piece that sits between the app and the model: a small gateway that every LLM call goes through. It retries the errors worth retrying, waits a bit longer between each try, falls back to a second model, can slow itself down before the provider has to, and logs every call with its cost.

Then I broke it on purpose. I made 20% of attempts fail and the gateway still delivered all 200 calls. I simulated 50 clients hitting a rate limit at the same moment, and the standard advice did not behave the way I expected. And I made prompt caching cost more than no caching at all, with one line a teammate might add.

---

## The setup

The gateway is one function, `complete()`, that every later piece of the system calls instead of calling Anthropic's Python library (the SDK) directly. It takes the system prompt, the messages and the model, and returns the text plus everything you need to operate it: tokens used, cost, latency, how many attempts it took, and which model actually answered.

The design choice that made everything else possible: the gateway takes the provider, the clock and the sleep function as arguments. In production those are the real Anthropic client, the real clock and a real sleep. In tests they are a fake provider that plays a script of outcomes ("rate limited, rate limited, then ok"), a fake clock, and a sleep that only writes down how long it was asked to wait.

So a test of "five overloaded errors in a row, then switch to the fallback model" runs in milliseconds and costs nothing. The suite has 48 tests, all offline, and they run in about 3 seconds. Only the experiments later in this article touched the real API, all of them on Claude Haiku 5.5, and they cost a few cents. Every Sonnet number below is price arithmetic, not a measurement.

---

## Retry only what can succeed

Some errors go away if you wait. A 429 (rate limited), a 529 (overloaded), other server-side errors, timeouts and dropped connections are all worth another try. Others never go away. A 400 (bad request), 401 (bad key), 403, 404 or 413 (request too large) fails the same way every time, so retrying only burns time and money.

Before writing code I predicted one number. The SDK retries twice on its own by default. If I wrap it in my own loop of 4 attempts, what is the worst case number of requests for one call? I said 3.

The answer is 12. Each of my 4 attempts is 1 request plus up to 2 SDK retries. My 3 was the SDK on its own. Two layers of retries that do not know about each other multiply, and your attempt counts and latency numbers quietly stop meaning anything. The fix is one argument, `max_retries=0` on the client, so the gateway owns every retry.

I also tested a mistake an older caller might make: asking for `temperature=0`. SDK 2.x has no such argument, so a direct call fails in Python before it ever reaches the network. Smuggled through as an extra request field, the API answers 400. The gateway made exactly 1 attempt, slept 0 seconds and logged it as not retryable.

Anything the gateway does not recognise, like that Python error, is never retried either.

> Retrying a bug does not fix it. It multiplies the bill by the number of attempts.

---

## Jitter did not do what I expected

When a call is rate limited, you wait and try again. Exponential backoff doubles the wait each time. Jitter means picking a random wait between zero and that ceiling ("full jitter"), so clients that failed together do not all retry together.

I wrote a small simulation of 9am on Monday: 50 clients all start at the same moment, each needs one successful call, and the server accepts only 10 requests per one-second window. Everyone else gets a 429. With 10 per window, the last client cannot get in before the fifth window, which starts at 4 seconds. In this first version, clients retry for as long as it takes. I compared three policies over 200 random seeds.

My prediction: a fixed wait would be worst, exponential without jitter fastest, and jitter somewhere in the middle. I was wrong on both counts.

| Policy (base wait 1 s) | Last client gets in at | 429s |
|---|---|---|
| Fixed 1 s wait | 4.0 s | 100 |
| Exponential, no jitter | 15.0 s | 100 |
| Exponential, full jitter | 10.4 s on average (slowest seed 34.7 s) | 111 |

The fixed wait won, and it won by luck. A 1 second wait matches the server's 1 second window exactly, so each wave of retries lands in a fresh window and fills it. Exponential without jitter was the slowest: everyone who failed together retried together, and the server sat idle in the growing gaps between waves.

Jitter beat exponential without jitter on time, but it caused slightly more 429s, not fewer. So I changed one thing, the base wait, to 0.3 seconds, which no longer lines up with the window.

| Policy (base wait 0.3 s) | Last client gets in at | 429s |
|---|---|---|
| Fixed 0.3 s wait | 4.2 s | 360 |
| Exponential, no jitter | 18.9 s | 180 |
| Exponential, full jitter | 9.7 s on average (slowest seed 22.5 s) | 171 |

Now jitter caused the fewest 429s and still finished well ahead of exponential without jitter. The fixed wait was still fast, but it hammered the server with 360 rejected requests to get there.

What I took from it:

- Without jitter, the 429 count was identical on every seed. That is the signature of synchronized waves.
- Jitter is not always faster than a fixed wait that happens to match the server. Its real job is to stop clients moving in lockstep, and you rarely know the server's window.
- Jitter has a cost: a long tail. In a simulation that retries forever, one unlucky client waited 34.7 seconds.

That last point sent me back to the simulation, because my gateway does not retry forever. It gives up after 4 attempts, with waits of up to 0.5, 1 and 2 seconds. Rerun with those limits, the same 50-client burst left about 20 of 50 clients with an error under jitter, and 30 of 50 with a fixed wait. Four quick attempts cannot outlast a crowd that needs five seconds to clear.

> Retries handle random blips. A synchronized burst needs something that stops the crowd forming: a rate limiter on your side, or less traffic at the peak.

One more catch. When a 429 comes with a `retry-after` header, my gateway treats it as a minimum wait. If every worker gets the same `retry-after`, they still come back together. Adding a little jitter on top of it is the next change I would make.

---

## I broke 20% of attempts on purpose

The gateway has a chaos switch. Set `GATEWAY_CHAOS=0.2` and 20% of attempts fail with a fake 429 or timeout before they reach the network. The failures are random and independent, like blips, not like the burst above.

I was not sure what to expect, so I worked it out before running it. Each attempt fails 20% of the time, and a call only fails if all 4 attempts do: 0.2 × 0.2 × 0.2 × 0.2 = 0.16%. Expected attempts per call: 1 + 0.2 + 0.04 + 0.008, about 1.25.

Then I ran the real router from the last article through the gateway: 40 tickets, 5 runs, on Haiku 5.5. Once clean, once with chaos.

| Batch | Calls | Failed | Attempts per call | Median latency | Slowest 1 in 20 | Cost |
|---|---|---|---|---|---|---|
| Clean | 200 | 0 | 1.000 | 871 ms | 1,681 ms | $0.0078 |
| 20% of attempts fail | 200 | 0 | 1.255 | 917 ms | 2,085 ms | $0.0077 |

35 of the 200 calls hit at least one injected failure. None of them failed. The 1.255 attempts per call landed almost exactly on the 1.248 the arithmetic predicted. Accuracy did not move: every chaos run scored 40/40. The only miss across both batches was in the clean batch, one ticket flipping to billing once in 5 runs, the same run-to-run wobble I wrote about last time.

So retries hid a 20% failure rate completely. The price was about 25% more requests and a slower tail: the slowest 1 in 20 calls took about 400 ms longer.

Three caveats, because these numbers are easy to over-read:

- Cost stayed flat only because my fake failures happen before the request is sent. A real 429 is also free, but a real timeout may still be billed. Do not assume retries are free in production.
- This is one sample. I fixed the random seed, but 4 worker threads share one random number generator, so which call draws which number depends on thread timing. The run cannot be replayed exactly.
- My first attempt at each batch stopped early, at about 130 calls, and I do not know why. I had piped the output through a filter, so whatever error it printed was hidden. The reruns completed. Do not filter an experiment's output before you know the experiment works.

---

## What retries cannot fix: an outage

Retries are built for blips. My gateway sleeps at most about 3.5 seconds in total across its retries. Each attempt can take up to 30 seconds before it times out, and the whole call has a 90 second deadline. That covers a short wobble, not a 20 minute outage.

For that the gateway has a fallback model. When the primary model runs out of attempts on retryable errors, or the next wait would blow the deadline (a long `retry-after`, for example), the gateway tries a second model, with 2 attempts of its own. The result says which model answered, and the log line is marked `fallback: true`. Errors that cannot succeed, like a 400, never fall back, because a second model will not fix a bad request.

The fallback is tested only against the fake provider. I have not been through a real outage with it.

It also creates a quality problem. A fallback model is a different model. In the router article Haiku flipped answers between runs on some tickets and drifted toward billing, while Sonnet never changed its mind. My rule for sending a ticket to a human (all runs must agree) was tuned on Haiku's behaviour. If Haiku silently took over from Sonnet, or the reverse, that threshold would no longer mean what I measured.

> A fallback model needs its own eval, not an assumption that it behaves like the primary.

That is why the fallback flag goes all the way to the caller. Code that knows the answer came from the fallback can trust it less, or send the ticket to a human.

---

## A rate limiter that does not add up

Anthropic limits each organization on requests per minute and tokens per minute. The polite thing is to slow down before the provider has to tell you. So the gateway can take a token bucket. Picture a bucket of permits: it holds a few for bursts, refills at a steady rate, and every call waits for a permit before it goes out. The wait counts against the call's deadline. Tests run it on fake time, and one test runs 8 real threads against it to check the rate never goes over the steady rate plus the burst.

It is optional, and it was off in the experiments above. That matters given the burst result: this is the piece that would stop the crowd forming.

Then I was asked a question I only half answered. Ledgerly runs 6 worker processes. What happens to the limit?

Each process has its own bucket, so the real rate can reach 6 times the setting, and the provider still sends 429s. I got that far. I did not know the fix. The limit belongs to the account, not to a process, so the bucket has to live somewhere every worker shares: a shared store like Redis, or one central gateway service that every worker calls. The quick patch, giving each worker a sixth of the limit, wastes capacity when workers sit idle and breaks the day someone adds a seventh.

My bucket also counts requests, not tokens. A workload that hits the tokens per minute limit first would need a second bucket for that.

---

## What will it cost a month?

A month of calls costs: calls per day × 30 × (input tokens × input price + output tokens × output price). At the prices I used (per million tokens: Haiku 5.5 $0.10 in and $0.50 out, Sonnet 5.5 $2 and $10, Opus 5.5 $4 and $20), you can do most of this in your head. Check the pricing page before trusting any table, including mine.

The router uses about 333 input tokens and 9 output tokens per ticket, measured from the gateway's log on Haiku. At Ledgerly's 2,000 tickets a day, that is about $2 a month on Haiku and about $45 on Sonnet.

Before running the numbers I guessed Haiku would cost about $30 a month at a much bigger 50,000 tickets a day.

| Model | Monthly cost, 50,000 tickets a day | Low effort |
|---|---|---|
| Haiku 5.5 | $57 | $54 |
| Sonnet 5.5 | $1,134 | $1,074 |
| Opus 5.5 | $2,268 | $2,148 |

My guess was within 2x. Running the estimator over the averages from 798 logged calls (332 tokens in, 10 out) gave $57 too. The Sonnet and Opus rows use Haiku's token counts. I never measured how many tokens Sonnet uses on this task, thinking included, so treat those rows as rough.

The model choice is a 20x decision. Sonnet's prices are exactly 20 times Haiku's, so at the same token counts it costs 20 times as much.

That also corrects my last article. I quoted about $85 a month for Sonnet at 2,000 tickets a day. That figure came from the Claude Code CLI's own cost field, which covers whatever the CLI sent, not just my prompt. Through the API with the bare prompt, the same estimate is about $45. Measure cost where you will pay it.

---

## Thinking tokens are output tokens

Haiku 5.5 can think before it answers, and thinking is billed as output. So a one-word classifier that reports about 9 output tokens per call, when the bare label takes about 5, is not a bug. I compared three settings on the 40 tickets, one run each:

| Setting | Accuracy | Output tokens (40 tickets) | Cost | Median latency |
|---|---|---|---|---|
| Default | 40/40 | 368 | $0.00152 | 872 ms |
| Low effort | 40/40 | 196 | $0.00143 | 903 ms |
| Thinking off | 39/40 | 196 | $0.00143 | 856 ms |

Thinking tokens are not reported separately, so "thinking nearly doubled the output" is inferred from the difference. Low effort gave exactly the same count as thinking off, so on this task low effort seems to skip thinking entirely.

Either way, the extra output cost only about 6% more. On a label-only task the input dominates the bill: 13,320 input tokens against a few hundred output, mostly the system prompt repeated on every call. Latency did not move either. The one miss with thinking off is one ticket in one run, well inside the run-to-run noise I measured last time. I would need 5 runs of each before claiming thinking helps accuracy here.

These 40/40 scores are higher than the router article's 92%. Don't compare them. The API and the CLI are different harnesses, and these runs used a lenient parser that accepts the label inside extra text, where the 92% was scored strictly.

---

## Prompt caching, and how to make it cost more

If many calls start with the same long opening (the prefix), the provider can cache it. On Haiku and Sonnet, the first call pays 1.25 times the input price to write the cache. Calls in the next 5 minutes read it at 0.1 times the input price.

I built a long system prompt, the router prompt plus 30 labelled example tickets, 3,856 tokens, and ran 20 classification calls three ways on Haiku 5.5. I guessed caching would cut the cost to about a tenth. Worked through properly, it is 1.25 for the first call plus 19 × 0.1 for the rest = 3.15 units of prompt cost against 20 without caching, so about 6.3x cheaper.

| Run | Uncached input | Cache write | Cache read | Cost | Against no cache |
|---|---|---|---|---|---|
| No caching | 77,500 | 0 | 0 | $0.00795 | 1.0x |
| Cache the system prompt | 380 | 3,856 | 73,264 | $0.00145 | 5.5x cheaper |
| Same, with the current time at the start | 380 | 77,380 | 0 | $0.00991 | 25% more expensive |

Caching came in at 5.5x cheaper, a bit under 6.3x, because each ticket and each answer are never cached.

The third run is the one to remember. A well-meaning teammate puts the current time at the top of the system prompt. Caching matches on the prefix, so every call now starts with something new. Each call pays the 1.25x write premium and nothing is ever read back. Caching made the bill higher than no caching, and nothing errored.

> The only symptom was a zero in `cache_read_input_tokens`. If you do not log it, you will not see it.

Put everything that changes (the time, the user's name, the ticket) after the cached part.

Two things I did not test. I ran the calls one after another. The documentation says a cache entry exists only once the first response starts, so 20 calls fired at once might each pay the write premium. And the router's whole input is about 333 tokens per call, probably below the minimum length that can be cached, so caching likely does not help it at all. I tested neither, so I will not quote either as fact.

Where caching does pay is a long, stable prefix. As a what-if, a chat-style workload with a 3,856 token cached system prompt, 400 output tokens and 2,000 calls a day would drop from $37 to $18 a month on Haiku, and from $744 to $354 on Sonnet, at a 95% cache hit rate. About half, not a tenth, because output is never cached.

---

## Latency: streaming moves the first word, not the last

| Answer | Mode | First word | Complete | Output tokens |
|---|---|---|---|---|
| One word | Not streamed | 777 ms | 777 ms | 5 |
| One word | Streamed | 700 ms | 718 ms | 5 |
| About 400 words | Not streamed | 4,320 ms | 4,320 ms | 677 |
| About 400 words | Streamed | 847 ms | 4,311 ms | 707 |

That is Haiku 5.5 with thinking off, median of 3 calls each. I guessed the first word of a long answer would take "a couple of seconds". Streamed, it took 0.85 seconds. Without streaming, the first word arrives with the last, at 4.3 seconds.

Total time was the same either way. Streaming changes how long the user waits to see something, not how long the work takes. For the router, which answers with one word, it changes nothing. For a chat reply it is most of what the user feels, because there the 400 words are the latency.

---

## Log every call, but not the customer's words

Every call, success or failure, writes one line to a log file with the same fields: time, use case, the model requested and the model that answered, attempts and their error types, whether a failure was injected, latency, time to first word, the four token counts, cost, and the request id.

It does not write the prompt or the response. Tickets carry customer data. The line holds a fingerprint of the prompt (a hash) and its length, so you can spot a prompt that suddenly grew without storing what it said. Logging the text is an opt-in switch for debugging. A test checks that the prompt text never appears in the line, including when a message carries an image.

That log answers the next question the platform lead will ask: "Why is today's bill 5 times yesterday's?" A bill is calls × tokens per call × price, so the jump has to come from one of those. Group by day, then use case, then model. Then check attempts per call for a retry storm, input tokens per call for a prompt that grew, and the cache read share for a cache that stopped hitting. My cost report groups by use case, model and day. It does not show the cache read share yet, and I have not built the alerts.

---

## What I would tell Ledgerly's platform lead

At 9am on Monday, random rate-limit blips are covered. With 20% of attempts failing on purpose, 200 of 200 calls still completed, at the cost of about 25% more requests. A real synchronized burst is not covered by retries alone: in simulation, a crowd that needs 5 seconds to clear left 20 of 50 clients with an error. Before launch, turn on the rate limiter, move it into a store all 6 workers share, and move work that can wait off the morning peak or onto the Batch API (cheaper and slower, with results within hours).

When Anthropic is down, retries cover seconds, not minutes. A fallback model covers one model being overloaded, but it is the same provider, so a full outage takes both. For ticket routing an honest fallback already exists: the keyword rules. That is not wired into the gateway yet, but in the plan from the last article the rules already become the fallback once the LLM is in charge. I would also add a circuit breaker, so that during an outage calls fail in milliseconds instead of each one working through all its retries.

The monthly cost at 2,000 tickets a day is about $2 on Haiku and about $45 on Sonnet. At 50,000 a day, about $57 against about $1,134. Thinking effort barely matters for the router, and caching probably does not apply to a prompt this short (untested). The model choice is the 20x lever. Quote it as a range, and check it against the real log in the first week.

Agree on the alerts before launch: daily spend per use case, attempts per call, and cache read share for anything that caches.

---

## If you are building something similar

1. Make retries testable. Pass the provider, the clock and the sleep in as arguments. My 48 tests run offline in 3 seconds and spend nothing.
2. Have one owner of retries. The SDK retries by default. Wrapped in your own loop, 4 attempts became up to 12 requests. Set `max_retries=0` on the client.
3. Never retry what cannot succeed. 400, 401, 403, 404 and 413 fail fast, and so does any error you do not recognise.
4. Use jitter, and know what it buys. In my simulation it stopped synchronized waves and, with a short base wait, caused the fewest 429s. It was not faster than a fixed wait that happened to match the server, and with only 4 attempts it could not save 20 of 50 clients in a burst.
5. Run chaos before production does. 20% of attempts failing cost 25% more requests and about 400 ms on the slowest calls, and no call failed. Know that number before the first bad Monday.
6. A rate limiter in one process is not a rate limit. Six workers with their own buckets can send up to six times the rate.
7. Price the model choice first. Sonnet's price is 20x Haiku's. On a short classifier, thinking effort moved the bill by about 6%.
8. Verify caching from the usage numbers. A timestamp at the front of the prompt made caching 25% more expensive than no caching, and the only sign was a zero in `cache_read_input_tokens`.
9. Log every call, with cost and all four token counts, but not the customer's text. It is how you answer "why did the bill jump" without guessing.

Is it ready for 9am on Monday? For random blips, yes, and I have the numbers. For a synchronized burst, not until the shared rate limiter is on. For a real outage, the gateway buys seconds, and the keyword rules have to cover the rest. I would put all three in the runbook before the first ticket goes through.
