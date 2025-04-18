# Plan: Make Emergency Button Prominent

**Goal:** Make the "Attempt Emergency Neural Realignment" button the most obvious element on the critical failure screen by increasing its contrast and adding a pulsating glow effect.

**File to Modify:** `src/components/RedAlertInterface/RedAlertInterface.module.scss`

**Steps:**

1.  **Modify `.actionButton` Styles:**
    *   Change `background-color` from `#500` to `#f00` (bright red).
    *   Change `color` from `#f00` to `#fff` (white).
    *   Change `border` from `2px solid #f00` to `2px solid #fff` (white border).
    *   Update the `&:hover` state:
        *   `background-color: #d00;` (Slightly darker red)
        *   `color: #fff;` (Keep white text)
        *   `border-color: #eee;` (Slightly dimmer border)

2.  **Define `pulseGlow` Animation:** Add a new `@keyframes` rule:
    ```scss
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 10px 5px rgba(255, 255, 255, 0.7); } /* White glow */
      50% { box-shadow: 0 0 20px 10px rgba(255, 255, 255, 0.3); } /* Larger, fainter glow */
    }
    ```

3.  **Apply `pulseGlow` Animation:**
    *   Remove the old `animation: pulse 1s infinite;` from `.actionButton`.
    *   Add `animation: pulseGlow 1.5s infinite;` to `.actionButton`.

**Summary of CSS Changes:**

```diff
--- a/src/components/RedAlertInterface/RedAlertInterface.module.scss
+++ b/src/components/RedAlertInterface/RedAlertInterface.module.scss
@@ -107,17 +107,19 @@
 }

 .actionButton {
-  background-color: #500;
-  color: #f00;
-  border: 2px solid #f00;
+  background-color: #f00; /* Changed */
+  color: #fff; /* Changed */
+  border: 2px solid #fff; /* Changed */
   padding: 10px 20px;
   font-size: 16px;
   cursor: pointer;
-  animation: pulse 1s infinite;
+  /* animation: pulse 1s infinite; */ /* Removed old pulse */
+  animation: pulseGlow 1.5s infinite; /* Added glow */
   font-family: 'Courier New', monospace; /* Ensure button uses the same font */

   &:hover {
-    background-color: #700;
-    color: #ffcccc;
+    background-color: #d00; /* Slightly darker red on hover */
+    color: #fff; /* Keep text white */
+    border-color: #eee; /* Slightly dimmer border */
   }
 }

@@ -155,3 +157,8 @@
   50% { opacity: 0.4; }
   100% { opacity: 0.9; }
 }
+
+@keyframes pulseGlow { /* Added */
+  0%, 100% { box-shadow: 0 0 10px 5px rgba(255, 255, 255, 0.7); }
+  50% { box-shadow: 0 0 20px 10px rgba(255, 255, 255, 0.3); }
+}