/**
 * FoodHub Restaurant - Reservation Form Handler
 * Author: Mohammad Adil
 */

document.addEventListener("DOMContentLoaded", () => {
  const reservationForm = document.getElementById("reservationForm");
  const submitBtn = reservationForm.querySelector("button[type='submit']");
  const popup = document.getElementById("reservation-popup");
  const popupMessage = document.getElementById("reservation-popup-message");
  const popupClose = document.getElementById("reservation-popup-close");

  // Check if elements exist
  if (!reservationForm) {
    console.error("Reservation form not found!");
    return;
  }

  function showPopup(message, isSuccess = true) {
    if (!popup || !popupMessage) {
      alert(message); // Fallback to alert if popup doesn't exist
      return;
    }
    popupMessage.textContent = message;
    popup.classList.remove("error", "success");
    popup.classList.add(isSuccess ? "success" : "error");
    popup.classList.add("visible");
  }

  if (popupClose) {
    popupClose.addEventListener("click", () => popup.classList.remove("visible"));
  }

  reservationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    // If OTP flow is enabled (reservation-otp.js will handle submit), do not proceed here
    // Skip legacy submit when otpId exists or otpInProgress flag is set
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('otpId') && !localStorage.getItem('otpInProgress')) {
      // No otpId and no otp in-progress — proceed to call legacy flow only if reservation-otp didn't intercept
    } else {
      // OTP flow is active or in-progress; skip legacy submit
      return;
    }
    
    const formData = {
      name: reservationForm.name.value,
      email: reservationForm.email.value,
      phone: reservationForm.phone.value,
      date: reservationForm.date.value,
      time: reservationForm.time.value,
      people: reservationForm.people.value,
      occasion: reservationForm.occasion.value,
      meal_type: reservationForm.meal_type.value,
      payment_mode: reservationForm.payment_mode.value,
      delivery_option: "Dine-in", // Always Dine-in for table reservations
      message: reservationForm.message.value
    };

    // Validate required fields
    if (!formData.occasion || !formData.meal_type) {
      showPopup("Please select occasion and meal type.", false);
      return;
    }

    if (!formData.payment_mode) {
      showPopup("Please select a payment mode.", false);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Reserving...";

    try {
      const response = await fetch("/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      
      if (result.success) {
        // If payment mode is Online, redirect to payment page
        if (formData.payment_mode === "Online") {
          showPopup("Redirecting to payment gateway...", true);
          setTimeout(() => {
            window.location.href = `/payment.html?id=${result.reservationId}&amount=500`;
          }, 1500);
        } else {
          // Cash payment - just show success
          showPopup("Table reservation successful! We will contact you soon. Check your email for confirmation.", true);
          reservationForm.reset();
        }
      } else {
        showPopup(result.message || "Something went wrong.", false);
      }
    } catch (error) {
      console.error(error);
      showPopup("Error submitting reservation. Please try again.", false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Reserve my Table";
    }
  });
});
