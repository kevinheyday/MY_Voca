MY VOCA V5.3.145
Base: V5.3.144

Main change:
- Standardized playback scrolling into one shared helper: mvPlaybackScrollTo()
- DAY learning and MY 수업 now use the same minimal-movement scroll policy.
- Removed DAY's repeated window.scrollTo({behavior:'smooth'}) behavior.
- If the current reading element is already sufficiently visible, no scroll occurs.
- Playback scrolling now uses block:'nearest' and behavior:'auto' to avoid competing smooth animations in Kakao in-app browser.
- Shared scroll state resets when speech stops.

Preserved:
- lesson data/routing
- speaking Korean paired highlighting
- meaning playback anchored to current lower #meaning
- repeat/infinite-repeat logic
- recording
- quiz/chunk/speaking functionality
- home compact lesson cards
- lesson selection checkboxes
- all existing playback highlighting logic

Architecture rule going forward:
- New playback/navigation features should reuse shared helpers instead of creating separate scroll implementations.
