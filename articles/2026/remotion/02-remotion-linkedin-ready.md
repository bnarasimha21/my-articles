# Code Your Videos: Using Remotion and Claude Code Together

I needed a video with animated text reveals, sliding feature cards, and transitions timed to a voiceover.

The usual path? Open a video editor, drag assets around, spend hours tweaking timings.

But I had recently come across Remotion. So I decided to try it.

## What is Remotion?

Remotion (https://www.remotion.dev/) is a framework that lets you create videos using React. You define scenes as components, control timing with frames, and render to MP4.

Everything is code.

And when there is code, there is Claude.

## How Claude Code Fits In

I have been using Claude Code a lot. For this project, Claude Opus 4.5 was a great collaborator.

The workflow is natural:
→ I describe what I want
→ Claude generates the component
→ Handles frame calculations
→ Sets up animations

When something does not look right, I describe the issue. Claude iterates. We go back and forth until it feels right.

The models are really good at understanding visual intent. I did not need to specify exact frame numbers upfront.

I would say "make it feel snappier" or "the text reveal should be more dramatic" and Claude would translate that into code.

## Matching Animations to Voiceover

This is where things got interesting.

I created voiceovers separately, then matched animations frame by frame to the narration.

I tell Claude:
- How long each segment is
- Where captions should appear
- When transitions should hit

Instead of calculating that 3.5 seconds at 30fps = 105 frames, I just say "this scene should be 3.5 seconds."

Claude handles the math.

## The Unexpected Win: Thumbnails

Remotion is not just for videos. You can render single frames as images.

I realized I could use the same workflow for thumbnails.

Instead of opening Figma or Photoshop, I created a Thumbnail component. Same design system. Same fonts. Same color palette.

One frame. Rendered as PNG. Done.

Multiple variants just by tweaking props. No manual export dance.

## Why Not Canva?

Canva is easy. It has AI features. For non-technical users, it is a good choice.

But for developers, Remotion with Claude has an edge.

In Canva, you do the layout work yourself within the tool's constraints.

With Remotion, I describe what I want and Claude generates a React component. I review the output. No GUI clicking.

The feedback loop of code → preview → iterate is fast.

## Try It Yourself

Start with Remotion's official templates:
npx create-video@latest

I went from zero Remotion experience to a polished video in a few hours.

Most of that time was spent on creative decisions, not technical struggles.

If you use Claude Code or Cursor, you will love this workflow.

---

#remotion #claudeai #ai #developers #video #react
