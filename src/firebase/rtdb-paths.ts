export const RTDB_PATHS = {
  auctionCurrent: "/auction/current",
  auctionTimer: "/auction/timer",
  auctionHistory: "/auction/history",

  matchState: (matchId: string) => `/matchState/${matchId}`,
  matchTimer: (matchId: string) => `/matchState/${matchId}/timer`,

  presence: (userId: string) => `/presence/${userId}`,
  presenceOnline: "/presence",

  userNotifications: (userId: string) => `/notifications/${userId}`,
  userNotification: (userId: string, notifId: string) => `/notifications/${userId}/${notifId}`,

  countdown: (id: string) => `/countdowns/${id}`,

  featuredContent: "/featuredContent",
} as const;
