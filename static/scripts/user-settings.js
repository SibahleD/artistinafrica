document.addEventListener("DOMContentLoaded", function() {
    // Get all menu items and sections
    const menuItems = document.querySelectorAll('.edit-menu-list li');
    const sections = document.querySelectorAll('.edit-profile-form > div');
    
    // Function to show a specific section and highlight its menu item
    function showSection(sectionName) {
        // Hide all sections
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Remove active class from all menu items
        menuItems.forEach(item => {
            item.style.color = ''; 
        });
        
        // Show the selected section
        const activeSection = document.querySelector(`.edit-profile-form > div[data-name="${sectionName}"]`);
        if (activeSection) {
            activeSection.style.display = 'flex';
        }
        
        // Highlight the active menu item
        const activeMenuItem = document.querySelector(`.edit-menu-list li[data-section="${sectionName}"]`);
        if (activeMenuItem) {
            activeMenuItem.style.color = 'var(--primary-color)';
        }
    }
    
    // Add click event listeners to menu items
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionName = this.getAttribute('data-section');
            showSection(sectionName);
        });
    });
    
    // Show the general info section by default
    showSection('general');
});