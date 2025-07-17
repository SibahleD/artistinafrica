document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.studios-content'); // .MAIN is a class since I think It could be more useful

    container.addEventListener('wheel', function(event) {
        if (event.deltaY !== 0) {
            event.preventDefault();
            container.scrollLeft += event.deltaY * 1;
        }
    });
});