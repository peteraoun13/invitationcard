const coverMediaModules = import.meta.glob(
  ["../assets/cover-photo.png", "../assets/video.mp4"],
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

function getCoverMedia(fileName) {
  return coverMediaModules[`../assets/${fileName}`] ?? "";
}

const coverPhoto = getCoverMedia("cover-photo.png");
const coverVideo = getCoverMedia("video.mp4");

export const invitationContent = {
  assets: {
    // Replace src/assets/video.mp4 to change the looping invitation background.
    coverVideo,
    // Used only if the video cannot load.
    coverPhoto,
  },

  couple: {
    names: "Jad & Hala",
    initials: "J & H",
  },

  wedding: {
    // Edit the visible invitation text here.
    shortDate: "08 | 08 | 2026",
    countdownTarget: "2026-08-08T18:00:00+03:00",
    invitationVerse: [
      '"And now these three remain:',
      "faith, hope and love. But",
      'the greatest of these is love."',
      "1 Corinthians 13:13",
    ],
    gratitudeLines: [
      "With grateful hearts and the",
      "Blessing of God,",
    ],
    familyIntro: "Together with their families",
    primaryFamilyName: "Rimonda Nicolas Nassar",
   togetherWith: "and",
    secondaryFamilyName: "Maroun and Assia Mansour",
    requestLines: [
      "request the honor of your",
      "presence at the wedding of",
      "their son and daughter",
    ],
    celebrationDate: "Saturday, August 8, 2026",
    countdownLabel: "Until the wedding...",
    giftRegistryLines: [
      "The greatest gift we could have is your presence.",
      "For those who wish to celebrate our special day with a gift, a wedding list is available at",
      "OMT: 71 855 445",
    ],
    rsvpTitle: "Be our guest",
    rsvpLine: "Kindly confirm before the first of November 2025",
    rsvpButtonLabel: "RSVP",
    rsvpUrl: "mailto:rsvp@example.com",
    guests: ["Hala", "Jad", "Maya", "Karim", "Nour"],
  },
};
