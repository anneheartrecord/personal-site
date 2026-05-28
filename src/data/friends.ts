export interface Friend {
  name: string;
  url: string;
  avatar: string;
  description: string;
}

export const friends: Friend[] = [
  {
    name: "situ2001",
    url: "https://situ2001.com/",
    avatar: "https://situ2001.com/avatar.png",
    description: "Explore with curiosity. Build with empathy.",
  },
  {
    name: "kawhi",
    url: "https://kawhicurry.github.io/",
    avatar: "https://gallery-cos.kawhicurry.online/profile/avatar.png",
    description: "SRE, building a reliable world with infinite possibility.",
  },
  {
    name: "zbwer",
    url: "https://blog.zbwer.work/",
    avatar: "https://github.com/zbwer.png",
    description: "UESTC / Cat Cult / Front-End Developer.",
  },
];
