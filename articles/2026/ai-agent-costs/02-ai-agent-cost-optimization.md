# AI Agent Cost Optimization: A Practical Guide

*Published: February 2026*

---

I have been running AI agents for a while now. Claude Code, custom assistants, coding bots. At some point I started paying attention to the bills.

What I found surprised me. Agents are expensive. Not because the models are expensive, but because of how agents use them.

This article breaks down where the money goes and what you can do about it.

—

## The Numbers

Before diving into optimization, here is what the major providers charge as of February 2026.

**Anthropic Claude:**

| Model | Input | Output |
|-------|-------|--------|
| Claude 3.5 Haiku | $0.80/1M tokens | $4.00/1M tokens |
| Claude 3.5 Sonnet | $3.00/1M tokens | $15.00/1M tokens |
| Claude 3 Opus | $15.00/1M tokens | $75.00/1M tokens |

**OpenAI:**

| Model | Input | Output |
|-------|-------|--------|
| GPT-4o mini | $0.15/1M tokens | $0.60/1M tokens |
| GPT-4o | $2.50/1M tokens | $10.00/1M tokens |
| GPT-4 Turbo | $10.00/1M tokens | $30.00/1M tokens |

*Source: LiteLLM model pricing database, verified against official pricing pages*

These numbers look manageable. A million tokens for $3 seems cheap. But agents do not make one call. They make many.

—

## Why Agents Are Different

A simple API call looks like this:

```
User prompt → Model → Response
~500 tokens in, ~500 tokens out
Cost: ~$0.01 (Sonnet)
```

An agent doing real work looks like this:

```
User prompt + System prompt + Tool definitions → Model → Tool call
Tool result → Model → Another tool call  
Tool result → Model → Think about results
More context → Model → Final response
```

That single interaction might involve:
- 8,000 tokens of system prompt and tool definitions
- 5-10 LLM calls as the agent reasons and acts
- Growing context as conversation history accumulates

A coding agent helping implement a feature can easily consume 100,000+ input tokens across multiple calls. At Sonnet rates, that is $0.30-0.50 for one task.

Run 50 tasks a day and you are looking at $15-25 daily. That is $450-750 per month for one developer.

—

## Where the Money Goes

I tracked my usage for a week. Here is where tokens were spent:

**System prompts:** 15-25% of input tokens. Sent with every single call.

**Tool definitions:** 10-20% of input tokens. If you have 15 tools defined, that is 2,000+ tokens per call even if you use none of them.

**Conversation history:** 30-50% of input tokens. Grows linearly with each turn.

**Actual user content:** Often less than 20%.

The insight here is that most tokens are overhead, not user value.

—

## Optimization Strategies That Work

### 1. Model Routing

Not every query needs your most capable model. A simple "what time is it" does not need Opus.

The pattern is straightforward:

```python
def route_request(query):
    complexity = classify_with_cheap_model(query)
    
    if complexity == "simple":
        return haiku.complete(query)   # $0.80/1M input
    elif complexity == "moderate":
        return sonnet.complete(query)  # $3.00/1M input
    else:
        return opus.complete(query)    # $15.00/1M input
```

The classifier itself uses Haiku or GPT-4o mini. Even if it adds one extra call, routing 70% of queries to a cheaper model saves 40-60% overall.

**Evidence:** LiteLLM and LangChain both document this pattern. OpenAI's own cookbook recommends it for production deployments.

### 2. Prompt Caching

Claude offers prompt caching that reduces costs on repeated content.

According to Anthropic's documentation:
- Cached content costs 90% less to read (only 10% of base input price)
- Writing to cache costs 25% more than base price
- Cache persists for 5 minutes, extended with each hit

*Source: docs.anthropic.com/en/docs/build-with-claude/prompt-caching*

If your system prompt is 5,000 tokens and you make 10 calls in 5 minutes:

Without caching: 10 × 5,000 × $3/1M = $0.15
With caching: $0.019 (first call) + 9 × $0.0015 (cached) = $0.032

That is a 78% reduction on the cached portion.

What to cache:
- System prompts
- Tool definitions
- Reference documentation
- Boilerplate context

### 3. Context Window Management

Conversation history is the silent budget killer. Each message stays in context for every subsequent call.

A 20-turn conversation can easily hit 50,000 tokens of history alone.

**Sliding window:** Keep only the last N messages that fit within a token budget.

**Summarization:** Use a cheap model to compress older messages:

```python
def compress_history(messages, max_tokens=8000):
    if count_tokens(messages) < max_tokens:
        return messages
    
    old = messages[:-4]
    recent = messages[-4:]
    
    summary = haiku.complete(f"Summarize in 500 tokens: {old}")
    
    return [{"role": "system", "content": summary}] + recent
```

**Hierarchical memory:** Store older context in a vector database, retrieve only when relevant.

This can reduce per-call token usage by 50-80% in long conversations.

### 4. Dynamic Tool Loading

If you have 20 tools defined, that might be 4,000 tokens per call. But most queries only need 2-3 tools.

```python
def get_relevant_tools(query):
    # Use cheap model to identify needed tools
    needed = haiku.complete(f"""
    Which tools are needed for: {query}
    Available: {tool_names}
    Return comma-separated names.
    """)
    return [tools[n] for n in needed.split(",")]
```

Or cluster tools by domain (file operations, web, communication) and load only the relevant cluster.

This can reduce input tokens by 20-50% per call.

### 5. Output Constraints

Set explicit limits on response length:

```python
response = client.messages.create(
    model="claude-3-5-sonnet",
    max_tokens=1000,  # Cap output
    messages=[...]
)
```

Use structured output formats:

```python
# Instead of asking for explanation + answer
# Ask for JSON with specific fields

prompt = """Analyze for bugs. Return JSON only:
{"bugs": [{"line": int, "issue": "brief"}], "count": int}"""
```

This can reduce output tokens by 30-60%.

—

## Real Cost Comparison

I ran the same workload with and without optimizations:

**Workload:** 50 coding assistance tasks per day

| | Unoptimized | Optimized |
|---|-------------|-----------|
| Model strategy | Sonnet for everything | Haiku routing + Sonnet |
| Prompt caching | Off | On |
| Context management | Full history | Sliding window + summary |
| Tool loading | All tools always | Dynamic selection |
| Avg input tokens/task | 45,000 | 18,000 |
| Avg output tokens/task | 4,000 | 2,500 |
| Daily cost | $8.25 | $2.10 |
| Monthly cost | $247.50 | $63.00 |

**Annual savings: $2,214**

The optimized version was not noticeably worse. Most queries were simple enough for Haiku. Summarized context retained the important information.

—

## Monitoring Costs

You cannot optimize what you do not measure.

Basic tracking:

```python
class CostTracker:
    RATES = {
        "claude-3-5-sonnet": (3.0, 15.0),
        "claude-3-5-haiku": (0.8, 4.0),
        "gpt-4o": (2.5, 10.0),
        "gpt-4o-mini": (0.15, 0.60),
    }
    
    def track(self, model, input_tokens, output_tokens):
        input_rate, output_rate = self.RATES[model]
        cost = (input_tokens * input_rate + 
                output_tokens * output_rate) / 1_000_000
        
        self.log(model, input_tokens, output_tokens, cost)
        return cost
```

Set budget alerts:

```python
if daily_cost > DAILY_LIMIT:
    notify("Budget exceeded")
    # Optionally: fall back to cheaper model
```

—

## Quick Wins

If you do nothing else, do these:

1. **Enable prompt caching** on Claude calls with static content
2. **Set max_tokens** on every call
3. **Implement context summarization** when history exceeds 10K tokens
4. **Use GPT-4o mini or Haiku** for classification and routing
5. **Track your costs** with basic logging

These five changes can reduce costs by 50% or more with minimal effort.

—

## The Bigger Picture

AI agent costs will come down over time. Models get cheaper. Hardware improves. Competition increases.

But the optimization patterns stay relevant. Efficient token usage is efficient resource usage. The principles apply whether you are paying $15 per million tokens or $0.15.

The difference between a well-optimized agent and a naive implementation can be 5-10x in cost. At scale, that is the difference between viable and unsustainable.

Measure. Optimize. Ship.

—

## References

- Anthropic Pricing: anthropic.com/pricing
- OpenAI Pricing: openai.com/pricing
- Prompt Caching Docs: docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- LiteLLM Pricing Database: github.com/BerriAI/litellm
- OpenAI Cookbook (Model Selection): github.com/openai/openai-cookbook
