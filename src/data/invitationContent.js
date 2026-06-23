import envelopeKeepsake from "../assets/enveloppe.svg";
import floralBackground from "../assets/bg-green.svg";
import flowerLeft from "../assets/flower-left.svg";
import flowerRight from "../assets/flower-right.svg";
import timelineArt from "../assets/timeline.png";

const coverMediaModules = import.meta.glob(
  ["../assets/cover-photo.png", "../assets/video.mp4"],
  {
    eager: true,
    import: "default",
    query: "?url",
  }
);

function getCoverMedia(fileName) {
  return coverMediaModules[`../assets/${fileName}`] ?? "";
}

const coverPhoto = getCoverMedia("cover-photo.png");
const coverVideo = getCoverMedia("video.mp4");

export const invitationContent = {
  assets: {
    coverVideo,
    coverPhoto,
    envelopeKeepsake,
    floralBackground,
    flowerLeft,
    flowerRight,
    timelineArt,
  },

  couple: {
    names: "Jad & Hala",
    initials: "J & H",
  },

  wedding: {
    shortDate: "08 | 08 | 2026",
    countdownTarget: "2026-08-08T18:00:00+03:00",
    invitationTitle: "Wedding\nInvitation",
    familyLine: "Together with their families",
    inviteLine: "invite you to celebrate their wedding day.",
    welcomeLine: "We would be honored to have you with us on this special day.",
    countdownLabel: "Until the wedding...",

    details: [
      { label: "Date", value: "Saturday, 08 August 2026" },
      { label: "Time", value: "Six o'clock in the evening" },
      { label: "Venue", value: "The Grand Garden Hall" },
    ],

    timeline: [
      {
        title: "Church Ceremony",
        time: "4:00 PM",
        venue: "Saint Mary Church",
        locationUrl: "https://maps.google.com",
        side: "left",
      },
      {
        title: "Dinner Reception",
        time: "8:00 PM",
        venue: "The Garden Venue",
        locationUrl: "https://maps.google.com",
        side: "right",
      },
    ],
  },

  actions: [
    {
      label: "RSVP",
      href: "mailto:rsvp@example.com",
      variant: "primary",
    },
    {
      label: "Location",
      href: "https://maps.google.com",
      external: true,
    },
    {
      label: "Save the Date",
      href: "data:text/calendar;charset=utf8,BEGIN%3AVCALENDAR%0AVERSION%3A2.0%0ABEGIN%3AVEVENT%0ASUMMARY%3AJad%20%26%20Hala%20Wedding%0ADTSTART%3A20260808T180000%0ADTEND%3A20260808T230000%0AEND%3AVEVENT%0AEND%3AVCALENDAR",
      download: "jad-and-hala-save-the-date.ics",
    },
  ],
};