# Why I Use Remotion for Videos and Thumbnails (With Help From Claude)

*Published: February 2026*

---

I wanted to make a video programmatically. It had animated text reveals, code snippets, feature cards sliding in, and transitions timed to a voiceover.

The usual path would be to open a video editor, drag assets around, and spend hours tweaking timings. I'd been curious about Remotion for a while. This time I decided to actually try it.

---

## Discovering Remotion

Remotion is a framework that lets you create videos using React. You define scenes as components, control timing with frames, and render to MP4. Everything is code.

As a developer, I think in components and functions. Why should video creation be any different?

There's a learning curve though. Remotion has its own patterns: `useCurrentFrame()`, `interpolate()`, `<Sequence>` components. You need to understand frame-based timing, spring animations, and how to structure compositions.

This is where Claude came in.

---

## How Claude Code Fits In

I've been using Claude Code a lot, and for this project, Claude Opus 4.5 became my collaborator.

The workflow is pretty natural. I describe what I want ("Create a scene where package names type out character by character with a blinking cursor, then badges fade in below") and Claude generates the component, handles the frame calculations, and sets up the animations.

When something doesn't look right, I describe the issue. Claude iterates. We go back and forth until the timing feels right.

What surprised me was how well it understood visual intent from descriptions. I didn't need to specify exact frame numbers or easing functions upfront. I'd say "make it feel snappier" or "the text reveal should be more dramatic," and Claude would translate that into code.

It goes beyond just writing what I ask for. I can say "I need this kind of video" and Claude will suggest animation approaches I hadn't considered. I pick the ones I like, and it starts building out the scenes.

---

## Matching Animations to Voiceover

This is where things got interesting.

I started creating voiceovers separately and then matching the animations frame by frame to the narration. I tell Claude the duration of each segment (how long I spoke, where captions should appear, when transitions should hit) and it adjusts the frame counts accordingly.

Instead of manually calculating that a 3.5-second segment at 30fps needs exactly 105 frames, I just say "this scene should be 3.5 seconds to match the voiceover." Claude handles the math.

Opus 4.5 maintains context about which components make up each scene and what animations are already in place. When I ask it to adjust durations, it understands the full composition and knows which frame values to update.

---

## Describing Animations in Natural Language

If you've seen an animation somewhere and want something similar, you can just describe it.

"I want the text to slide in from the left with a slight bounce, like that motion graphics style you see in tech product launches."

Claude tries to recreate it, gives you options, and you iterate from there. Getting to a working version is fast. You're describing intent, not keyframes.

---

## The Unexpected Win: Thumbnails

Here's something I didn't expect.

Remotion isn't just for videos. You can render single frames as images. I realized I could use the same workflow for thumbnails.

Instead of opening Figma or Photoshop, I created a Thumbnail component. Same design system. Same fonts. Same color palette as the video. Perfect consistency.

```jsx
<Composition
  id="Thumbnail"
  component={Thumbnail}
  durationInFrames={1}
  fps={30}
  width={1280}
  height={720}
/>
```

One frame. Rendered as PNG. Done.

Multiple variants just by tweaking props. No manual export dance. Just `npx remotion still Thumbnail out/thumbnail.png`.

I describe what the thumbnail should contain and ask Claude for layout suggestions, color combinations, ways to make it visually cohesive. Claude proposes layouts, I pick what works, and we refine.

---

## Why Not Canva?

I'd used Canva before for some of this. It's easy, no question. It has AI features that help you be creative, and for non-technical users it's a good choice.

But for someone on the technical side, Remotion with Claude Code has an edge.

In Canva, you're doing the layout work yourself within the tool's constraints. With Remotion, I can ask Claude to look at existing design ideas, suggest improvements, and generate the whole thing as a React component. I don't have to manually adjust anything in a GUI. I describe what I want and review the output.

You don't have to understand Remotion's internals to use it. You just need to know the project is there. When you run it, Remotion opens a local web interface where you can preview every scene, play individual animations or the full composed video, see how long each section takes, and adjust accordingly.

The feedback loop of code, preview, iterate is fast.

---

## Try It Yourself

If you want to try this workflow, here's what I'd suggest.

Start with Remotion's official templates. They cover everything from basic hello-world to TikTok-style captions and prompt-to-video generation. Run `npx create-video@latest` and you'll have a working project in minutes.

I've also put together a small set of reusable starter components (the same ones I reference in this article):

- **CodeTyping**: Typing animation with blinking cursor. Configurable speed, colors, fonts.
- **TextReveal**: Word-by-word entrance with multiple styles: fade, slideUp, scaleIn.
- **FeatureCard**: Animated cards with staggered slide-in.
- **Thumbnail**: Single-frame composition for thumbnails.

Here's what the CodeTyping component looks like in practice:

```jsx
import { CodeTyping } from "./components/CodeTyping";

const CodeScene: React.FC = () => {
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", justifyContent: "center", alignItems: "center",
      background: "#0F0F1A", padding: 60,
    }}>
      <CodeTyping
        code={`const greeting = "Hello, Remotion!";
console.log(greeting);`}
        fontSize={22}
        typingSpeed={2}
      />
    </div>
  );
};
```

Copy the components into your project, wire them into your compositions, and start asking Claude to build scenes with them. Once Claude sees the patterns, it generates new variations that fit right in.

I went from zero Remotion experience to a polished video in a few days. Most of that time was spent on creative decisions, not technical struggles.

---

*Built with Remotion and Claude Opus 4.5*
