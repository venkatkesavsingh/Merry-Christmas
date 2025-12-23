document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("snow");
    const ctx = canvas.getContext("2d");
    const container = document.querySelector(".container");
    if (!canvas || !container) return;

    /* =====================
       CANVAS
    ====================== */
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    /* =====================
       SNOWFLAKES
    ====================== */
    const flakes = [];
    const released = [];
    const ground = [];
    const COUNT = 220;

    function createFlake(y = -20, x = Math.random() * canvas.width) {
        return {
            x,
            y,
            r: Math.random() * 2 + 1,
            vy: Math.random() * 1 + 0.8,
            vx: Math.random() * 0.4 - 0.2
        };
    }

    for (let i = 0; i < COUNT; i++) {
        flakes.push(createFlake(Math.random() * canvas.height));
    }

    /* =====================
       SNOW CAP (TOP)
    ====================== */
    let snowCap = [];

    function initCap(width) {
        snowCap = new Array(Math.floor(width)).fill(0);
    }
    initCap(container.offsetWidth);

    function addToCap() {
        const c = snowCap.length / 2;
        for (let i = 0; i < snowCap.length; i++) {
            const d = Math.abs(i - c) / c;
            snowCap[i] = Math.min(snowCap[i] + Math.max(0.04, 0.08 * (1 - d * d)), 40);
        }
    }

    function drawCap(rect) {
        ctx.beginPath();
        ctx.moveTo(rect.left, rect.top);
        snowCap.forEach((h, i) => {
            ctx.lineTo(rect.left + i, rect.top - h);
        });
        ctx.lineTo(rect.right, rect.top);
        ctx.closePath();
        ctx.fillStyle = "white";
        ctx.fill();
    }

    /* =====================
       RELEASE CAP
    ====================== */
    function releaseCap(rect) {
        snowCap.forEach((h, i) => {
            for (let j = 0; j < math,min(3, h / 6); j++) {
                released.push({
                    x: rect.left + i,
                    y: rect.top - h,
                    r: Math.random() * 2.5 + 1,
                    vy: Math.random() * 1 + 1,
                    vx: (Math.random() - 0.5) * 1.2
                });
            }
        });
        snowCap.fill(0);
    }

    /* =====================
       GROUND PILE
    ====================== */
    function addToGround(x) {
        ground.push({
            x,
            h: Math.random() * 4 + 2
        });
    }

    function drawGround() {
        ground.forEach(p => {
            ctx.fillRect(p.x, canvas.height - p.h, 3, p.h);
        });
    }

    /* =====================
       ANIMATION
    ====================== */
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const rect = container.getBoundingClientRect();

        // Falling snow
        flakes.forEach(f => {
            f.y += f.vy;
            f.x += f.vx;

            // Hit container → accumulate
            if (
                f.y >= rect.top &&
                f.y <= rect.top + 5 &&
                f.x >= rect.left &&
                f.x <= rect.right
            ) {
                addToCap();
                f.y = -20;
                f.x = Math.random() * canvas.width;
            }

            // Reach bottom → ground pile
            if (f.y > canvas.height) {
                addToGround(f.x);
                f.y = -20;
                f.x = Math.random() * canvas.width;
            }

            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fillStyle = "white";
            ctx.fill();
        });

        // Released snow
        for (let i = released.length - 1; i >= 0; i--) {
            const f = released[i];
            f.vy += 0.03; // gravity
            f.y += f.vy;
            f.x += f.vx;

            if (f.y > canvas.height) {
                addToGround(f.x);
                released.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fillStyle = "white";
            ctx.fill();
        }

        drawCap(rect);
        drawGround();

        if (snowCap.length !== Math.floor(rect.width)) {
            initCap(rect.width);
        }

        requestAnimationFrame(animate);
    }

    animate();

    /* =====================
       SHAKE + RELEASE
    ====================== */
    setInterval(() => {
        container.classList.add("jitter");
        releaseCap(container.getBoundingClientRect());

        setTimeout(() => {
            container.classList.remove("jitter");
        }, 900);
    }, 7000);
});
