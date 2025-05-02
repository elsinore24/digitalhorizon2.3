# Plan: Adjust Critical Failure Screen Padding for Mobile

**Goal:** Reduce the top padding on the "Critical System Failure" screen (`RedAlertInterface` component) for mobile devices (specifically iOS) to prevent content from being cut off at the bottom.

**File to Modify:** `src/components/RedAlertInterface/RedAlertInterface.module.scss`

**Steps:**

1.  **Add Media Query:** Introduce a media query targeting smaller screens:
    ```scss
    @media (max-width: 768px) {
      /* Mobile styles go here */
    }
    ```
2.  **Override Padding:** Inside the media query, specifically target the main container class (`.redAlertContainer`) and reduce its top padding:
    ```scss
    .redAlertContainer {
      padding-top: 5px;
    }
    ```

**Implementation:** Switch to Code mode to apply these changes to the SCSS file.