// Animation
gsap.from("#title", { y: -100, opacity: 0, duration: 1 });

// Payment & Chat
function pay() {
  window.location.href = "upi://pay?pa=9696065037@pthdfc&pn=Sanskar&cu=INR";
}

function chat() {
  window.open("https://wa.me/919696065037");
}

// Wake up Render Backend silently when page loads
window.addEventListener('load', () => {
  fetch("https://sanskar-backend-d8t9.onrender.com/health")
    .catch(() => console.log("Waking up server..."));
});

// Form Submit Handler
document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    // Calling the new secure v1 API
    await fetch("https://sanskar-backend-d8t9.onrender.com/api/v1/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        message: document.getElementById("message").value
      })
    });

    alert("Lead Sent 🚀");
    e.target.reset(); // Submit hone ke baad form clear ho jayega

  } catch (error) {
    console.error("Error sending lead:", error);
    alert("Kuch technical issue aaya, please try again! ❌");
  }
});
