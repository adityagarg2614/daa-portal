"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
    ArrowRight,
    BarChart3,
    BookOpenCheck,
    CalendarDays,
    CheckCheck,
    ChevronRight,
    Code2,
    Cpu,
    Layers3,
    ShieldCheck,
    Sparkles,
    Zap,
} from "lucide-react";
import { SignInModalButton } from "../../components/SignInModalButton";
import styles from "./LandingPage.module.css";

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65 } },
};

const stagger = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.12 },
    },
};

const floatCard = {
    y: [0, -10, 0],
    rotate: [0, 0.6, 0],
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut" },
};

const features = [
    {
        icon: Code2,
        title: "Code, run, and submit in one flow",
        body: "Students move from reading the problem to testing and submitting without switching tools or losing context.",
        tone: "cyan",
        meta: "Browser-first workflow",
    },
    {
        icon: Cpu,
        title: "Auto-grading backed by real execution",
        body: "Solutions are evaluated against structured test cases so feedback is immediate, consistent, and objective.",
        tone: "amber",
        meta: "Multi-language support",
    },
    {
        icon: BarChart3,
        title: "Performance visibility that helps teaching",
        body: "Dashboards surface assignment progress, scores, and activity trends for both students and course admins.",
        tone: "emerald",
        meta: "Insightful analytics",
    },
    {
        icon: ShieldCheck,
        title: "Role-aware access out of the box",
        body: "Students, admins, onboarding, and protected routes all fit into a clear identity and permissions model.",
        tone: "slate",
        meta: "Secure by design",
    },
];

const workflow = [
    {
        step: "01",
        title: "Sign in with your institution identity",
        body: "Students and admins land in the right flow quickly with Clerk-powered authentication.",
    },
    {
        step: "02",
        title: "Access structured assignments and problem sets",
        body: "Problems, deadlines, and grading expectations are centralized in one focused workspace.",
    },
    {
        step: "03",
        title: "Track results, attendance, and engagement",
        body: "The portal keeps academic progress visible instead of scattering it across forms and chats.",
    },
];

export default function LandingPage() {
    return (
        <div className={styles.page}>
            <div className={styles.bgMesh} aria-hidden="true" />
            <div className={styles.bgNoise} aria-hidden="true" />
            <div className={`${styles.glow} ${styles.glowA}`} aria-hidden="true" />
            <div className={`${styles.glow} ${styles.glowB}`} aria-hidden="true" />
            <div className={`${styles.glow} ${styles.glowC}`} aria-hidden="true" />

            <motion.header
                initial={{ y: -32, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={styles.navShell}
            >
                <div className={styles.nav}>
                    <Link href="/" className={styles.brand}>
                        <div className={styles.brandMark}>
                            <Sparkles className={styles.brandIcon} />
                        </div>
                        <div className={styles.brandText}>
                            <span className={styles.brandTitle}>Algo-Grade</span>
                            <span className={styles.brandSubtitle}>DAA Course Operating System</span>
                        </div>
                    </Link>

                    <nav className={styles.navLinks}>
                        <Link href="#capabilities" className={styles.navLink}>
                            Capabilities
                        </Link>
                        <Link href="#workflow" className={styles.navLink}>
                            Workflow
                        </Link>
                        <Link href="#why" className={styles.navLink}>
                            Why It Works
                        </Link>
                    </nav>

                    <div className={styles.navActions}>
                        <Link href="#capabilities" className={styles.ghostBtn}>
                            Explore
                        </Link>
                        <SignInModalButton className={styles.primaryBtn} />
                    </div>
                </div>
            </motion.header>

            <main className={styles.main}>
                <section className={styles.hero}>
                    <motion.div
                        className={styles.heroGrid}
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                    >
                        <div className={styles.heroCopy}>
                            <motion.div variants={fadeUp} className={styles.eyebrow}>
                                <span className={styles.eyebrowDot} />
                                Built for algorithm courses that need clarity, speed, and scale
                            </motion.div>

                            <motion.h1 variants={fadeUp} className={styles.heroTitle}>
                                The academic portal where{" "}
                                <span className={styles.accentText}>assignments</span>,{" "}
                                <span className={styles.accentTextAlt}>grading</span>, and{" "}
                                <span className={styles.accentText}>progress</span> finally feel connected.
                            </motion.h1>

                            <motion.p variants={fadeUp} className={styles.heroText}>
                                Algo-Grade gives students and instructors one unified experience
                                for DAA coursework: browse assignments, write code, run solutions,
                                submit answers, manage attendance, and follow performance without
                                the usual admin sprawl.
                            </motion.p>

                            <motion.div variants={fadeUp} className={styles.heroActions}>
                                <SignInModalButton className={styles.primaryBtnHero}>
                                    Start With Your Account
                                    <ArrowRight className={styles.btnIcon} />
                                </SignInModalButton>
                                <Link href="#workflow" className={styles.secondaryBtn}>
                                    See How It Works
                                </Link>
                            </motion.div>

                            <motion.div variants={fadeUp} className={styles.metricStrip}>
                                <Metric label="Assignment flow" value="Structured" />
                                <Metric label="Feedback loop" value="Immediate" />
                                <Metric label="Admin control" value="Centralized" />
                            </motion.div>
                        </div>

                        <motion.div variants={fadeUp} className={styles.heroVisual}>
                            <motion.div
                                className={`${styles.floatingCard} ${styles.floatingTop}`}
                                animate={floatCard}
                            >
                                <div className={styles.floatingLabel}>Live grading</div>
                                <div className={styles.floatingValue}>12 / 12 tests passed</div>
                            </motion.div>

                            <motion.div
                                className={`${styles.floatingCard} ${styles.floatingBottom}`}
                                animate={{ ...floatCard, transition: { ...floatCard.transition, delay: 0.9 } }}
                            >
                                <div className={styles.floatingLabel}>Class engagement</div>
                                <div className={styles.floatingValue}>92% attendance this week</div>
                            </motion.div>

                            <div className={styles.showcase}>
                                <div className={styles.showcaseHeader}>
                                    <div className={styles.showcaseDots}>
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                    <div className={styles.showcasePath}>/dashboard/overview</div>
                                </div>

                                <div className={styles.showcaseBody}>
                                    <div className={styles.showcaseSidebar}>
                                        <div className={styles.sidebarBrand}>Algo-Grade</div>
                                        <div className={styles.sidebarGroup}>
                                            <span className={styles.sidebarLabel}>Workspace</span>
                                            <div className={styles.sidebarItemActive}>
                                                <BookOpenCheck className={styles.sidebarIcon} />
                                                Assignments
                                            </div>
                                            <div className={styles.sidebarItem}>
                                                <BarChart3 className={styles.sidebarIcon} />
                                                Results
                                            </div>
                                            <div className={styles.sidebarItem}>
                                                <CalendarDays className={styles.sidebarIcon} />
                                                Attendance
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.showcaseContent}>
                                        <div className={styles.showcasePanel}>
                                            <div className={styles.panelTop}>
                                                <div>
                                                    <p className={styles.panelEyebrow}>Current assignment</p>
                                                    <h3 className={styles.panelTitle}>Greedy + DP Studio</h3>
                                                </div>
                                                <span className={styles.panelBadge}>Open</span>
                                            </div>

                                            <div className={styles.statRow}>
                                                <div className={styles.statCard}>
                                                    <span className={styles.statCardLabel}>Problems</span>
                                                    <span className={styles.statCardValue}>6</span>
                                                </div>
                                                <div className={styles.statCard}>
                                                    <span className={styles.statCardLabel}>Marks</span>
                                                    <span className={styles.statCardValue}>120</span>
                                                </div>
                                                <div className={styles.statCard}>
                                                    <span className={styles.statCardLabel}>Due</span>
                                                    <span className={styles.statCardValue}>Fri 11:59</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.codeShell}>
                                            <div className={styles.codeHeader}>
                                                <div className={styles.codeTabs}>
                                                    <span className={styles.codeTabActive}>solution.cpp</span>
                                                    <span className={styles.codeTab}>tests</span>
                                                </div>
                                                <div className={styles.codeMeta}>C++</div>
                                            </div>

                                            <pre className={styles.codeBlock}>
                                                <code>{`priority_queue<int> pq;
while (k-- && !pq.empty()) {
  score += pq.top();
  pq.pop();
}
cout << score << "\\n";`}</code>
                                            </pre>
                                        </div>

                                        <div className={styles.resultRail}>
                                            <div className={styles.resultRow}>
                                                <div className={styles.resultIconPass}>
                                                    <CheckCheck className={styles.resultIconSvg} />
                                                </div>
                                                <div>
                                                    <p className={styles.resultTitle}>Execution complete</p>
                                                    <p className={styles.resultText}>Feedback returned in 1.8s</p>
                                                </div>
                                            </div>
                                            <div className={styles.resultProgress}>
                                                <span className={styles.resultProgressFill} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </section>

                <section id="capabilities" className={styles.section}>
                    <motion.div
                        className={styles.sectionIntro}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-120px" }}
                        variants={stagger}
                    >
                        <motion.p variants={fadeUp} className={styles.sectionKicker}>
                            Platform capabilities
                        </motion.p>
                        <motion.h2 variants={fadeUp} className={styles.sectionTitle}>
                            Built for the full rhythm of coursework, not just submissions
                        </motion.h2>
                        <motion.p variants={fadeUp} className={styles.sectionText}>
                            The portal is designed to support the real classroom cycle:
                            assignment release, solution work, evaluation, attendance, and
                            analytics in one consistent product language.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        className={styles.featureGrid}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                    >
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <motion.article
                                    key={feature.title}
                                    variants={fadeUp}
                                    className={`${styles.featureCard} ${styles[`feature${feature.tone}`]}`}
                                >
                                    <div className={styles.featureTop}>
                                        <div className={styles.featureIconWrap}>
                                            <Icon className={styles.featureIcon} />
                                        </div>
                                        <span className={styles.featureMeta}>{feature.meta}</span>
                                    </div>
                                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                                    <p className={styles.featureBody}>{feature.body}</p>
                                </motion.article>
                            );
                        })}
                    </motion.div>
                </section>

                <section id="workflow" className={styles.section}>
                    <div className={styles.workflowShell}>
                        <motion.div
                            className={styles.sectionIntro}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-120px" }}
                            variants={stagger}
                        >
                            <motion.p variants={fadeUp} className={styles.sectionKicker}>
                                Workflow
                            </motion.p>
                            <motion.h2 variants={fadeUp} className={styles.sectionTitle}>
                                A three-step flow that keeps academic work moving
                            </motion.h2>
                        </motion.div>

                        <motion.div
                            className={styles.timeline}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={stagger}
                        >
                            {workflow.map((item) => (
                                <motion.article key={item.step} variants={fadeUp} className={styles.timelineCard}>
                                    <div className={styles.timelineStep}>{item.step}</div>
                                    <h3 className={styles.timelineTitle}>{item.title}</h3>
                                    <p className={styles.timelineBody}>{item.body}</p>
                                </motion.article>
                            ))}
                        </motion.div>
                    </div>
                </section>

                <section id="why" className={styles.section}>
                    <div className={styles.valueBand}>
                        <div className={styles.valueCopy}>
                            <p className={styles.sectionKicker}>Why it works</p>
                            <h2 className={styles.sectionTitle}>
                                Less friction for admins. More momentum for students.
                            </h2>
                            <p className={styles.sectionText}>
                                Algo-Grade removes the broken handoffs between spreadsheets, email,
                                manual grading, and scattered dashboards. The result is a calmer
                                academic workflow that still feels modern and fast.
                            </p>
                        </div>

                        <div className={styles.valueList}>
                            <div className={styles.valueItem}>
                                <Layers3 className={styles.valueIcon} />
                                <div>
                                    <h3 className={styles.valueTitle}>One system, multiple roles</h3>
                                    <p className={styles.valueText}>
                                        Student and admin experiences stay separate while sharing the
                                        same source of truth.
                                    </p>
                                </div>
                            </div>
                            <div className={styles.valueItem}>
                                <Zap className={styles.valueIcon} />
                                <div>
                                    <h3 className={styles.valueTitle}>Feedback arrives while focus is high</h3>
                                    <p className={styles.valueText}>
                                        Fast execution and clearer status views shorten the loop between
                                        attempt and understanding.
                                    </p>
                                </div>
                            </div>
                            <div className={styles.valueItem}>
                                <ShieldCheck className={styles.valueIcon} />
                                <div>
                                    <h3 className={styles.valueTitle}>Institution-ready foundations</h3>
                                    <p className={styles.valueText}>
                                        Authentication, onboarding, attendance, and course operations are
                                        already part of the platform.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.finalCta}>
                    <div className={styles.finalCtaCard}>
                        <div>
                            <p className={styles.sectionKicker}>Ready to enter the portal?</p>
                            <h2 className={styles.finalTitle}>
                                Sign in and move straight into your course workspace.
                            </h2>
                        </div>
                        <div className={styles.finalActions}>
                            <SignInModalButton className={styles.primaryBtnHero}>
                                Continue With Sign In
                                <ArrowRight className={styles.btnIcon} />
                            </SignInModalButton>
                            <Link href="#capabilities" className={styles.inlineLink}>
                                View capabilities
                                <ChevronRight className={styles.inlineIcon} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className={styles.metric}>
            <span className={styles.metricValue}>{value}</span>
            <span className={styles.metricLabel}>{label}</span>
        </div>
    );
}
