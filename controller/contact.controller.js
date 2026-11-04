import { Contact } from "../model/contact.model.js";
import { sendContactEmail } from "../utils/sendMails.js";

export const handleContactMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and message are required fields.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  try {
    // 1. Save inquiry in Database
    const newContact = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      subject: subject ? subject.trim() : "General Support",
      message: message.trim(),
    });

    // 2. Send email notification to admin asynchronously
    sendContactEmail({
      name: newContact.name,
      email: newContact.email,
      subject: newContact.subject,
      message: newContact.message,
    }).catch((err) => console.error("Contact email error:", err));

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We will get back to you soon!",
    });
  } catch (error) {
    console.error("Contact controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later.",
    });
  }
};

