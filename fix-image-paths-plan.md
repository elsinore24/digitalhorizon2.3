# Plan to Fix Image Paths

**Objective:** Correct the image file extensions from `.png` to `.jpg` in `public/narratives/flashback_intro.json` to resolve 404 errors.

**Problem:** The application is attempting to load `pic2.png` and `pic3.png`, but the actual files in the `public/front_pic/` directory are `pic2.jpg` and `pic3.jpg`. This is causing "404 Not Found" errors.

**Analysis:**
- The error messages indicate issues with loading `/front_pic/pic2.png` and `/front_pic/pic3.png`.
- Listing the `public/front_pic/` directory confirms that `pic2.jpg` and `pic3.jpg` exist, while the `.png` versions do not.
- Searching the `src/` directory for `.jsx` files did not reveal the incorrect paths.
- Searching the `public/narratives/` directory for `.json` files located the incorrect paths in `public/narratives/flashback_intro.json` on lines 13 and 18.

**Plan:**

1.  Use the `apply_diff` tool to modify `public/narratives/flashback_intro.json`.
    *   Replace the string `/front_pic/pic2.png` with `/front_pic/pic2.jpg` on line 13.
    *   Replace the string `/front_pic/pic3.png` with `/front_pic/pic3.jpg` on line 18.
2.  Switch to Code mode to implement the changes using the `apply_diff` tool.

**Implementation Steps (for Code Mode):**

1.  Use the `apply_diff` tool with the path `public/narratives/flashback_intro.json`.
2.  Include two search/replace blocks in the `diff` parameter:
    *   Block 1: Search for `/front_pic/pic2.png` starting at line 13 and replace with `/front_pic/pic2.jpg`.
    *   Block 2: Search for `/front_pic/pic3.png` starting at line 18 and replace with `/front_pic/pic3.jpg`.
3.  Confirm the changes are applied successfully.
4.  Verify in the running application that the images load correctly and the 404 errors are resolved.