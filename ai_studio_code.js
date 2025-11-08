const progressButton = document.getElementById('progress-button');
const hudElements = document.querySelectorAll('.hud-element');
let currentStep = 0;

const simulationSteps = [
    {
        element: document.getElementById('boot-sequence'),
        voiceLine: "Systems booting up, sir."
    },
    {
        element: document.getElementById('diagnostics'),
        voiceLine: "Running diagnostics."
    },
    {
        element: document.getElementById('welcome-message'),
        voiceLine: "Good evening, sir."
    },
    {
        element: document.getElementById('combat-mode'),
        voiceLine: "Combat mode engaged."
    }
];

// Text-to-speech function
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}

progressButton.addEventListener('click', () => {
    if (currentStep < simulationSteps.length) {
        // Hide all elements
        hudElements.forEach(el => el.style.display = 'none');

        // Show the current step's element
        const currentElement = simulationSteps[currentStep].element;
        currentElement.style.display = 'block';

        // Speak the current voice line
        speak(simulationSteps[currentStep].voiceLine);

        // Move to the next step
        currentStep++;

        // Change button text after the first click
        if (currentStep > 0) {
            progressButton.textContent = 'NEXT';
        }
    } else {
        // Optional: Reset or end the simulation
        hudElements.forEach(el => el.style.display = 'none');
        document.getElementById('boot-sequence').style.display = 'block';
        currentStep = 0;
        progressButton.textContent = 'INITIATE';
        speak("Simulation complete. Systems resetting.");
    }
});