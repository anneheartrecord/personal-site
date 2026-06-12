export interface WorkItem {
  company: string;
  companyUrl: string;
  logo: string; // path to logo image, or "tme" | "baidu" for inline SVG
  period: string;
  roles: {
    title: string;
    description: string;
    url?: string;
  }[];
}

export const works: WorkItem[] = [
  {
    company: "Rezona",
    companyUrl: "https://rezona.ai/",
    logo: "rezona",
    period: "2026.05 — Now",
    roles: [
      {
        title: "AI Agent Development",
        description:
          "Working on an internal game Agent product, while also building and improving the Agent infra.",
      },
    ],
  },
  {
    company: "Tencent Music Entertainment",
    companyUrl: "https://www.tencentmusic.com",
    logo: "tme",
    period: "2023.05 — 2026.05",
    roles: [
      {
        title: "AI Platform Engineering",
        description:
          "Built an internal deployment platform for OpenClaw. It made OpenClaw easier to use inside the company through WeChat, WeCom, and an internal Skills marketplace.",
      },
      {
        title: "Release System",
        description:
          "Worked on release and deployment systems for large internal services, turning repeated manual steps into templates, APIs, and safer defaults.",
      },
      {
        title: "Container Platform Management",
        description:
          "Worked on the container platform behind production workloads: Kubernetes extensions, scheduling, lifecycle management, observability, and resource governance.",
      },
    ],
  },
  {
    company: "Baidu",
    companyUrl: "https://home.baidu.com",
    logo: "baidu",
    period: "2023.02 — 2023.05",
    roles: [
      {
        title: "Backend Development Intern",
        description:
          "Worked on backend systems for Baidu APP interactions, including comments, likes, bullet comments, review workflows, and internal operation tools.",
      },
    ],
  },
  {
    company: "TMLake (通明智云)",
    companyUrl: "https://tmlake.com",
    logo: "tml",
    period: "2022.09 — 2022.12",
    roles: [
      {
        title: "Backend Development Intern",
        description:
          "Worked on container deployment workflows and observability tooling.",
      },
    ],
  },
  {
    company: "PANDAG (食铁兽科技)",
    companyUrl: "https://www.douyin.com/user/MS4wLjABAAAAZKvns92hhdeSuxyyitgClpco86s2ruypJEYdMEN3bw7U09gZdMFcR3FXyGESDV68?from_tab_name=main&showTab=post",
    logo: "pandag",
    period: "2022.03 — 2022.09",
    roles: [
      {
        title: "Early Team Member",
        description:
          "Joined a student-founded startup as an early team member.",
      },
    ],
  },
];
