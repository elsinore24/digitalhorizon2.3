import { useState, useEffect, useRef, useCallback } from 'react';

const useAutoScroll = ({
  scrollRef,
  audioInstance,
  isPlaying,
  isPausedByUser,
  isAutoScrollEnabled,
  totalScrollableHeight,
  audioDuration,
  onScrollFrame, // Add onScrollFrame callback
  // debounceInterval = 100, // Debounce removed for testing
  snapThreshold = 50
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  // const [showResumeButton, setShowResumeButton] = useState(false); // Resume button removed
  const scrollableHeightRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const animationFrameIdRef = useRef(null);
  const observerRef = useRef(null);
  // const debounceTimeoutRef = useRef(null); // Debounce removed
  const manualScrollPositionRef = useRef(null); // Keep for potential future use

  // Cache scrollable height and paragraph positions
  const paragraphPositionsRef = useRef([]);
  
  useEffect(() => {
    if (totalScrollableHeight > 0) {
      scrollableHeightRef.current = totalScrollableHeight;
      
      // Find all paragraph elements and cache their positions
      if (scrollRef.current) {
        const paragraphs = scrollRef.current.querySelectorAll('p');
        paragraphPositionsRef.current = Array.from(paragraphs).map(p => {
          return p.offsetTop;
        });
      }
    }
  }, [totalScrollableHeight, scrollRef]);

  // Setup IntersectionObserver for paragraph visibility
  useEffect(() => {
    if (scrollRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // Could be used for lazy loading or analytics
            }
          });
        },
        { root: scrollRef.current, threshold: 0.5 }
      );

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [scrollRef]);

  // Scroll update using native smooth scroll (NO DEBOUNCE)
  const updateScrollPosition = useCallback((position) => {
    if (scrollRef.current) {
      // Check if position is a valid number before scrolling
      if (typeof position === 'number' && isFinite(position)) {
        // console.log(`[useAutoScroll Smooth - No Debounce] Scrolling to: ${position.toFixed(2)}`); // Keep log commented for now
        scrollRef.current.scrollTo({
          top: position,
          behavior: 'smooth' // Use native smooth scrolling
        });
      } else {
        console.warn(`[useAutoScroll Smooth - No Debounce] Invalid scroll position: ${position}`);
      }
    }
  }, [scrollRef]); // Only depends on scrollRef now

  // Main scroll effect
  useEffect(() => {
    const scrollText = (timestamp) => {
      // Add checks for audioDuration and scrollableHeightRef.current being valid numbers > 0
      if (!audioInstance || !scrollRef.current || !(scrollableHeightRef.current > 0) || !(audioDuration > 0)) {
        // console.warn('[useAutoScroll] Missing instance, ref, valid height, or valid duration. Skipping scrollText.');
        // Request next frame even if skipping calculation, to keep the loop alive if conditions change
        if (isPlaying && !isPausedByUser && isAutoScrollEnabled) {
           animationFrameIdRef.current = requestAnimationFrame(scrollText);
        }
        return;
      }

      const currentTime = audioInstance.seek ? audioInstance.seek() : audioInstance.currentTime;
      const progress = Math.min(1, Math.max(0, currentTime / audioDuration));

      // Execute the onScrollFrame callback if provided
      if (typeof onScrollFrame === 'function') {
        onScrollFrame(currentTime, progress);
      }

      const targetScrollTop = scrollableHeightRef.current * progress;

      // Handle initial scroll jump (Temporarily disabled for testing)
      // if (currentTime < 0.2 && scrollRef.current.scrollTop !== 0) {
      //   // If near the start and not already at the top, jump instantly to top
      //   console.log('[useAutoScroll] Near start, jumping to top.');
      //   scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
      //   setScrollProgress(0); // Ensure progress reflects top position
      //   lastScrollTimeRef.current = timestamp; // Update last scroll time
      // } else {
        // Proceed with smooth scroll update without throttling
        updateScrollPosition(targetScrollTop); // Call the simplified function
        setScrollProgress(progress);
        lastScrollTimeRef.current = timestamp; // Update last scroll time even without throttle for potential future use
      // }

      if (isPlaying && !isPausedByUser && isAutoScrollEnabled) {
        animationFrameIdRef.current = requestAnimationFrame(scrollText);
      }
    };

    // --- Debugging: Check conditions ---
    console.log(`[useAutoScroll Condition Check] isPlaying: ${isPlaying}, isPausedByUser: ${!isPausedByUser}, isAutoScrollEnabled: ${isAutoScrollEnabled}`);
    if (isPlaying && !isPausedByUser && isAutoScrollEnabled) {
      console.log('[useAutoScroll Condition Check] Conditions met, requesting animation frame.');
      setIsScrolling(true);
      // setShowResumeButton(false); // Resume button removed
      if (!animationFrameIdRef.current) { // Avoid duplicate requests
         animationFrameIdRef.current = requestAnimationFrame(scrollText);
         console.log(`[useAutoScroll Condition Check] Requested frame ID: ${animationFrameIdRef.current}`);
      }
    } else {
      console.log('[useAutoScroll Condition Check] Conditions NOT met, cancelling frame (if any).');
      setIsScrolling(false);
      if (animationFrameIdRef.current) {
         cancelAnimationFrame(animationFrameIdRef.current);
         console.log(`[useAutoScroll Condition Check] Cancelled frame ID: ${animationFrameIdRef.current}`);
         animationFrameIdRef.current = null;
      }
    }
    // --- End Debugging ---

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      // No debounce timeout to clear
    };
  }, [isPlaying, isPausedByUser, isAutoScrollEnabled, audioInstance, audioDuration, updateScrollPosition, onScrollFrame]); // Add onScrollFrame to dependencies

  // Handle manual scroll interruption
  const handleManualScroll = useCallback(() => {
    // This function is now primarily responsible for *detecting* manual scroll
    // which might pause auto-scroll if isScrolling is true.
    // The actual pausing happens in the main useEffect based on isPausedByUser.
    // We might add logic here later if needed (e.g., setting a flag).
    if (isScrolling && scrollRef.current) {
      // console.log('[useAutoScroll] Manual scroll detected while auto-scrolling.');
      manualScrollPositionRef.current = scrollRef.current.scrollTop;
      // setShowResumeButton(true); // Removed as the button is gone
    }
  }, [isScrolling, scrollRef]); // Dependency remains isScrolling

  // Resume auto-scroll function (kept for potential future use, but button is removed)
  const resumeAutoScroll = useCallback(() => {
    // This function is currently not called from the UI
    if (scrollRef.current && manualScrollPositionRef.current !== null) {
      const currentTime = audioInstance.seek ? audioInstance.seek() : audioInstance.currentTime;
      const progress = Math.min(1, Math.max(0, currentTime / audioDuration));
      const targetScrollTop = scrollableHeightRef.current * progress;
      updateScrollPosition(targetScrollTop);
      // setShowResumeButton(false); // Removed as the button is gone
      manualScrollPositionRef.current = null; // Reset manual position
    }
  }, [audioInstance, audioDuration, updateScrollPosition, scrollRef]);

  return {
    scrollProgress,
    isScrolling,
    updateScrollPosition,
    handleManualScroll,
    resumeAutoScroll // Keep resume function in case needed internally later
  };
};

export default useAutoScroll;