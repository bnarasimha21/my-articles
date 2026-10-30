# Article 10 post copy (LinkedIn + X)

Attach the cover image to the LinkedIn post. For the X article header use llm-gateway-x-header-2to1.png (3200x1600), or llm-gateway-x-header.png (5:2) if X shows a wider frame.

## LinkedIn post (main)

Paste this into the post box. Only the first two lines show before "see more", so they carry the hook. It opens with a belief that breaks, then puts the reader's own app in the picture. About 595 characters.

```
I was sure my LLM retry logic was solid. I made 20% of attempts fail on purpose and it dropped zero calls out of 200.

Then I pretended it was 9am on Monday and 50 clients hit it at the same second. 20 of them got an error.

I had also guessed my worst case was 3 requests per call. But it was 12. And one harmless line in a prompt made my bill go up 25% with no error anywhere.

If your app retries LLM calls, check these three things before your own 9am Monday. I wrote up how I found each one and what I would fix before launch. It is attached below.

#LLM #AIEngineering #Claude #Reliability
```

You are publishing this as a LinkedIn article, so paste this into the post text box in the publish dialog. The article attaches to the post as a card, which means no link is needed and there is no second post. If you ever share a link to another site instead, put it in the first comment.

## LinkedIn post (alternative: plain results summary)

Paste this into the post box. Only the first two lines show before "see more", so they carry the hook. About 550 characters. More of a report than a story.

```
My LLM gateway retried its way through 20% of attempts failing without dropping a single call.

Then I simulated 9am on Monday. 20 of 50 clients got an error anyway.

Two more things I got wrong:

→ I guessed my worst case was 3 requests per call. It was 12, because two retry loops multiply.
→ One timestamp at the top of a prompt made caching 25% more expensive than no caching. Nothing errored.

The full write-up with the numbers is attached below.

Which of these would you have caught before production?

#LLM #AIEngineering #Claude #Reliability
```

Same as above: the article attaches below the post, so no link is needed.

## LinkedIn post (longer alternative, about 1,160 characters)

Use this if you want the full story in the post. It adds the platform lead's questions, the jitter finding and the $85 correction.

```
My LLM gateway retried its way through 20% of attempts failing without dropping a single call.

Then I simulated 9am on Monday. 20 of 50 clients got an error anyway.

A platform lead asked me three things before an LLM feature could go live. What happens when Anthropic rate-limits us? What happens when it is down? What will it cost a month? So I built a small gateway and tried to break it.

Three things surprised me:

→ Retries hide random errors completely, but they cannot beat a crowd. Jitter, the standard advice, made no difference to how many clients got through.
→ Two retry loops multiply. I guessed my worst case was 3 requests per call. It was 12.
→ One timestamp at the top of a prompt made caching 25% more expensive than no caching. Nothing errored.

I also corrected a number from my last article. The $85 a month for Sonnet came from the CLI's cost field, which is not what the API bills. The real figure is somewhere between $45 and $85 until I measure it.

The full write-up has the simulation, the measured costs, and what I would fix before launch.

Which of these would you have caught before production?

#LLM #AIEngineering #Claude #Reliability #SoftwareEngineering
```



## Alternative hooks (swap in as line 1 to test)

- "I guessed my worst case was 3 requests per call. It was 12."
- "One timestamp in a prompt made caching cost 25% more than no caching. Nothing errored."
- "A platform lead asked me what happens at 9am on Monday. I did not have a number."

If you use one of these, keep the 9am line as line 2.

## X post (short, fits 280 characters)

```
I broke my LLM gateway on purpose. 20% of calls failed and retries still completed all 200.

Then 50 clients hit it in the same second, against a server that allows 10 a second. 20 of them got an error.

Write-up:
```

Link goes right after the last line. No hashtags. About 240 characters with the link counted as 23.

## X post (longer, if you have long posts enabled)

```
I broke my LLM gateway on purpose. 20% of calls failed and retries still completed all 200.

Then 50 clients hit it in the same second, against a server that allows 10 a second. 20 of them got an error.

I also found that two retry loops turned my 4 attempts into 12 requests, and that one timestamp at the top of a prompt made caching cost 25% more than no caching. Nothing errored in either case.

Write-up with the numbers:
```



## Pattern to reuse for every article

1. Line 1 is the most surprising real number from the article, or a result that contradicts what you expected.
2. Line 2 is the twist that makes line 1 interesting.
3. One short paragraph of context, with the story and the stakes.
4. Three arrows, each a finding with a number in it.
5. One honest line, like a correction, a miss, or something you did not test. This builds trust and gives people something to reply to.
6. End with a question the reader can answer in one line.

Lead with a number and a twist, not a summary line.

Reply to early comments yourself. It helps the post, and the question at the end is there to start them.

## What changed (no-ai-slop pass)

- Removed colon-reveal openers and "here is what you need to check" style setups.
- Replaced "retries make errors disappear" style summaries with the specific numbers (3 vs 12, 25%, 20 of 50).
- Cut a binary-contrast kicker ("retries beat blips, not crowds") from the X post and ended on a concrete fact (jitter made no difference).
- Kept one colon before the three-point list and one before the link, since both introduce a list or a label.
- No em dashes, no emoji headers.

