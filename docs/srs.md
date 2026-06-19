\# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)



\# VFFT – Velangi Free Fire Tournament



\*\*Version:\*\* 2.0 (Updated)

\*\*Platform:\*\* Web Application

\*\*Architecture:\*\* Server-Authoritative

\*\*Authentication:\*\* Google Sign-In

\*\*Database:\*\* Cloud Firestore

\*\*Storage:\*\* Cloudinary

\*\*Frontend:\*\* Next.js 15 + TypeScript + Tailwind CSS

\*\*Hosting:\*\* Vercel



\---



\# 1. Introduction



\## 1.1 Purpose



VFFT (Velangi Free Fire Tournament) is an IPL-inspired franchise-based Free Fire esports platform designed for village gaming communities.



The platform enables:



\* Player registration

\* Franchise creation

\* Player auctions

\* Team formation

\* Match management

\* Automatic fixtures

\* Team and player statistics

\* Leaderboards

\* Hall of Fame

\* Multi-season support



\---



\## 1.2 Vision



To create a professional esports ecosystem where village gamers can experience franchise leagues similar to IPL while maintaining simplicity and accessibility.



\---



\# 2. User Roles



\---



\## Admin



Full system control.



Responsibilities:



\* Manage players

\* Manage franchises

\* Conduct auctions

\* Generate fixtures

\* Enter results

\* Enter player statistics

\* Approve lineups

\* Handle disputes

\* Manage seasons

\* Manage notifications

\* Manage gallery

\* Manage Hall of Fame



\---



\## Franchise Owner



Can:



\* View team information

\* Monitor purse balance

\* View statistics

\* View season history



\---



\## Team Leader



Can:



\* Manage squad

\* Submit match-day lineup

\* Select captain

\* Select vice-captain

\* Request substitutions

\* Raise disputes



\---



\## Player



Can:



\* Register

\* View profile

\* View statistics

\* View team information

\* View achievements

\* View schedule



\---



\## Visitor



Can:



\* View standings

\* View players

\* View teams

\* View fixtures

\* View Hall of Fame

\* View announcements



\---



\# 3. Authentication Module



Authentication method:



\### Google Sign-In Only



Implemented using:



Firebase Authentication



Unsupported methods:



\* OTP Login

\* Email Password Login

\* Username Password Login



\---



\# 4. Player Registration Module



Players provide:



\* Real Name

\* IGN

\* Free Fire UID

\* WhatsApp Number

\* Role

\* Device

\* Profile Picture



Roles:



\* Rusher

\* Sniper

\* Support

\* IGL



Registration status:



\* Pending

\* Approved

\* Rejected



Approved players enter the Auction Pool.



\---



\# 5. Franchise Module



Admin creates franchises.



Each franchise stores:



\* Team Name

\* Logo

\* Banner

\* Owner

\* Team Leader



Virtual Budget:



10000 Coins



Stores:



\* Purse

\* Remaining Purse

\* Squad



\---



\# 6. Auction Module



Server-authoritative.



All bids are validated by Cloud Functions.



Stores:



\* Player

\* Base Price

\* Highest Bid

\* Sold Price

\* Sold Team



Status:



\* Active

\* Sold

\* Unsold



\---



\# 7. Squad Module



Maximum Squad Size:



10 Players



Playing Squad:



4 Players



Bench Players:



6 Players



\---



\# 8. Match-Day Lineup Module



Thirty minutes before the match:



Team Leader submits:



\* Playing Four

\* Captain

\* Vice-Captain



Status:



\* Pending

\* Approved

\* Rejected



After approval:



Squad becomes locked.



\---



\# 9. Match Module



Stores:



\* Match Number

\* Match Date

\* Match Time

\* Team 1

\* Team 2

\* Room ID

\* Password

\* Map



Status:



\* Upcoming

\* Live

\* Completed



\---



\# 10. Fixture Generator



Supports:



\### Single Round Robin



\### Double Round Robin



\### Playoffs



\### Qualifier 1



\### Eliminator



\### Qualifier 2



\### Grand Final



Fixtures are automatically generated.



\---



\# 11. Result Module



Admin enters:



\### Team Statistics



\* Team Kills

\* Placement Points

\* Total Points



Results update standings automatically.



\---



\# 12. Player Statistics Module



Season 1 uses manual entry.



Admin enters:



\* Kills

\* Headshots

\* Damage

\* MVP



Every stat record must reference:



\### Match Evidence



No statistics exist without evidence.



\---



\# 13. Match Evidence Module



Stores:



\* Match Screenshot

\* Uploaded By

\* Upload Time



Purpose:



Provide proof for:



\* Results

\* Player statistics

\* Disputes



Stored in Cloudinary.



\---



\# 14. Team Leaderboard Module



Displays:



\* Rank

\* Matches Played

\* Wins

\* Losses

\* Kills

\* Points



Derived from:



Results collection.



\---



\# 15. Player Leaderboard Module



Displays:



\* Top Killers

\* MVP Rankings

\* Headshot Leaders

\* Damage Leaders

\* Clutch Kings



Derived from:



playerMatchStats collection.



\---



\# 16. Team Profile Module



Displays:



\* Team Logo

\* Team Banner

\* Team Leader

\* Squad

\* Bench Players

\* Match History

\* Season Statistics



\---



\# 17. Player Profile Module



Displays:



\* Profile Photo

\* Team

\* Auction Price

\* Matches Played

\* Kills

\* Headshots

\* MVP Awards

\* Win Rate

\* Achievements



\---



\# 18. Personalized Dashboard



After login:



Displays:



\* Team Banner

\* Upcoming Match

\* Recent Matches

\* Team Position

\* Personal Statistics

\* Achievements

\* Announcements



\---



\# 19. Hall Of Fame Module



Stores:



\* Champions

\* MVP Players

\* Highest Kill Record

\* Best Team

\* Season Winners



\---



\# 20. Achievement Module



Achievements:



\* Champion

\* MVP

\* Kill Machine

\* Sniper King

\* Clutch Master

\* Terminator

\* Legend

\* Veteran



\---



\# 21. Transfer Window Module



Supports:



\* Buying Players

\* Selling Players

\* Trading Players



Rules:



\* Maximum 2 transfers per season.

\* No transfers during playoffs.



\---



\# 22. Emergency Substitution Module



Allows:



Replacement of unavailable players.



Conditions:



\* Before room start.

\* Admin approval required.

\* Replacement player must belong to the same team.



Emergency substitutions do not count toward transfer limits.



\---



\# 23. Dispute Module



Team Leaders can raise disputes.



Statuses:



\* Open

\* Under Review

\* Resolved

\* Closed



Admins must provide:



\* Resolution notes

\* Evidence references



\---



\# 24. Notification Module



Notifications include:



\* Match reminders

\* Schedule updates

\* Result announcements

\* Team confirmations

\* Auction announcements



\---



\# 25. News Module



Admin publishes:



\* Announcements

\* Match reports

\* Winner posts

\* Season updates



\---



\# 26. Gallery Module



Stores:



\* Posters

\* Team Photos

\* Winner Photos

\* Match Screenshots



Content is admin-controlled.



\---



\# 27. Season Module



Supports:



\* Season 1

\* Season 2

\* Season 3



Stores:



\* Prize Pool

\* Teams

\* Players

\* Champion

\* MVP

\* Statistics



Season data is isolated to prevent overwriting previous seasons.



\---



\# 28. Audit Module



Maintains:



\* Result changes

\* Auction changes

\* Transfer actions

\* Account ownership transfers

\* Admin actions



Audit logs are immutable.



No personally identifiable information is stored in audit logs.



\---



\# 29. Privacy and Compliance



Required pages:



\* Privacy Policy

\* Terms of Service

\* Community Guidelines



Rejected player data:



Deleted after 30 days.



Inactive player data:



Deleted after 90 days.



\---



\# 30. Responsive Design



Supports:



\* Mobile

\* Tablet

\* Desktop



Uses:



Mobile-first architecture.



\---



\# 31. Non-Functional Requirements



\### Performance



Page loading time:



< 2 seconds



\---



\### Security



\* Firebase Authentication

\* Firestore Rules

\* Cloud Functions

\* Role-Based Access



\---



\### Availability



99.9%



\---



\### Scalability



Season 1 Target:



100–300 Players



Future Target:



1000+ Players



\---



\# 32. Technology Stack



\## Frontend



\* Next.js 15

\* TypeScript

\* Tailwind CSS

\* Shadcn UI

\* Framer Motion

\* React Hook Form

\* Zod

\* Zustand



\---



\## Backend



Firebase



Components:



\* Firebase Authentication

\* Cloud Firestore

\* Cloud Functions

\* Firebase Cloud Messaging



\---



\## Storage



Cloudinary



Stores:



\* Profile Images

\* Team Logos

\* Banners

\* Posters

\* Match Evidence

\* Gallery Images



\---



\## Hosting



Vercel



\---



\# 33. Firestore Collections



```text

users

players

teams

teamSeasonStats

playerSeasonStats

matches

lineups

results

playerMatchStats

auctions

bids

transfers

substitutions

disputes

auditLogs

notifications

announcements

gallery

hallOfFame

achievements

cachedLeaderboards

cachedTeamStandings

cachedPlayerStandings

seasons

resultEvidence

```



\---



\# 34. Future Enhancements



\* OCR Match Scanner

\* AI Statistics Analysis

\* Fantasy League

\* Market Value System

\* YouTube Live Integration

\* PWA Support

\* BGMI Support

\* PUBG Support

\* Multi-Game Platform



\---



\# Project Name



\# \*\*VFFT\*\*



\## \*\*Velangi Free Fire Tournament\*\*



\### Tagline



> \*\*Where Village Legends Rise\*\*



\---



\# Design Philosophy



\*\*Simple enough for village gamers. Professional enough to feel like IPL.\*\*



\---



\# Core Principle



> \*\*Everything visible can be faked. Everything important must be verified.\*\*



