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
    company: "Tencent Music Entertainment",
    companyUrl: "https://www.tencentmusic.com",
    logo: "tme",
    period: "2023.05 — Present",
    roles: [
      {
        title: "AI Platform Engineering",
        description:
          "Led the development of an enterprise-wide AI deployment platform from scratch. Designed the complete architecture including dual-channel WeChat integrations (both personal and enterprise WeChat), cross-container persistent memory, a Skills marketplace with GitLab-based version control and rollback, and a Multi-Agent persona system. The platform reached widespread internal adoption within weeks of launch.",
      },
      {
        title: "Release & Deployment Engine",
        description:
          "Built a standardized release template system that powers configuration-driven deployments across all business lines. Designed a parent-child template architecture that supports API-driven publishing, drastically reducing manual deployment steps and enabling reproducible, auditable releases at scale.",
      },
      {
        title: "Container Platform Management",
        description:
          "Managed the group's large-scale container infrastructure spanning thousands of nodes and GPU cards. Designed and implemented intelligent node scheduling to balance cluster loads, built full pod lifecycle management with auto-scaling (HPA), timed expansion for traffic spikes, and automatic resource governance to prevent waste and reduce operational costs.",
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
        title: "Backend Development Intern — Baidu APP",
        description:
          "Worked on the core interaction system for Baidu APP, including comments, likes, danmaku (bullet comments), and smart content moderation. Built a machine-driven comment insertion system with automated quality scoring. Refactored the intelligent review module using Go for better performance and maintainability. Developed a smart account operations system for content seeding, using Go backend with a low-code amis frontend.",
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
        title: "Container & Monitoring Development Intern",
        description:
          "Focused on container orchestration tooling and observability infrastructure. Worked on containerized application deployment workflows and developed Prometheus-based monitoring solutions — including custom metric collection, alerting rules, and storage extension for long-term metric retention.",
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
        title: "Co-founder / Early Team Member",
        description:
          "Joined as an early team member during sophomore year, working alongside senior schoolmates to build the company from the ground up. PANDAG has since secured investments from Jack Li (李泽湘), Miracle Plus (奇绩创坛) and other notable investors, successfully closing its Series A round and growing to nearly 100 employees.",
      },
    ],
  },
];
