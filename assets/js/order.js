/**
 * FoodHub Restaurant - Online Order Form Handler
 * Author: Mohammad Adil
 */

document.addEventListener("DOMContentLoaded", () => {
  const orderForm = document.getElementById("orderForm");
  const submitBtn = document.getElementById("submitBtn");
  const deliveryOption = document.getElementById("delivery_option");
  const deliveryAddressRow = document.getElementById("deliveryAddressRow");
  const deliveryAddress = document.getElementById("delivery_address");
  const deliveryTypeBtns = document.querySelectorAll(".delivery-type-btn");
  const menuCheckboxes = document.querySelectorAll(".menu-checkbox");
  const filterBtns = document.querySelectorAll(".filter-btn");

  // Handle delivery type selection
  deliveryTypeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      deliveryTypeBtns.forEach(b => b.classList.remove("active"));
      // Add active class to clicked button
      btn.classList.add("active");
      
      const type = btn.getAttribute("data-type");
      deliveryOption.value = type;
      
      // Show/hide delivery address
      if (type === "Delivery") {
        deliveryAddressRow.style.display = "block";
        // Make address fields required
        document.getElementById("house_no").required = true;
        document.getElementById("street").required = true;
        document.getElementById("city").required = true;
        document.getElementById("state").required = true;
        document.getElementById("pincode").required = true;
      } else {
        deliveryAddressRow.style.display = "none";
        // Clear and remove required from address fields
        document.getElementById("house_no").required = false;
        document.getElementById("street").required = false;
        document.getElementById("city").required = false;
        document.getElementById("state").required = false;
        document.getElementById("pincode").required = false;
        document.getElementById("house_no").value = "";
        document.getElementById("street").value = "";
        document.getElementById("landmark").value = "";
        document.getElementById("city").value = "";
        document.getElementById("state").value = "";
        document.getElementById("pincode").value = "";
        document.getElementById("google_maps_link").value = "";
      }
    });
  });

  // Handle menu item checkbox selection
  menuCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", function() {
      const quantityInput = this.closest(".menu-selection-item").querySelector(".quantity-input");
      if (this.checked) {
        quantityInput.disabled = false;
      } else {
        quantityInput.disabled = true;
      }
    });
  });

  // Handle category filter
  filterBtns.forEach(btn => {
    btn.addEventListener("click", function() {
      // Remove active class from all filter buttons
      filterBtns.forEach(b => b.classList.remove("active"));
      // Add active to clicked button
      this.classList.add("active");
      
      const filter = this.getAttribute("data-filter");
      const menuItems = document.querySelectorAll(".menu-selection-item");
      
      menuItems.forEach(item => {
        if (filter === "all") {
          item.style.display = "flex";
        } else {
          if (item.getAttribute("data-category") === filter) {
            item.style.display = "flex";
          } else {
            item.style.display = "none";
          }
        }
      });
    });
  });

  // Form submission
  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect selected menu items
    const menuItems = [];
    menuCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const item = checkbox.closest(".menu-selection-item");
        const name = checkbox.getAttribute("data-name");
        const price = parseFloat(checkbox.getAttribute("data-price"));
        const quantity = parseInt(item.querySelector(".quantity-input").value);
        
        menuItems.push({ name, quantity, price });
      }
    });

    if (menuItems.length === 0) {
      alert("Please select at least one menu item.");
      return;
    }

    // Build complete delivery address from separate fields
    let completeAddress = null;
    let googleMapsLink = null;
    
    if (deliveryOption.value === "Delivery") {
      const houseNo = document.getElementById("house_no").value.trim();
      const street = document.getElementById("street").value.trim();
      const landmark = document.getElementById("landmark").value.trim();
      const city = document.getElementById("city").value.trim();
      const state = document.getElementById("state").value.trim();
      const pincode = document.getElementById("pincode").value.trim();
      
      // Validate required fields
      if (!houseNo || !street || !city || !state || !pincode) {
        alert("Please fill in all required delivery address fields.");
        return;
      }
      
      // Combine into complete address
      completeAddress = `${houseNo}, ${street}`;
      if (landmark) completeAddress += `, ${landmark}`;
      completeAddress += `, ${city}, ${state} - ${pincode}`;
      
      // Set hidden field
      document.getElementById("delivery_address").value = completeAddress;
      
      // Get Google Maps link if provided
      googleMapsLink = document.getElementById("google_maps_link").value.trim() || null;
    }

    const formData = {
      name: orderForm.name.value,
      email: orderForm.email.value,
      phone: orderForm.phone.value,
      date: orderForm.date.value,
      time: orderForm.time.value,
      people: menuItems.length, // Set people based on items count
      occasion: null,
      meal_type: deliveryOption.value === "Delivery" ? "Delivery" : "Takeaway",
      payment_mode: orderForm.payment_mode.value,
      delivery_option: deliveryOption.value,
      delivery_address: completeAddress,
      google_maps_link: googleMapsLink,
      menu_items: menuItems,
      message: orderForm.message.value
    };

    // Validate
    if (!formData.payment_mode) {
      alert("Please select a payment mode.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    try {
      const response = await fetch("/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (formData.payment_mode === "Online") {
          alert("Redirecting to payment gateway...");
          setTimeout(() => {
            window.location.href = `/payment.html?id=${result.reservationId}&amount=500`;
          }, 1500);
        } else {
          alert(`${formData.delivery_option} order placed successfully! We will contact you soon. Check your email for confirmation.`);
          orderForm.reset();
          // Uncheck all items and disable quantity inputs
          menuCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest(".menu-selection-item").querySelector(".quantity-input").disabled = true;
          });
          deliveryAddressRow.style.display = "none";
          // Reset to Takeaway by default
          deliveryTypeBtns.forEach(b => b.classList.remove("active"));
          deliveryTypeBtns[0].classList.add("active");
          deliveryOption.value = "Takeaway";
        }
      } else {
        alert(result.message || "Something went wrong.");
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting order. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Place Order";
    }
  });
});
