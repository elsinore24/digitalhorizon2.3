# Signal Tuning: Stability Gauge Implementation Plan

With the main waveform display providing crucial clarity feedback, the next logical step is to implement the Stability Gauge visualization. This gives the player a more direct, quantifiable measure of how close they are to achieving a lock on the currently dominant interpretation.

Here's a plan for implementing the Stability Gauge, likely as a separate visual element within your `SignalTuningInterface.jsx` component:

## Access Necessary State

Your gauge rendering logic needs access primarily to:

- `dominantStability`: The 0.0 to 1.0 value representing the stability of the currently dominant signal interpretation.
- `lockThreshold`: The value needed to achieve a lock (e.g., 0.85 from our previous design).

## Choose Visual Representation

Decide how you want the gauge to look. Common options:

- **Horizontal or Vertical Bar:** A simple rectangle that fills up. Easy to implement with HTML `<div>` elements and CSS, or SVG `<rect>`.
- **Radial Gauge/Dial:** A circular arc that fills, like a speedometer. More complex, often best done with SVG `<path>` elements or a charting library.
- **Numeric Display:** Simply showing the percentage (e.g., `Math.round(dominantStability * 100) + '%'`). Often used in addition to a visual gauge.

**Recommendation:** A simple horizontal bar is often effective, easy to implement, and quick to read.

## Implement Rendering Logic (Example using HTML/CSS Bar)

Add elements to your `SignalTuningInterface.jsx`'s render method:

```jsx
// Inside SignalTuningInterface component's return statement:
// ... other elements ...

<div className="stability-gauge-container">
    <div className="stability-gauge-label">Signal Stability</div>
    <div className="stability-gauge-bar-background">
        <div
            className="stability-gauge-bar-fill"
            style={{ width: `${Math.min(dominantStability * 100, 100)}%` }} // Fill based on stability
        ></div>
        {/* Optional: Mark the threshold */}
        <div
            className="stability-gauge-threshold-marker"
            style={{ left: `${lockThreshold * 100}%` }}
        ></div>
    </div>
    {/* Optional: Numeric display */}
    <div className="stability-gauge-value">
        {Math.round(dominantStability * 100)}%
    </div>
</div>

// ... other elements ...
```

Add corresponding CSS for styling:

```css
/* Example CSS */
.stability-gauge-container {
    width: 80%; /* Or desired width */
    margin: 10px auto;
    text-align: center;
}

.stability-gauge-label {
    font-size: 0.8em;
    color: #ccc;
    margin-bottom: 4px;
}

.stability-gauge-bar-background {
    height: 15px;
    background-color: #333; /* Dark background */
    border-radius: 7px;
    position: relative;
    overflow: hidden; /* Keep fill inside */
    border: 1px solid #555;
}

.stability-gauge-bar-fill {
    height: 100%;
    background-color: #4a90e2; /* Blue fill color */
    border-radius: 7px;
    transition: width 0.1s linear; /* Smooth fill animation */
    /* Add gradient or other effects if desired */
}

.stability-gauge-threshold-marker {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: rgba(255, 255, 255, 0.5); /* Semi-transparent white line */
    /* 'left' is set inline via style prop */
}

.stability-gauge-value {
    font-size: 0.9em;
    color: #eee;
    margin-top: 4px;
}
```

## Add Dynamic Feedback (Near Threshold)

Enhance the visual feedback when `dominantStability` gets close to `lockThreshold`.

In JSX/JavaScript: You could conditionally add a CSS class:

```jsx
 <div
     className={`stability-gauge-bar-fill ${
         dominantStability > lockThreshold * 0.9 && dominantStability < lockThreshold
             ? 'nearing-threshold'
             : ''
     }`}
     style={{ width: `${Math.min(dominantStability * 100, 100)}%` }}
 ></div>
```

In CSS: Define the `nearing-threshold` class:

```css
.stability-gauge-bar-fill.nearing-threshold {
    background-color: #f5a623; /* Change color to orange/yellow */
    animation: pulse-warning 0.7s infinite alternate; /* Add pulsing effect */
}

@keyframes pulse-warning {
    from { opacity: 1; }
    to { opacity: 0.7; }
}
```

## Triggering Updates

Since this gauge depends directly on `dominantStability`, ensure the component re-renders whenever that state value changes. If `dominantStability` is part of your component's state or derived from props/context that cause re-renders, this should happen automatically in React.

By adding this stability gauge, you give the player a clear target and progress indicator, complementing the more nuanced feedback from the waveform display and making the goal of achieving a stable lock much more tangible.