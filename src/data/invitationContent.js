const coverMediaModules = import.meta.glob(
  ["../assets/cover-photo.jpeg", "../assets/video.mp4"],
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

function getCoverMedia(fileName) {
  return coverMediaModules[`../assets/${fileName}`] ?? "";
}

export const invitationContent = {
  assets: {
    coverPhoto: getCoverMedia("cover-photo.jpeg"),
    coverVideo: getCoverMedia("video.mp4"),
  },

  couple: {
    names: "Jad & Hala",
    initials: "J & H",
    shortDate: "08 | 08 | 2026",
  },

  invitation: {
    verse: [
      '"And now these three remain:',
      "faith, hope and love. But",
      'the greatest of these is love."',
      "1 Corinthians 13:13",
    ],
    gratitudeLines: ["With grateful hearts and the", "Blessing of God,"],
    familyIntro: "Together with their families",
    primaryFamilyName: "Rimonda Nicolas Nassar",
    togetherWith: "and",
    secondaryFamilyName: "Maroun & Assia Mansour",
    requestLines: [
      "request the honor of your",
      "presence at the wedding of",
      "their son and daughter",
    ],
    celebrationDate: "Saturday, August 8, 2026",
  },

  ceremony: {
    eyebrow: "The",
    title: "Wedding Ceremony",
    time: "6:00 PM",
    timezone: "Beirut time (GMT+3)",
    place: "Mar Abda Roumieh",
    locationUrl: "PASTE_GOOGLE_MAPS_LINK_HERE",
  },

  party: {
    eyebrow: "The",
    title: ["Wedding", "Party"],
    time: "7:30 PM",
    timezone: "Beirut time (GMT+3)",
    place: "Aldea, Ain Saade",
    locationUrl: "PASTE_GOOGLE_MAPS_LINK_HERE",
  },

  giftRegistry: {
    eyebrow: "The",
    title: ["Gift", "Registry"],
    lines: [
      "The greatest gift we could have is your presence.",
      "For those who wish to celebrate our special day with a gift, a wedding list is available at",
      "OMT: 71 855 445",
    ],
  },

  rsvp: {
    eyebrow: "Kindly",
    title: "Be Our Guest",
    line: "Please select your name and reserve your presence.",
    buttonLabel: "Reserve",
    email: "rsvp@example.com",
    guests: ["Hala", "Jad", "Maya", "Karim", "Nour"],
  },

  countdown: {
    label: "Until the wedding...",
    target: "2026-08-08T18:00:00+03:00",
  },
};
