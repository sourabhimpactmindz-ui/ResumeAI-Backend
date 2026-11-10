
import { Contact } from "../model/contact.model.js";
import { sendContactEmail } from "../utils/sendMails.js";

export const handleContactMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and message are required.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  try {
    const newContact = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || "General Support",
      message: message.trim(),
    });

    // Send email without blocking API response
    sendContactEmail({
      name: newContact.name,
      email: newContact.email,
      subject: newContact.subject,
      message: newContact.message,
    }).catch((err) => {
      console.error("Contact email failed:", err);
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully.",
    });

  } catch (error) {
    console.error("Contact controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit your message.",
    });
  }
};
