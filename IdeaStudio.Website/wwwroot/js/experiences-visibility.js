// Add to your existing animations.js or create a separate utilities.js
window.toggleExperienceVisibility = function(experienceId, show) {
    const wrapper = document.getElementById(`experience-wrapper-${experienceId.split('-').pop()}`);
    if (wrapper) {
        if (show) {
            // Show experience
            wrapper.classList.remove('d-none');
            wrapper.classList.add('d-flex');
            
            // Trigger animation if element has fade-in class
            const experience = wrapper.querySelector('.fade-in-up');
            if (experience && !experience.classList.contains('animate')) {
                setTimeout(() => experience.classList.add('animate'), 50);
            }
        } else {
            // Hide experience
            wrapper.classList.remove('d-flex');
            wrapper.classList.add('d-none');
        }
    }
};

window.scrollToElement = function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
    }
};