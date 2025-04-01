document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });
  
    // Mobile hamburger menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
  
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('nav-active');
    });
  });
  <script>
  // Toggle FAQ Chat Box Open/Close
  document.getElementById('openFaqChat').addEventListener('click', function(){
      document.getElementById('faqChat').style.display = 'flex';
      this.style.display = 'none';
  });

  document.getElementById('closeFaqChat').addEventListener('click', function(){
      document.getElementById('faqChat').style.display = 'none';
      document.getElementById('openFaqChat').style.display = 'block';
  });

  // Display answer when a question is clicked
  document.querySelectorAll('#faqList li').forEach(function(item){
      item.addEventListener('click', function(){
          var answer = this.getAttribute('data-answer');
          document.getElementById('faqAnswer').textContent = answer;
      });
  });
</script>
