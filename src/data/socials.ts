export interface Social {
  name: string;
  url: string;
  icon: string;
  showInSidebar?: boolean;
}

export const socials: Social[] = [
  {
    name: "GitHub",
    url: "https://github.com/anneheartrecord",
    icon: "github",
    showInSidebar: true,
  },
  {
    name: "X (Twitter)",
    url: "https://x.com/Charles77xixi",
    icon: "twitter",
    showInSidebar: true,
  },
  {
    name: "Email",
    url: "mailto:chengxisheng777@gmail.com",
    icon: "email",
    showInSidebar: true,
  },
  {
    name: "WeChat",
    url: "#wechat",
    icon: "wechat",
    showInSidebar: true,
  },
  {
    name: "Juejin (掘金)",
    url: "https://juejin.cn/user/2832810607646439",
    icon: "juejin",
    showInSidebar: false,
  },
];
