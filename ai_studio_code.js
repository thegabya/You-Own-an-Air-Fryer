document.addEventListener('DOMContentLoaded', function() {
    // Find the button element by its ID
    const beginButton = document.getElementById('beginButton');

    // Find the audio element by its ID
    const bootSound = document.getElementById('bootSound');

    // Add an event listener for the 'click' event
    beginButton.addEventListener('click', function() {
        console.log("Button clicked!"); // This will show a message in the console
        bootSound.play();
    });
});