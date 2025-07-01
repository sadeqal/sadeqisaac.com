particlesJS("particles-js", {
    particles: {
        number: {
            value: 75,
            density: {
                enable: true,
                value_area: 700,
            },
        },
        color: {
            value: ["#00FFC5", "#8B00FF", "#FFD700"],
        },
        shape: {
            type: ["star", "polygon"],
            stroke: {
                width: 1,
                color: "#000000",
            },
            polygon: {
                nb_sides: 6,
            },
        },
        opacity: {
            value: 0.7,
            random: true,
            anim: {
                enable: true,
                speed: 1,
                opacity_min: 0.3,
                sync: false,
            },
        },
        size: {
            value: 5,
            random: true,
            anim: {
                enable: true,
                speed: 2,
                size_min: 1,
                sync: false,
            },
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: "#4ECCA3",
            opacity: 0.5,
            width: 1,
        },
        move: {
            enable: true,
            speed: 3,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
            attract: {
                enable: false,
                rotateX: 600,
                rotateY: 1200,
            },
        },
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: {
                enable: true,
                mode: "grab",
            },
            onclick: {
                enable: true,
                mode: "push",
            },
            resize: true,
        },
        modes: {
            grab: {
                distance: 200,
                line_linked: {
                    opacity: 0.8,
                },
            },
            bubble: {
                distance: 200,
                size: 8,
                duration: 2,
                opacity: 0.6,
                speed: 3,
            },
            repulse: {
                distance: 150,
                duration: 0.4,
            },
            push: {
                particles_nb: 4,
            },
            remove: {
                particles_nb: 2,
            },
        },
    },
    retina_detect: true,
});