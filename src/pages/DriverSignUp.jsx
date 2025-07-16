import React, { useState } from "react";

export default function DriverSignUp({ onSubmit }) {
  const [driverName, setDriverName] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!driverName || !idFile || !licenseFile) {
      alert("Please fill all fields and upload required documents.");
      return;
    }
    const formData = {
      id: Date.now().toString(),
      driverName,
      idFileURL: URL.createObjectURL(idFile),
      licenseFileURL: URL.createObjectURL(licenseFile),
      status: "pending",
    };
    onSubmit(formData);
    setDriverName("");
    setIdFile(null);
    setLicenseFile(null);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Driver Sign Up</h2>

      <label htmlFor="driverName">
        Full Name:
        <input
          id="driverName"
          type="text"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          required
        />
      </label>

      <label htmlFor="idFile">
        Upload ID Scan:
        <input
          id="idFile"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setIdFile(e.target.files[0])}
          required
        />
      </label>

      <label htmlFor="licenseFile">
        Upload Driver License Scan:
        <input
          id="licenseFile"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setLicenseFile(e.target.files[0])}
          required
        />
      </label>

      <button type="submit">Submit for Review</button>
    </form>
  );
}
