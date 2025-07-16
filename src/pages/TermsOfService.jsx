import React from "react";
import styles from "../styles/TermsOfService.module.css";

export default function TermsOfService() {
  return (
    <main className={styles.container} role="main">
      <h1 className={styles.title}>Terms of Service</h1>

      <section className={styles.contentSection}>
        <p className={styles.paragraph}>
          Welcome to Poolify! By accessing or using our services, you agree to comply with and be legally bound by the following terms and conditions.
        </p>
        <p className={styles.paragraph}>
          Please read these terms carefully. If you do not agree to any part of them, kindly discontinue use of our platform.
        </p>
        <p className={styles.paragraph}>
          We may update these terms periodically. It is your responsibility to review them regularly. Continued use of our services constitutes acceptance of any changes.
        </p>

        <div className={styles.noticeBox} tabIndex={0}>
          <span className={styles.noticeLabel}>Important:</span> Staying informed about our latest terms is part of your user responsibility.
        </div>
      </section>
    </main>
  );
}
