import { useState, FormEvent } from "react";
import { customerAPI, type CustomerFormData } from "../lib/customerAPI";

interface CustomerPopupProps {
  open: boolean;
  onClose: () => void;
}

export const CustomerPopup: React.FC<CustomerPopupProps> = ({ open, onClose }) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    fullName: "",
    contactNumber: "",
    email: "",
    dateOfBirth: "",
    anniversaryDate: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const validateForm = (values: CustomerFormData) => {
    if (!values.fullName.trim()) return "Full Name is required";
    if (!values.contactNumber.trim()) return "Contact No. is required";
    if (!values.email.trim()) return "Email is required";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(values.email)) return "Invalid email format";
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await customerAPI.createCustomer(formData);
      setSuccess("Thanks! Your details were saved. Enjoy ordering.");
      setFormData({ fullName: "", contactNumber: "", email: "", dateOfBirth: "", anniversaryDate: "" });
    } catch (err) {
      console.error(err);
      setError("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="customer-modal-overlay">
      <div className="customer-modal">
        <button type="button" className="customer-modal-close" onClick={() => { setError(null); setSuccess(null); onClose(); }}>
          ✕
        </button>

        <h3>Guest Registration</h3>
        <p className="customer-modal-subtitle">Fill in your details to proceed and get personalized experience.</p>

        <form onSubmit={handleSubmit} className="customer-modal-form">
          <label>
            Full Name
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </label>

          <label>
            Contact No.
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </label>

          <label>
            Date of Birth
            <input
              type="date"
              value={formData.dateOfBirth || ""}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </label>

          <label>
            Anniversary Date
            <input
              type="date"
              value={formData.anniversaryDate || ""}
              onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
            />
          </label>

          {error && <div className="customer-modal-alert customer-modal-alert--error">{error}</div>}
          {success && <div className="customer-modal-alert customer-modal-alert--success">{success}</div>}

          <div className="customer-modal-actions">
            <button type="button" className="customer-btn customer-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="customer-btn customer-btn--primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
