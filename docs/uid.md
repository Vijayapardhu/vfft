\# UI/UX DOCUMENTATION



\# VFFT – Velangi Free Fire Tournament



\*\*Version:\*\* 2.0

\*\*Design Style:\*\* Modern Gaming Neo-Brutalism

\*\*Inspired By:\*\* Valorant + IPL + Cricbuzz + FIFA Ultimate Team + Supercell



\---



\# 1. Design Philosophy



VFFT should NOT feel like a normal website.



It should feel like:



\* A game launcher

\* An esports platform

\* A franchise dashboard

\* A trading card collection



Users should immediately feel:



> "This is an esports league."



\---



\# 2. Visual Language



Style:



\### Neo-Brutalism + Gaming



Characteristics:



\* Thick borders

\* Hard shadows

\* Bold typography

\* Animated cards

\* Sticker badges

\* Rotated elements

\* Large buttons

\* Card-based UI



\---



\# 3. Colors



\### Background



```css

\#FFFDF5

```



\### Black



```css

\#000000

```



\### Red



```css

\#FF6B6B

```



\### Yellow



```css

\#FFD93D

```



\### Purple



```css

\#C4B5FD

```



\### Green



```css

\#4ADE80

```



\### Blue



```css

\#60A5FA

```



\---



\# 4. Typography



Font:



\### Space Grotesk



Weights:



\* 700

\* 900



Headings:



Uppercase



Large



Bold



\---



\# 5. Layout System



Mobile-first.



Breakpoints:



```css

sm

640px



md

768px



lg

1024px



xl

1280px



2xl

1536px

```



\---



\# 6. Navigation



\## Mobile Bottom Navigation



```text

Home



Matches



Teams



Leaderboard



More

```



\---



\## Desktop Sidebar



```text

Home



Matches



Teams



Players



Auction



Leaderboard



Hall Of Fame



News



Rules

```



\---



\# 7. Route Structure



\---



\## Public Routes



```text

/



/teams



/players



/matches



/leaderboard



/news



/rules



/hall-of-fame



/about

```



\---



\## Authentication



```text

/login

```



Google Sign-In



\---



\## Player Routes



```text

/dashboard



/profile



/my-team



/my-matches



/achievements



/notifications

```



\---



\## Team Leader Routes



```text

/team/manage



/team/lineup



/team/squad



/team/history

```



\---



\## Franchise Routes



```text

/franchise



/franchise/statistics



/franchise/history



/franchise/players

```



\---



\## Admin Routes



```text

/admin



/admin/players



/admin/teams



/admin/auction



/admin/results



/admin/stats



/admin/disputes



/admin/seasons



/admin/gallery



/admin/notifications



/admin/hall-of-fame

```



\---



\# 8. Home Page



\---



\## Hero Section



Large heading:



```text

WHERE

VILLAGE

LEGENDS

RISE

```



Animated stickers.



Grid background.



\---



\## Featured Match



Card:



```text

Warriors



VS



Titans



Today



8 PM

```



Live badge.



Countdown.



\---



\## Top Teams



Horizontal cards.



Displays:



\* Logo

\* Rank

\* Points



\---



\## Top Players



Displays:



\* Photo

\* Team

\* Kills

\* MVP



\---



\## Recent Results



Cards.



Win:



Green



Loss:



Red



\---



\## News Marquee



Scrolling announcements.



\---



\# 9. Dashboard



Personalized.



\---



\## Team Banner



Shows:



\* Team Logo

\* Team Colors

\* Team Name

\* Team Rank



\---



\## Next Match



Countdown.



Map.



Time.



Opponent.



\---



\## Personal Stats



Kills



Matches



Headshots



MVP



\---



\## Team Position



Current standing.



\---



\## Recent Matches



Win/Loss cards.



\---



\## Achievements



Sticker badges.



\---



\# 10. Team Page



Tabs:



```text

Overview



Squad



Statistics



Matches



History

```



\---



\## Overview



Owner



Leader



Points



Wins



Remaining Purse



\---



\## Squad



Player cards.



Role.



Price.



Badges.



\---



\## Statistics



Charts.



Wins.



Losses.



Kills.



Points.



\---



\## History



Past matches.



Season records.



\---



\# 11. Player Page



Hero card.



Photo.



Team.



Role.



Market Value.



Statistics.



Achievements.



Match History.



\---



\# 12. Match Page



Tabs:



```text

Upcoming



Live



Completed

```



\---



Cards show:



Teams.



Map.



Time.



Status.



\---



\# 13. Match Details



Displays:



\* Playing Four

\* Captain

\* Vice-Captain

\* Room ID

\* Password

\* Map

\* Results



\---



\# 14. Leaderboard



Tabs:



\### Teams



\### Players



\---



\## Team Table



Rank



Logo



Points



Kills



Wins



\---



\## Player Table



Kills



Headshots



MVP



Damage



\---



\# 15. Auction Page



Flagship page.



\---



Current Player Card



Photo.



Role.



Base Price.



\---



Live Bids



Animated.



\---



Countdown



30 seconds.



\---



Sold Animation



Confetti.



Winner banner.



\---



\# 16. Team Leader Panel



Allows:



\### Select Playing Four



\### Captain



\### Vice-Captain



\### Bench



\### Submit



Status:



Pending



Approved



Rejected



\---



\# 17. Admin Panel



Dark Mode.



Sidebar.



\---



Sections:



Players



Teams



Auction



Matches



Results



Player Stats



Disputes



Seasons



Gallery



Notifications



Hall Of Fame



\---



\# 18. Hall Of Fame



Season cards.



Displays:



Champion.



MVP.



Highest Kills.



Best Team.



\---



\# 19. News Page



Cards.



Poster style.



Large thumbnails.



\---



\# 20. Rules Page



Accordion cards.



Minimal text.



\---



\# 21. Notifications



Cards.



Types:



Match Reminder



Auction Start



Schedule Change



Lineup Approved



Results Published



\---



\# 22. Profile Page



Editable.



Displays:



Photo.



UID.



Role.



Team.



Statistics.



Achievements.



\---



\# 23. Components



\---



\## Cards



Player Card



Team Card



Match Card



Auction Card



Notification Card



Stat Card



Achievement Card



News Card



\---



\## Navigation



Navbar



Sidebar



Bottom Navigation



Breadcrumb



\---



\## Charts



Win Rate Chart



Kills Chart



Points Chart



\---



\## Tables



Desktop only.



Mobile uses cards.



\---



\# 24. Animations



Library:



Framer Motion



\---



Cards:



Lift on hover.



\---



Buttons:



Push effect.



\---



Badges:



Bounce.



\---



Live:



Pulse.



\---



Page transitions:



200ms.



\---



Respect:



```css

prefers-reduced-motion

```



\---



\# 25. Background Patterns



Grid pattern.



Noise texture.



Dots.



Floating stickers.



Stars.



\---



\# 26. Responsive Behavior



\---



\### Mobile



Bottom navigation.



Cards.



Large buttons.



Single-column layout.



\---



\### Tablet



Two-column layout.



\---



\### Desktop



Sidebar.



Tables.



Multi-column layout.



\---



\# 27. Loading States



Skeletons.



Never blank pages.



\---



\# 28. Error States



Error card.



Retry button.



\---



\# 29. Empty States



Illustration.



Friendly message.



Action button.



\---



\# 30. Accessibility



Minimum touch target:



44px.



Keyboard navigation.



Reduced motion support.



High contrast.



\---



\# 31. Future UI



\### Live Match Center



\### Fantasy League



\### Market Value Graph



\### Transfer Window



\### OCR Match Scanner



\### Multi-Game Hub



\---



\# Component Folder Structure



```text

components



ui



cards



charts



navigation



dashboard



auction



team



player



match



leaderboard



hall-of-fame



news



rules



admin

```



\---



\# UI Principle



> Simple enough for village gamers.



> Professional enough to feel like IPL.



\---



\# UX Principle



> Every screen should feel like opening a game, not a website.



\---



\## Documentation Set Completed



1\. ✅ SRS

2\. ✅ PRD

3\. ✅ TRD

4\. ✅ AI Development Blueprint (ADB)

5\. ✅ UI/UX Documentation

6\. ✅ Pre-Build Risk Addendum (PBRA)



These six documents form the complete foundation for building \*\*VFFT\*\* with AI-assisted development.



