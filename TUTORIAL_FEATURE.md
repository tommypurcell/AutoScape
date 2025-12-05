# Tutorial Walkthrough Feature

## Overview

The Tutorial Walkthrough is an interactive, step-by-step guide that helps new users understand how to use AutoScape. It highlights key UI elements and provides contextual instructions at each step of the design creation process.

## Features

✨ **Interactive Highlighting** - Spotlights specific UI elements with a visual overlay
📍 **Smart Positioning** - Tutorial cards automatically position themselves relative to highlighted elements
📊 **Progress Tracking** - Shows users where they are in the tutorial journey
💾 **Persistent State** - Remembers if a user has completed the tutorial (using localStorage)
🎯 **Page-Aware** - Adapts to show relevant steps based on the current page

## How It Works

### 1. Tutorial Steps Definition

Tutorial steps are defined in `/data/tutorialSteps.ts`. Each step includes:

```typescript
{
  id: 'unique-step-id',
  title: 'Step Title',
  description: 'Detailed explanation of what this step is about',
  targetElement: '[data-tutorial="element-id"]', // CSS selector
  page: 'upload' | 'landing' | 'processing' | 'results',
  position: 'top' | 'bottom' | 'left' | 'right' | 'center',
  action: 'What the user should do',
  image?: 'path/to/screenshot.png' // Optional
}
```

### 2. Tutorial Component

The `TutorialWalkthrough` component (`/components/TutorialWalkthrough.tsx`) handles:
- Rendering the tutorial overlay
- Highlighting target elements
- Managing step navigation
- Tracking completion

### 3. Data Attributes

UI elements that need to be highlighted have `data-tutorial` attributes:

```tsx
<div data-tutorial="yard-upload">
  <UploadArea ... />
</div>
```

## Usage

### Starting the Tutorial

Users can start the tutorial in two ways:

1. **From Landing Page**: Click the "How It Works" button
2. **Programmatically**: Call `handleStartTutorial()` from the app

### Tutorial Flow

1. **Landing Page** (1 step)
   - Welcome message and overview

2. **Upload Page** (5 steps)
   - Upload yard photo
   - Select style references
   - Choose aesthetic
   - Add preferences
   - Generate design

3. **Processing Page** (1 step)
   - Wait for AI processing

4. **Results Page** (7 steps)
   - View renders
   - Compare before/after
   - Check 2D plan
   - Review budget
   - Save design
   - Create new design
   - Completion message

## Customization

### Adding New Steps

1. Add a new step to `tutorialSteps.ts`:

```typescript
{
  id: 'my-new-step',
  title: 'New Feature',
  description: 'This is how to use the new feature',
  targetElement: '[data-tutorial="new-feature"]',
  page: 'upload',
  position: 'bottom',
  action: 'Click the new feature button'
}
```

2. Add the data attribute to your UI element:

```tsx
<button data-tutorial="new-feature">
  New Feature
</button>
```

### Styling

The tutorial uses Tailwind CSS classes. Key styling elements:

- **Overlay**: Dark background with 60% opacity
- **Spotlight**: Green glow around highlighted elements
- **Card**: White rounded card with gradient header
- **Progress Bar**: Shows completion percentage

### Positioning Logic

The tutorial card automatically positions itself based on the `position` property:
- `top`: Above the element
- `bottom`: Below the element
- `left`: To the left of the element
- `right`: To the right of the element
- `center`: Center of the screen (for non-targeted steps)

## State Management

### localStorage Keys

- `autoscape_tutorial_completed`: Set to `'true'` when tutorial is completed

### React State

```typescript
const [showTutorial, setShowTutorial] = useState(false);
const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
  return localStorage.getItem('autoscape_tutorial_completed') === 'true';
});
```

## Best Practices

1. **Keep steps concise**: Each step should focus on one action
2. **Use clear language**: Avoid jargon, explain features simply
3. **Provide context**: Explain WHY a feature is useful, not just HOW to use it
4. **Test on mobile**: Ensure tutorial works on all screen sizes
5. **Update with features**: When adding new features, add corresponding tutorial steps

## Accessibility

- Tutorial can be skipped at any time
- Keyboard navigation supported (Next/Previous buttons)
- High contrast spotlight for visibility
- Clear progress indicators

## Future Enhancements

Potential improvements:
- [ ] Video demonstrations in steps
- [ ] Interactive "try it yourself" mode
- [ ] Multi-language support
- [ ] Analytics tracking for drop-off points
- [ ] Tooltips for quick hints (non-blocking)
- [ ] Tutorial replay option in settings

## Troubleshooting

### Element not highlighting
- Check that the `data-tutorial` attribute matches the `targetElement` selector
- Ensure the element is rendered when the step is active
- Verify the element is not hidden by CSS

### Tutorial not appearing
- Check that `isOpen` prop is `true`
- Verify steps array is not empty
- Check browser console for errors

### Position issues
- Try different `position` values
- Use `center` for elements that may not be visible
- Ensure parent elements don't have `overflow: hidden`

## Code Example

```tsx
// In your component
import { TutorialWalkthrough } from './components/TutorialWalkthrough';
import { tutorialSteps } from './data/tutorialSteps';

function App() {
  const [showTutorial, setShowTutorial] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowTutorial(true)}>
        Start Tutorial
      </button>
      
      <TutorialWalkthrough
        steps={tutorialSteps}
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          localStorage.setItem('tutorial_completed', 'true');
          setShowTutorial(false);
        }}
        currentPage="upload"
      />
    </>
  );
}
```

## Credits

Built with:
- React + TypeScript
- Tailwind CSS
- Lucide React Icons
