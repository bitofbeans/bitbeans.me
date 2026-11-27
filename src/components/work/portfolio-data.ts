export const BOOKMARKLET_HREF =
  "javascript:(()=>{const s=document.createElement('script');s.src='https://bitofbeans.github.io/js2048Game/new/script.js';document.body.appendChild(s);})();";

export const ITCH_EMBED_URL =
  "https://itch.io/embed/4765787?bg_color=131a2b&fg_color=ffffff&link_color=995afa&border_color=3d4350";

export const SOUNDCLOUD_EMBED_URL =
  "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2358514967&color=%232bbc7d&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true";

export const art = [
  ["0Band25-6-Shirt.png", "Marching band shirt", 1226, 684],
  ["1HuckFinnFront.png", "Huckleberry Finn · front cover", 1391, 1800],
  ["2HuckFinnBack.png", "Huckleberry Finn · back cover", 1391, 1800],
  ["3TPAlbum1.png", "Teleport · light cover", 1800, 1800],
  ["4TPAlbum2.png", "Teleport · dark cover", 1800, 1800],
  ["5TPThumb.png", "Teleport · game artwork", 2001, 1501],
  ["Altlogooption.png", "Logo study", 1000, 1000],
  ["BenetDrumBack.png", "Drumline shirt", 1524, 1800],
  ["SLBank.png", "Bank icon", 1502, 1502],
  ["SLGiveaway.png", "Giveaway icon", 1502, 1502],
] as const;

export type Project = {
  name: string;
  description: string;
  href: string;
  action: string;
  image: string;
  alt: string;
  width: number;
  height: number;
  embed?: {
    showLabel: string;
    hideLabel: string;
    title: string;
    src: string;
    width: number;
    height: number;
  };
};

export const projects: readonly Project[] = [
  {
    name: "MarMap",
    description:
      "Explore the terrain of Mars and find the best route for a rover.",
    href: "https://marmap.quobits.workers.dev/",
    action: "Explore MarMap",
    image: "/images/marmap.png",
    alt: "Team Elders’ MarMap logo above the surface of Mars",
    width: 1724,
    height: 1138,
  },
  {
    name: "vlonely&friends",
    description: "A portfolio I built for an artist promoter.",
    href: "https://vlfriends.com/",
    action: "Visit vlonely&friends",
    image: "/images/vlonely-and-friends.png",
    alt: "vlonely and friends logo with smiling hearts and stars",
    width: 2000,
    height: 1336,
  },
  {
    name: "Teleport",
    description: "Play the finished game on Scratch.",
    href: "https://scratch.mit.edu/projects/1299864236/",
    action: "Play Teleport",
    image: "/images/5TPThumb.png",
    alt: "Teleport artwork with two green characters bursting through the screen",
    width: 2001,
    height: 1501,
    embed: {
      showLabel: "itch.io embed",
      hideLabel: "Hide itch.io",
      title: "TELEPORT by BitBeans on itch.io",
      src: ITCH_EMBED_URL,
      width: 552,
      height: 167,
    },
  },
];
