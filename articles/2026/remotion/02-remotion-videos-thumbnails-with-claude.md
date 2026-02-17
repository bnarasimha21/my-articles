# Why I Use Remotion for Videos and Thumbnails (With Help From Claude)


I wanted to create a video. It had animated text reveals, code snippets, feature cards sliding in, and transitions timed to a voiceover.

The usual path would be to open a video editor, drag assets around, and spend hours tweaking timings. 

But, I had recetly come across Remotion. So wanted to try it.

## Discovering Remotion

Remotion is a framework that lets you create videos using React. You define scenes as components, control timing with frames, and render to MP4. Everything is code.

And, when there is code, there is Claude.

## How Claude Code Fits In

I have been using Claude Code a lot. For this project, Claude Opus 4.5 was a great collaborator.

The workflow is pretty natural. I describe what I want ("Create a scene where Title is typed out character by character with a blinking cursor, then badges fade in below") and Claude generates the component, handles the frame calculations, and sets up the animations.

When something does not look right, I describe the issue. Claude iterates. We go back and forth until it feels right.

Since the models are realy good at understanding visual intent from descriptions, I did not need to specify exact frame numbers or easing functions upfront. I would say "make it feel snappier" or "the text reveal should be more dramatic," and Claude would translate that into code.

It goes beyond just writing what I ask for. I can say "I need this kind of video" and Claude will suggest animation approaches I had not considered. I pick the ones I like, and it starts building out the scenes.

## Matching Animations to Voiceover

This is where things got interesting.

I started creating voiceovers separately and then matching the animations frame by frame to the narration. I tell Claude the duration of each segment (how long I spoke, where captions should appear, when transitions should hit) and it adjusts the frame counts accordingly.

Instead of manually calculating that a 3.5-second segment at 30fps needs exactly 105 frames, I just say "this scene should be 3.5 seconds to match the voiceover." Claude handles the math.

Opus 4.5 maintains context about which components make up each scene and what animations are already in place. When I ask it to adjust durations, it understands the full composition and knows which frame values to update.

## Describing Animations in Natural Language

If you have seen an animation somewhere and want something similar, you can just describe it.

"I want the text to slide in from the left with a slight bounce, like that motion graphics style you see in tech product launches."

Claude tries to recreate it, gives you options, and you iterate from there. Getting to a working version is fast. You are describing intent, not keyframes.

## The Unexpected Win: Thumbnails

Here is something I did not expect.

Remotion is not just for videos. You can render single frames as images. I realized I could use the same workflow for thumbnails.

Instead of opening Figma or Photoshop, I created a Thumbnail component. Same design system. Same fonts. Same color palette as the video. Perfect consistency.



One frame. Rendered as PNG. Done.

Multiple variants just by tweaking props. No manual export dance. Just `npx remotion still Thumbnail out/thumbnail.png`.

I describe what the thumbnail should contain and ask Claude for layout suggestions, color combinations, ways to make it visually cohesive. Claude proposes layouts, I pick what works, and we refine.

## Why Not Canva?

I have used Canva before for some of this. It is easy, no question. It has AI features that help you be creative, and for non-technical users it is a good choice.

But for someone on the technical side, Remotion with Claude Code has an edge.

In Canva, you are doing the layout work yourself within the tool's constraints. With Remotion, I can ask Claude to look at existing design ideas, suggest improvements, and generate the whole thing as a React component. I do not have to manually adjust anything in a GUI. I describe what I want and review the output.

You do not have to understand Remotion's internals to use it. You just need to know the project is there. When you run it, Remotion opens a local web interface where you can preview every scene, play individual animations or the full composed video, see how long each section takes, and adjust accordingly.

The feedback loop of code, preview, iterate is fast.

## Try It Yourself

If you want to try this workflow, here is what I would suggest.

Start with Remotion's official templates. They cover everything from basic hello-world to TikTok-style captions and prompt-to-video generation. Run `npx create-video@latest` and you'll have a working project in minutes.

I went from zero Remotion experience to a polished video in a few hours. Most of that time was spent on creative decisions, not technical struggles.

Creating videos and thumnails became much easier. If you like using Claude Code or Codex, then you will definitely love it!
