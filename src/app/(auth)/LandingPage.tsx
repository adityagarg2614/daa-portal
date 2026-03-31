"use client";

import Link from "next/link";
import { SignInModalButton } from "../../components/SignInModalButton";
import { Sparkles, Code2, BarChart3, Users, Zap, Shield, ArrowRight, Github, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import styles from "./LandingPage.module.css";

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
};

const floatAnimation = {
    y: [0, -20, 0],
    transition: { duration: 4, repeat: Infinity }
};

const featureVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.3 + i * 0.15, duration: 0.6 }
    })
};

export default function LandingPage() {
    return (
        <div className={styles.landingRoot}>
            {/* Animated background */}
            <div className={styles.bgGrid} aria-hidden="true" />
            <div className={`${styles.gradientOrb} ${styles.orb1}`} aria-hidden="true" />
            <div className={`${styles.gradientOrb} ${styles.orb2}`} aria-hidden="true" />
            <div className={`${styles.gradientOrb} ${styles.orb3}`} aria-hidden="true" />

            {/* Navigation */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={styles.navContainer}
            >
                <div className={styles.navContent}>
                    <Link href="/" className={styles.logoLink}>
                        <motion.div
                            className={styles.logoIcon}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Sparkles className={styles.logoSparkle} />
                        </motion.div>
                        <div className={styles.logoText}>
                            <span className={styles.logoTitle}>Algo-Grade</span>
                            <span className={styles.logoSubtitle}>Code Together</span>
                        </div>
                    </Link>

                    <div className={styles.navActions}>
                        <Link href="#features" className={styles.navLink}>Features</Link>
                        <Link href="#how-it-works" className={styles.navLink}>How It Works</Link>
                        <SignInModalButton className={styles.btnPrimary} />
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <main className={styles.mainContent}>
                <section className={styles.heroSection}>
                    {/* Floating code blocks decoration */}
                    <motion.div
                        className={`${styles.codeDecoration} ${styles.code1}`}
                        animate={floatAnimation}
                        transition={{ delay: 0.5 }}
                        aria-hidden="true"
                    >
                        <Code2 className={styles.decorationIcon} />
                    </motion.div>
                    <motion.div
                        className={`${styles.codeDecoration} ${styles.code2}`}
                        animate={floatAnimation}
                        transition={{ delay: 1.5 }}
                        aria-hidden="true"
                    >
                        <Zap className={styles.decorationIcon} />
                    </motion.div>

                    <motion.div
                        className={styles.heroContent}
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeInUp} className={styles.heroBadge}>
                            <span className={styles.badgeDot} />
                            Design & Analysis of Algorithms Portal
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className={styles.heroTitle}>
                            Master Algorithms.
                            <br />
                            <span className={styles.gradientText}>Track Progress.</span>
                            <br />
                            <span className={`${styles.gradientText} ${styles.gradient2}`}>Excel Faster.</span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className={styles.heroDescription}>
                            The all-in-one grading platform for DAA coursework — submit solutions,
                            get instant feedback, and watch your skills grow with real-time analytics
                            and automated grading powered by cutting-edge technology.
                        </motion.p>

                        <motion.div variants={fadeInUp} className={styles.heroCta}>
                            <SignInModalButton className={`${styles.btnPrimary} ${styles.btnLg}`}>
                                Get Started Free
                                <ArrowRight className={styles.btnIcon} />
                            </SignInModalButton>
                            <Link href="#features" className={`${styles.btnSecondary} ${styles.btnLg}`}>
                                Explore Features
                            </Link>
                        </motion.div>

                        {/* Stats */}
                        <motion.div variants={fadeInUp} className={styles.heroStats}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>1000+</span>
                                <span className={styles.statLabel}>Students</span>
                            </div>
                            <div className={styles.statDivider} />
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>50+</span>
                                <span className={styles.statLabel}>Assignments</span>
                            </div>
                            <div className={styles.statDivider} />
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>99%</span>
                                <span className={styles.statLabel}>Accuracy</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </section>

                {/* Features Section */}
                <section id="features" className={styles.featuresSection}>
                    <motion.div
                        className={styles.sectionHeader}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                    >
                        <motion.h2 variants={fadeInUp} className={styles.sectionTitle}>
                            Everything You Need to
                            <span className={styles.gradientText}> Succeed</span>
                        </motion.h2>
                        <motion.p variants={fadeInUp} className={styles.sectionSubtitle}>
                            Powerful features designed for modern algorithm learning and assessment
                        </motion.p>
                    </motion.div>

                    <motion.div
                        className={styles.featuresGrid}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={staggerContainer}
                    >
                        {/* Feature 1 */}
                        <motion.div
                            custom={0}
                            variants={featureVariants}
                            className={styles.featureCard}
                            whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        >
                            <div className={`${styles.featureIconWrapper} ${styles.iconPurple}`}>
                                <Code2 className={styles.featureIcon} />
                            </div>
                            <h3 className={styles.featureTitle}>Auto-Graded Submissions</h3>
                            <p className={styles.featureDescription}>
                                Submit your algorithm implementations and receive instant, accurate feedback
                                with automated test cases. Support for multiple languages including C++, Python, and Java.
                            </p>
                            <div className={styles.featureTags}>
                                <span className={styles.featureTag}>Instant Feedback</span>
                                <span className={styles.featureTag}>Multi-language</span>
                            </div>
                        </motion.div>

                        {/* Feature 2 */}
                        <motion.div
                            custom={1}
                            variants={featureVariants}
                            className={styles.featureCard}
                            whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        >
                            <div className={`${styles.featureIconWrapper} ${styles.iconBlue}`}>
                                <BarChart3 className={styles.featureIcon} />
                            </div>
                            <h3 className={styles.featureTitle}>Real-time Analytics</h3>
                            <p className={styles.featureDescription}>
                                Track your class performance, submission trends, and algorithmic complexity
                                metrics with live dashboards and detailed progress reports.
                            </p>
                            <div className={styles.featureTags}>
                                <span className={styles.featureTag}>Live Dashboards</span>
                                <span className={styles.featureTag}>Progress Tracking</span>
                            </div>
                        </motion.div>

                        {/* Feature 3 */}
                        <motion.div
                            custom={2}
                            variants={featureVariants}
                            className={styles.featureCard}
                            whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        >
                            <div className={`${styles.featureIconWrapper} ${styles.iconViolet}`}>
                                <Users className={styles.featureIcon} />
                            </div>
                            <h3 className={styles.featureTitle}>Role-based Access</h3>
                            <p className={styles.featureDescription}>
                                Secure portals tailored for students and admins, each with the right tools
                                and permissions for their role. Built with enterprise-grade security.
                            </p>
                            <div className={styles.featureTags}>
                                <span className={styles.featureTag}>Secure</span>
                                <span className={styles.featureTag}>Role Management</span>
                            </div>
                        </motion.div>

                        {/* Feature 4 */}
                        <motion.div
                            custom={3}
                            variants={featureVariants}
                            className={styles.featureCard}
                            whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        >
                            <div className={`${styles.featureIconWrapper} ${styles.iconCyan}`}>
                                <Zap className={styles.featureIcon} />
                            </div>
                            <h3 className={styles.featureTitle}>Lightning Fast</h3>
                            <p className={styles.featureDescription}>
                                Powered by Piston API for rapid code execution. Get your results in seconds,
                                not minutes. Optimized for performance and reliability.
                            </p>
                            <div className={styles.featureTags}>
                                <span className={styles.featureTag}>&lt; 2s Execution</span>
                                <span className={styles.featureTag}>99.9% Uptime</span>
                            </div>
                        </motion.div>

                        {/* Feature 5 */}
                        <motion.div
                            custom={4}
                            variants={featureVariants}
                            className={styles.featureCard}
                            whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        >
                            <div className={`${styles.featureIconWrapper} ${styles.iconPink}`}>
                                <Shield className={styles.featureIcon} />
                            </div>
                            <h3 className={styles.featureTitle}>Enterprise Security</h3>
                            <p className={styles.featureDescription}>
                                Built with Clerk authentication and MongoDB for secure data storage.
                                Your code and submissions are protected with industry-standard encryption.
                            </p>
                            <div className={styles.featureTags}>
                                <span className={styles.featureTag}>Clerk Auth</span>
                                <span className={styles.featureTag}>Encrypted</span>
                            </div>
                        </motion.div>

                        {/* Feature 6 */}
                        <motion.div
                            custom={5}
                            variants={featureVariants}
                            className={`${styles.featureCard} ${styles.featureCardCta}`}
                            whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        >
                            <div className={`${styles.featureIconWrapper} ${styles.iconGradient}`}>
                                <Sparkles className={styles.featureIcon} />
                            </div>
                            <h3 className={styles.featureTitle}>And Much More</h3>
                            <p className={styles.featureDescription}>
                                Discover additional features like code comparison, plagiarism detection,
                                custom test cases, and collaborative learning tools.
                            </p>
                            <Link href="#how-it-works" className={styles.featureLink}>
                                Learn more
                                <ChevronRight className={styles.linkIcon} />
                            </Link>
                        </motion.div>
                    </motion.div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className={styles.howItWorksSection}>
                    <motion.div
                        className={styles.sectionHeader}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                    >
                        <motion.h2 variants={fadeInUp} className={styles.sectionTitle}>
                            How It
                            <span className={styles.gradientText}> Works</span>
                        </motion.h2>
                        <motion.p variants={fadeInUp} className={styles.sectionSubtitle}>
                            Get started in three simple steps
                        </motion.p>
                    </motion.div>

                    <motion.div
                        className={styles.stepsContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                    >
                        <motion.div custom={0} variants={featureVariants} className={styles.stepCard}>
                            <div className={styles.stepNumber}>01</div>
                            <h3 className={styles.stepTitle}>Sign Up</h3>
                            <p className={styles.stepDescription}>
                                Create your account using your institution credentials.
                                Quick setup with Clerk authentication.
                            </p>
                        </motion.div>

                        <motion.div custom={1} variants={featureVariants} className={styles.stepCard}>
                            <div className={styles.stepNumber}>02</div>
                            <h3 className={styles.stepTitle}>Complete Onboarding</h3>
                            <p className={styles.stepDescription}>
                                Enter your roll number and complete the onboarding process
                                to get access to your personalized dashboard.
                            </p>
                        </motion.div>

                        <motion.div custom={2} variants={featureVariants} className={styles.stepCard}>
                            <div className={styles.stepNumber}>03</div>
                            <h3 className={styles.stepTitle}>Start Coding</h3>
                            <p className={styles.stepDescription}>
                                Access assignments, submit solutions, and get instant
                                feedback with our automated grading system.
                            </p>
                        </motion.div>
                    </motion.div>
                </section>

                {/* CTA Section */}
                <section className={styles.ctaSection}>
                    <motion.div
                        className={styles.ctaContent}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeInUp} className={styles.ctaBadge}>
                            Ready to Get Started?
                        </motion.div>
                        <motion.h2 variants={fadeInUp} className={styles.ctaTitle}>
                            Join the Algorithm
                            <br />
                            <span className={styles.gradientText}>Mastery Journey</span>
                        </motion.h2>
                        <motion.p variants={fadeInUp} className={styles.ctaDescription}>
                            Start your journey today and experience the future of algorithm learning and assessment.
                        </motion.p>
                        <motion.div variants={fadeInUp} className={styles.ctaActions}>
                            <SignInModalButton className={`${styles.btnPrimary} ${styles.btnXl}`}>
                                Start Free Trial
                                <ArrowRight className={styles.btnIcon} />
                            </SignInModalButton>
                        </motion.div>
                    </motion.div>
                </section>
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerBrand}>
                        <Link href="/" className={styles.footerLogo}>
                            <div className={styles.footerLogoIcon}>
                                <Sparkles className={styles.sparkleIcon} />
                            </div>
                            <span className={styles.footerLogoText}>Algo-Grade</span>
                        </Link>
                        <p className={styles.footerDescription}>
                            The premier platform for Design & Analysis of Algorithms education.
                        </p>
                    </div>

                    <div className={styles.footerLinks}>
                        <div className={styles.footerColumn}>
                            <h4 className={styles.footerHeading}>Product</h4>
                            <Link href="#features" className={styles.footerLink}>Features</Link>
                            <Link href="#how-it-works" className={styles.footerLink}>How It Works</Link>
                        </div>
                        <div className={styles.footerColumn}>
                            <h4 className={styles.footerHeading}>Resources</h4>
                            <a href="#" className={styles.footerLink}>Documentation</a>
                            <a href="#" className={styles.footerLink}>API Reference</a>
                        </div>
                        <div className={styles.footerColumn}>
                            <h4 className={styles.footerHeading}>Legal</h4>
                            <a href="#" className={styles.footerLink}>Privacy Policy</a>
                            <a href="#" className={styles.footerLink}>Terms of Service</a>
                        </div>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <p className={styles.copyright}>© {new Date().getFullYear()} Algo-Grade. All rights reserved.</p>
                    <div className={styles.socialLinks}>
                        <a href="#" className={styles.socialLink} aria-label="GitHub">
                            <Github className={styles.socialIcon} />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
