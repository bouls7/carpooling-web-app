import React from "react";
import { MdEmail, MdPhone } from "react-icons/md";
import styles from "../styles/ContactUs.module.css";

export default function ContactUs() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Get in Touch</h1>

      <section className={styles.contentSection}>
        <p className={styles.paragraph}>
          We're here to help! If you have any questions, feedback, or require assistance, feel free to contact us using the details below.
        </p>

        <div className={styles.contactInfo}>
          <article className={styles.contactCard} tabIndex={0}>
            <MdEmail className={styles.contactIcon} aria-hidden="true" />
            <div className={styles.contactDetails}>
              <span className={styles.contactLabel}>Email</span>
              <a href="mailto:support@poolify.com" className={styles.contactLink}>
                support@poolify.com
              </a>
            </div>
          </article>

          <article className={styles.contactCard} tabIndex={0}>
            <MdPhone className={styles.contactIcon} aria-hidden="true" />
            <div className={styles.contactDetails}>
              <span className={styles.contactLabel}>Phone</span>
              <a href="tel:+1234567890" className={styles.contactLink}>
                +1 (234) 567-890
              </a>
            </div>
          </article>
        </div>

        <p className={styles.paragraph}>
  Feel free to reach out via email or phone, and our team will be happy to assist you promptly.
</p>

      </section>
    </main>
  );
}
