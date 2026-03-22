import Link from "next/link";
import { SignInModalButton } from "../../components/SignInModalButton";
import styles from "./LandingPage.module.css";
import { Sparkles } from "lucide-react";



export default function LandingPage() {
    return (
        <div className={styles.root}>
            {/* Animated background grid */}
            <div className={styles.bgGrid} aria-hidden="true" />

            {/* Glowing orbs */}
            <div className={`${styles.orb} ${styles.orb1}`} aria-hidden="true" />
            <div className={`${styles.orb} ${styles.orb2}`} aria-hidden="true" />

            {/* ─── Nav ─── */}
            <nav className="bg-background/80 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex text-2xl items-center gap-3 hover:scale-105 font-bold text-primary transition-transform duration-200"
                    >
                        <div className="size-10 rounded-xl bg-linear-to-br from-primary via-secondary to-accent p-2 text-white flex items-center justify-center shadow-lg">
                            <Sparkles />
                        </div>

                        <div className="flex flex-col">
                            <span className="font-black text-xl bg-linear-to-r from-blue-50 via-blue-900 to-blue-50 bg-clip-text text-transparent font-mono tracking-wider">
                                Algo-Grade
                            </span>
                            <span className="text-xs text-muted-foreground font-medium -mt-1">
                                Code Together
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        <SignInModalButton className="group px-6 py-3 bg-linear-to-r from-primary to-secondary rounded-xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2" />
                    </div>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <main>
                <section className={styles.hero}>
                    <div className={styles.badge}>
                        <span className={styles.badgeDot} />
                        Design &amp; Analysis of Algorithms Portal
                    </div>

                    <h1 className={styles.heroTitle}>
                        Master Algorithms.
                        <br />
                        <span className={styles.gradientText}>Track Progress.</span>
                    </h1>

                    <p className={styles.heroSub}>
                        The all-in-one grading platform for DAA coursework — submit solutions,
                        get instant feedback, and watch your skills grow.
                    </p>

                    <div className={styles.ctaGroup}>
                        <SignInModalButton className="group px-6 py-3 bg-linear-to-r from-primary to-secondary rounded-xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2" />
                    </div>
                </section>

                {/* ─── Feature Cards ─── */}
                <section className={styles.features}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon} style={{ background: "rgba(129,140,248,0.12)" }}>
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#818cf8" strokeWidth="2" />
                            </svg>
                        </div>
                        <h3 className={styles.featureTitle}>Auto-Graded Submissions</h3>
                        <p className={styles.featureDesc}>
                            Submit your algorithm implementations and receive instant, accurate
                            feedback with automated test cases.
                        </p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon} style={{ background: "rgba(56,189,248,0.12)" }}>
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3 className={styles.featureTitle}>Real-time Analytics</h3>
                        <p className={styles.featureDesc}>
                            Track your class performance, submission trends, and algorithmic
                            complexity metrics with live dashboards.
                        </p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon} style={{ background: "rgba(167,139,250,0.12)" }}>
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4" stroke="#a78bfa" strokeWidth="2" />
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3 className={styles.featureTitle}>Role-based Access</h3>
                        <p className={styles.featureDesc}>
                            Secure portals tailored for students and admins, each with the
                            right tools and permissions for their role.
                        </p>
                    </div>
                </section>
            </main>

            {/* ─── Footer ─── */}
            <footer className={styles.footer}>
                <span>© {new Date().getFullYear()} Algo-Grade</span>
                <div className={styles.footerLinks}>
                    <a href="#" className={styles.footerLink}>Privacy</a>
                    <a href="#" className={styles.footerLink}>Terms</a>
                    <a href="#" className={styles.footerLink}>Contact</a>
                </div>
            </footer>
        </div>
    );
}
