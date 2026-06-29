import coverVideoAsset from "../assets/video1.mp4";

function getAssetSrc(asset) {
  return typeof asset === "string" ? asset : asset?.src || "";
}

const sharedGuests = ["Hala", "Jad", "Maya", "Karim", "Nour"];
const sharedDateTarget = "2026-08-08T18:00:00+03:00";
const ceremonyLocationUrl =
  "https://www.google.com/maps/place/Mar+Abda+Church/@33.8843738,35.6108226,17z/data=!3m1!4b1!4m6!3m5!1s0x151f3c2de13bfde1:0x1ecf3a88b0182550!8m2!3d33.8843739!4d35.6156881!16s%2Fg%2F11g9hkhnky?entry=ttu&g_ep=EgoyMDI2MDYyMy4wIKXMDSoASAFQAw%3D%3D";
const dinnerLocationUrl =
  "https://www.google.com/maps/place/Aldea+Events+Venue/@33.8724625,35.5914765,17z/data=!3m1!4b1!4m6!3m5!1s0x151f3dbb6ecb9969:0x4bdbe2f22a0c1e93!8m2!3d33.8724625!4d35.5940568!16s%2Fg%2F11c1n4096_?entry=ttu&g_ep=EgoyMDI2MDYyMy4wIKXMDSoASAFQAw%3D%3D";

export const invitationContent = {
  assets: {
    coverPreview: "/cover-photo-preview.jpg",
    coverPhoto: "/cover-photo.jpg",
    coverVideo: getAssetSrc(coverVideoAsset),
  },

  languages: {
    en: {
      dir: "ltr",
      ui: {
        scrollLabel: "Scroll to Begin",
        languageLabel: "Switch invitation language",
        locationLabel: "Get Directions",
        rsvpSubject: "Wedding RSVP",
        rsvpGreeting: "Hello",
        rsvpBodyIntro: "We confirm our presence for:",
        rsvpThanks: "Thank you.",
        rsvpYesLabel: "Yes",
        rsvpNoLabel: "No",
        rsvpConfirmationTitle: "With gratitude",
        rsvpConfirmationMessage: "Your response has been received.",
      },

      couple: {
        names: "Jad & Hala",
        initials: "J & H",
        shortDate: "08 | 08 | 2026",
      },

      invitation: {
        verse: [
          '"And now these three remain:',
          "Faith, Hope and Love.",
          'But the greatest of these is Love."',
          "1 Corinthians 13:13",
        ],
        gratitudeLines: ["With grateful hearts, and under", "God's blessing,"],
        familyIntro: "Together with their families",
        primaryFamilyName: "Rimonda Nicolas Nassar",
        togetherWith: "and",
        secondaryFamilyName: "Maroun & Assia Mansour",
        requestLines: [
          "request the honor of your",
          "presence at the wedding",
          "of their son and daughter",
        ],
        celebrationDate: "Saturday, August 8, 2026",
      },

      ceremony: {
        eyebrow: "The",
        title: "Wedding Ceremony",
        time: "6:00 PM",
        timezone: "Beirut time . GMT+3",
        place: "Mar Abda Roumieh",
        locationUrl: ceremonyLocationUrl,
      },

      party: {
        eyebrow: "The",
        title: ["Wedding", "Reception"],
        time: "7:30 PM",
        timezone: "Beirut time . GMT+3",
        place: "Aldea, Ain Saade",
        locationUrl: dinnerLocationUrl,
      },

      giftRegistry: {
        eyebrow: "The",
        title: ["Gift", "Registry"],
        lines: [
          "Your presence is the greatest gift we could receive.",
          "For those who wish to celebrate our special day with a gift, our wedding registry is available at ",
          "Whish: 30230874",
        ],
      },

      rsvp: {
        eyebrow: "Kindly",
        title: "Be Our Guest",
        line: "Please select your name and confirm your attendance",
        buttonLabel: "CONFIRM",
        email: "rsvp@example.com",
        guests: sharedGuests,
      },

      countdown: {
        label: "Until the wedding...",
        unitLabels: {
          days: "D",
          hours: "H",
          minutes: "M",
          seconds: "S",
        },
        ariaUnits: {
          days: "days",
          hours: "hours",
          minutes: "minutes",
          seconds: "seconds",
        },
        target: sharedDateTarget,
      },
    },

    fr: {
      dir: "ltr",
      ui: {
        scrollLabel: "Faire défiler",
        languageLabel: "Changer la langue de l'invitation",
        locationLabel: "Itinéraire",
        rsvpSubject: "Réponse au mariage",
        rsvpGreeting: "Bonjour",
        rsvpBodyIntro: "Nous confirmons notre présence pour :",
        rsvpThanks: "Merci.",
        rsvpYesLabel: "Oui",
        rsvpNoLabel: "Non",
        rsvpConfirmationTitle: "Avec gratitude",
        rsvpConfirmationMessage: "Votre réponse a bien été enregistrée.",
      },

      couple: {
        names: "Jad & Hala",
        initials: "J & H",
        shortDate: "08 | 08 | 2026",
      },

      invitation: {
        verse: [
          '"Maintenant donc ces trois choses demeurent :',
          "la Foi, l'Espérance et l'Amour;",
          "mais la plus grande de ces choses, c'est l'Amour.\"",
          "1 Corinthiens 13:13",
        ],
        gratitudeLines: ["Avec gratitude et sous", "la bénédiction de Dieu,"],
        familyIntro: "Entourés de leurs familles",
        primaryFamilyName: "Rimonda Nicolas Nassar",
        togetherWith: "et",
        secondaryFamilyName: "Maroun & Assia Mansour",
        requestLines: [
          "ont l'honneur de vous convier",
          "à célébrer le mariage de",
          "leur fils et de leur fille",
        ],
        celebrationDate: "Samedi 8 août 2026",
      },

      ceremony: {
        eyebrow: "La",
        title: "Cérémonie",
        time: "18h00",
        timezone: "Heure de Beyrouth . GMT+3",
        place: "Mar Abda Roumieh",
        locationUrl: ceremonyLocationUrl,
      },

      party: {
        eyebrow: "La",
        title: ["Réception"],
        time: "19h30",
        timezone: "Heure de Beyrouth . GMT+3",
        place: "Aldea, Ain Saade",
        locationUrl: dinnerLocationUrl,
      },

      giftRegistry: {

        title: ["Liste", "de mariage"],
        lines: [
          "Votre présence est le plus beau cadeau que nous puissions recevoir.",
          "Pour celles et ceux qui souhaitent offrir un cadeau, notre liste de mariage est disponible chez",
          "Whish: 30230874",
        ],
      },

      rsvp: {
        title: "RSVP",
        line: "Veuillez sélectionner votre prénom, puis confirmer votre présence.",
        buttonLabel: "Confirmer",
        email: "rsvp@example.com",
        guests: sharedGuests,
      },

      countdown: {
        label: "Jusqu'au mariage...",
        unitLabels: {
          days: "J",
          hours: "H",
          minutes: "M",
          seconds: "S",
        },
        ariaUnits: {
          days: "jours",
          hours: "heures",
          minutes: "minutes",
          seconds: "secondes",
        },
        target: sharedDateTarget,
      },
    },
  },

  defaultLanguage: "en",
};
