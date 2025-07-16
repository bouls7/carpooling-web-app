import React from "react";
import styles from "../styles/PrivacyPolicy.module.css";

export default function PrivacyPolicy() {
  return (
    <main className={styles.container} role="main" tabIndex={-1}>
      <h1 className={styles.title}>Privacy Policy</h1>
      <section className={styles.contentSection} aria-label="Privacy policy details">
        <p className={styles.paragraph}>
          At Poolify, protecting your privacy is our highest priority. This Privacy Policy explains how we collect, use, and safeguard your personal information.
        </p>
        <p className={styles.paragraph}>
          We only collect data necessary to provide and improve our services, always respecting your privacy and complying with all relevant data protection laws.
        </p>
        <div className={styles.highlightBox} tabIndex={0}>
          <p>
            <strong>Your trust matters to us.</strong> We are committed to transparency and ensuring your data is handled securely.
          </p>
        </div>
        <p className={styles.paragraph}>
          Should you have any questions or concerns regarding our privacy practices, please do not hesitate to get in touch.
        </p>
      </section>
    </main>
  );
}
