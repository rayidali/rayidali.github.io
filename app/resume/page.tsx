import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { adminClient } from "@/lib/supabase";
import { ping } from "@/lib/telegram";

export const metadata: Metadata = {
  title: "résumé",
  description: "Rayid Ali, AI engineer in New York. Résumé: experience, projects, publication, education.",
  alternates: { canonical: "/resume" },
};
export const dynamic = "force-dynamic";

const DIR = "/resume/pdf";

/* The content below mirrors the PDF word for word; only the presentation is the site's. */
const skills: Array<[string, string]> = [
  ["Languages", "Python, TypeScript, JavaScript, Swift, Go, SQL, C/C++"],
  ["Frontend & Mobile", "React, Next.js, TailwindCSS, native iOS (Swift, Capacitor), Angular, HTML/CSS, RxJS"],
  ["Backend & APIs", "Node.js, Express, FastAPI, Flask, REST, GraphQL, WebSockets"],
  ["AI/ML", "OpenAI API, LangChain, RAG, Prompt Engineering, PyTorch, TensorFlow, HuggingFace, scikit-learn"],
  ["Data", "PostgreSQL, MongoDB, BigQuery, Snowflake, Pinecone, pgvector"],
  ["Cloud & DevOps", "AWS, GCP, Vercel, Docker, Kubernetes, Terraform, GitHub Actions, GitLab CI, Airflow, MLflow"],
];
const experience = [
  { role: "AI Engineer", org: "Gensol Inc", where: "New York, NY", when: "Dec 2024 to Present", bullets: [
    "Cut bid preparation from 2 hours to 5 minutes per drawing across 50+ contractor drawings by building a Claude Vision pipeline that parses DXF/DWG geometry and resolves detected device symbols into a structured takeoff",
    "Shipped the product end to end as sole engineer across 13 REST endpoints and 4 AI features by building a React and TypeScript frontend on a FastAPI service layer",
    "Handled legends that differ on every project by decomposing each sheet into regions and matching symbols against that drawing's own legend rather than a fixed library, routing low-confidence matches to human review",
    "Caught extraction regressions before every release by building a labeled ground-truth set from production drawings and replaying each prompt and model change against it to track accuracy",
  ] },
  { role: "Research Assistant", org: "Clemson University", where: "Clemson, USA", when: "Aug 2023 to May 2024", bullets: [
    "Beat the baseline navigation algorithm by 15% on search-and-rescue routing in complex terrain by implementing a multi-agent reinforcement learning approach (Deep Q-Learning, graph neural networks) with MIT Lincoln Laboratory",
    "Validated flight-path planning across 10+ coordinated agents before any hardware trial by building OpenAI Gym simulation environments with GNN-based inter-agent communication",
  ] },
  { role: "Software Engineer Intern", org: "Atkins Global", where: "Bengaluru, India", when: "Feb 2022 to Jul 2022", bullets: [
    "Replaced static PDF reporting for survey teams with an interactive 3D terrain interface by building a React and Flask application over ML-classified LiDAR point-cloud data in PostgreSQL",
    "Cut manual contract review 70% and saved 200+ analyst hours per quarter across 1,000+ contracts by deploying a BERT clause-extraction service that fed a reviewable queue",
  ] },
  { role: "Software Engineer Intern", org: "Gulf Marvel", where: "Hyderabad, India", when: "Jan 2021 to Jun 2021", bullets: [
    "Shipped the company's public website end to end by building responsive pages in HTML, CSS and JavaScript with cookie consent, session handling, and analytics tracking wired in",
    "Consolidated data from multiple source systems into a single reporting warehouse by building ETL workflows in Informatica and SQL, replacing manual spreadsheet exports",
  ] },
];
const projects = [
  { name: "Cinechrony", sub: "AI Film-Discovery App, iOS + Web", link: "https://cinechrony.com", label: "cinechrony.com", bullets: [
    "Cut worst-case latency 88%, from 223s to 26s, by replacing serial model retries with parallel execution that takes the first completion, in a Gemini pipeline that names every film in a shared TikTok or Reel",
    "Cut database reads ~99% per repeat session, from ≈270 to near zero, by adding write-invalidated caches, write-time denormalization, and client-direct queries",
    "Shipped solo to the App Store across web and native iOS (Next.js 15, Capacitor, Swift share extension) with 858 automated tests gating every release",
  ] },
  { name: "Pdf2Video", sub: "AI Research Paper to Video Converter", link: "https://pdf2video.onrender.com/", label: "pdf2video.onrender.com", bullets: [
    "Cut a 4+ hour manual editing workflow to under 10 minutes by architecting a 6-stage async pipeline with FFmpeg preprocessing, stage-level checkpointing, and fault-tolerant retries",
  ] },
  { name: "Network-Based Recommendation System", sub: "", link: "https://ieeexplore.ieee.org/document/9921383", label: "Published | IEEE ICETCI 2022", bullets: [
    "Improved prediction accuracy 18% and cut RMSE 12% against collaborative filtering baselines by designing a graph-based recommendation model over large Amazon datasets",
  ] },
];

export default async function Resume() {
  /* log the view (server-side, so it is counted even with scripts blocked) */
  try {
    const db = adminClient();
    if (db) {
      const ck = await cookies(); const h = await headers();
      const ref = ck.get("ref")?.value || null;
      const ua = h.get("user-agent") || "";
      if (!/bot|crawl|spider|preview|headless/i.test(ua)) {
        await db.from("events").insert({ event: "resume_view", path: "/resume", ref, props: {}, ua: ua.slice(0, 300), referrer: h.get("referer"), country: h.get("x-vercel-ip-country"), city: h.get("x-vercel-ip-city") });
        if (ref) {
          const { data: rc } = await db.from("ref_codes").select("company,label").eq("code", ref).maybeSingle();
          void ping(`📄 ${rc?.company || rc?.label || ref} is reading your résumé on the site · ${h.get("x-vercel-ip-city") || "?"}, ${h.get("x-vercel-ip-country") || "?"}`);
        }
      }
    }
  } catch { /* never block the page on logging */ }

  return (
    <div className="cvwrap">
      <div className="cvbar">
        <a className="btn" href="/">◀ desktop</a>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a className="btn" href={DIR} target="_blank" rel="noopener">view as PDF ↗</a>
          <a className="btn blue" href={`${DIR}?dl=1`}>download PDF ⤓</a>
        </div>
      </div>

      <article className="win cv">
        <div className="tb">C:\RAYID\RESUME.TXT<span className="b"><span>_</span><span>□</span><span>×</span></span></div>
        <div className="menu"><span>File</span><span>Edit</span><span>View</span><span>Print</span></div>
        <div className="cvpaper">
          <header className="cvhead">
            <h1 className="serif">Rayid Ali</h1>
            <div className="cvcontact">
              <span>New York, NY</span><span>864-765-4848</span>
              <a href="mailto:rayidali3@gmail.com">rayidali3@gmail.com</a>
              <a href="https://rayidali.com">rayidali.com</a>
              <a href="https://github.com/rayidali" target="_blank" rel="noopener">github.com/rayidali</a>
              <a href="https://www.linkedin.com/in/rayidali" target="_blank" rel="noopener">linkedin.com/in/rayidali</a>
            </div>
          </header>

          <section>
            <h2 className="vt">Skills</h2>
            <dl className="cvskills">{skills.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}</dl>
          </section>

          <section>
            <h2 className="vt">Experience</h2>
            {experience.map((e) => (
              <div className="cvitem" key={e.role + e.org}>
                <div className="cvrow"><b>{e.role}</b><span className="cvorg">{e.org} · {e.where}</span><span className="cvwhen vt">{e.when}</span></div>
                <ul>{e.bullets.map((b) => <li key={b.slice(0, 40)}>{b}</li>)}</ul>
              </div>
            ))}
          </section>

          <section>
            <h2 className="vt">Projects</h2>
            {projects.map((p) => (
              <div className="cvitem" key={p.name}>
                <div className="cvrow"><b>{p.name}</b>{p.sub && <span className="cvorg">{p.sub}</span>}<a className="cvwhen vt" href={p.link} target="_blank" rel="noopener">{p.label} ↗</a></div>
                <ul>{p.bullets.map((b) => <li key={b.slice(0, 40)}>{b}</li>)}</ul>
              </div>
            ))}
          </section>

          <section>
            <h2 className="vt">Education</h2>
            <div className="cvitem">
              <div className="cvrow"><b>Clemson University</b><span className="cvorg">Clemson, SC · MS in Computer Science</span><span className="cvwhen vt">May 2024</span></div>
              <p className="cvnote"><i>Research: Multi-agent reinforcement learning for autonomous systems | Collaborated with MIT Lincoln Laboratory</i></p>
            </div>
            <div className="cvitem">
              <div className="cvrow"><b>Jawaharlal Nehru Technological University</b><span className="cvorg">Hyderabad, India · B.Tech in Computer Science</span><span className="cvwhen vt">May 2022</span></div>
            </div>
          </section>
        </div>
      </article>

      <div className="cvbar" style={{ justifyContent: "center" }}>
        <a className="btn blue" href={`${DIR}?dl=1`}>download PDF ⤓</a>
        <a className="btn" href="/#mail">say hello</a>
      </div>
    </div>
  );
}
