document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const otpInputs = document.querySelectorAll('.otp-input');
    const countdownEl = document.getElementById('countdown');
    
    // Variables
    let countdownInterval;
    let countdown = 60;
    let generatedOTP = '';
    
    // Send OTP button click
    sendOtpBtn.addEventListener('click', function() {
      // Validate form fields
      const username = document.getElementById('username').value;
      const fullname = document.getElementById('fullname').value;
      const phone = document.getElementById('phone').value;
      const email = document.getElementById('email').value;
      
      if (!username || !fullname || !phone || !email) {
        alert('Please fill in all fields');
        return;
      }
      
      // Generate and send OTP
      generateAndSendOTP();
      
      // Move to step 2
      step1.classList.remove('active');
      step2.classList.add('active');
      
      // Start countdown
      startCountdown();
      
      // Focus on first OTP input
      otpInputs[0].focus();
    });
    
    // OTP input handling - move to next input automatically
    otpInputs.forEach((input, index) => {
      input.addEventListener('keyup', (e) => {
        if (e.key >= '0' && e.key <= '9') {
          // Move to next input
          if (index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
          }
        } else if (e.key === 'Backspace') {
          // Move to previous input on backspace
          if (index > 0) {
            otpInputs[index - 1].focus();
          }
        }
      });
    });
    
    // Resend OTP
    resendOtpBtn.addEventListener('click', function() {
      generateAndSendOTP();
      startCountdown();
      resetOTPInputs();
      otpInputs[0].focus();
    });
    
    // Verify OTP
    verifyOtpBtn.addEventListener('click', function() {
      const enteredOTP = Array.from(otpInputs).map(input => input.value).join('');
      
      if (enteredOTP === generatedOTP) {
        // Successful verification
        alert('OTP verified successfully! Redirecting to home page...');
        
        // Redirect to home page
        window.location.href = 'index.html';
      } else {
        alert('Invalid OTP. Please try again.');
        resetOTPInputs();
        otpInputs[0].focus();
      }
    });
    
    // Generate and simulate sending OTP
    function generateAndSendOTP() {
      // Generate a random 6-digit OTP
      generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
      
      // In a real application, you would send this OTP via SMS/email
      // For demo purposes, we'll just log it to console
      console.log('Generated OTP:', generatedOTP);
      
      // In development/testing, you can show the OTP in an alert
      alert('Your OTP for testing: ' + generatedOTP);
    }
    
    // Start countdown timer
    function startCountdown() {
      // Clear any existing interval
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      
      // Reset countdown
      countdown = 60;
      countdownEl.textContent = countdown;
      
      // Start new countdown
      countdownInterval = setInterval(function() {
        countdown--;
        countdownEl.textContent = countdown;
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          // Optionally disable verification until OTP is resent
        }
      }, 1000);
    }
    
    // Reset OTP input fields
    function resetOTPInputs() {
      otpInputs.forEach(input => {
        input.value = '';
      });
    }
  });