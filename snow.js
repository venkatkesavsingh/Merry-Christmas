document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("snow");
    const ctx = canvas.getContext("2d");
    const container = document.querySelector(".container");
    if (!canvas || !container) return;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initGround(); 
    }
    window.addEventListener("resize", resize);

    /* =====================
       GROUND STATE (Uneven & Sinking)
    ====================== */
    let groundSegments = []; 
    const segmentWidth = 2;
    const TARGET_BASE_HEIGHT = 70; 

    function initGround() {
        const totalSegments = Math.ceil(window.innerWidth / segmentWidth);
        groundSegments = [];
        for (let i = 0; i < totalSegments; i++) {
            // Start with highly uneven "Natural" drifts
            groundSegments.push(TARGET_BASE_HEIGHT + Math.sin(i * 0.06) * 12 + (Math.random() * 10));
        }
    }
    initGround();
    resize();

    /* =====================
       NATURAL SNOWMAN
    ====================== */
    function drawSnowman(x, y) {
        const gradient = ctx.createRadialGradient(x-10, y-100, 5, x, y-60, 80);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, "#cfd9e3"); 
        ctx.fillStyle = gradient;

        ctx.strokeStyle = "#3d2b1f"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x-30, y-80); ctx.lineTo(x-65, y-115); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+30, y-80); ctx.lineTo(x+75, y-110); ctx.stroke();

        ctx.beginPath(); ctx.arc(x, y - 40, 48, 0, Math.PI * 2); ctx.fill(); 
        ctx.beginPath(); ctx.arc(x + 4, y - 105, 34, 0, Math.PI * 2); ctx.fill(); 
        ctx.beginPath(); ctx.arc(x - 2, y - 150, 22, 0, Math.PI * 2); ctx.fill(); 

        ctx.fillStyle = "#111";
        ctx.beginPath(); ctx.arc(x-8, y-155, 3, 0, Math.PI * 2); ctx.fill(); 
        ctx.beginPath(); ctx.arc(x+8, y-155, 3, 0, Math.PI * 2); ctx.fill(); 
        ctx.fillStyle = "#ff6600";
        ctx.beginPath(); ctx.moveTo(x, y-150); ctx.lineTo(x+28, y-146); ctx.lineTo(x, y-142); ctx.fill();
    }

    /* =====================
       SNOW LOGIC (Natural Mounds)
    ====================== */
    const flakes = [];
    const releasedChunks = []; // Only falls when container jitters
    const COUNT = 300;
    let snowCap = new Array(Math.floor(container.offsetWidth)).fill(0);

    function createFlake(y = -20) {
        return { 
            x: Math.random() * canvas.width, 
            y, 
            r: Math.random() * 2 + 1, 
            vy: Math.random() * 1.5 + 0.8, 
            vx: Math.random() * 0.6 - 0.3 
        };
    }
    for (let i = 0; i < COUNT; i++) flakes.push(createFlake(Math.random() * canvas.height));

    function addToGround(x, intensity = 4.5) {
        const index = Math.floor(x / segmentWidth);
        if (index >= 0 && index < groundSegments.length) {
            // Add a "clump" to prevent flatness
            for (let i = -10; i <= 10; i++) {
                const idx = index + i;
                if (groundSegments[idx] !== undefined) {
                    const weight = 1 - Math.abs(i / 10);
                    groundSegments[idx] += weight * intensity;
                }
            }
            // Very light smoothing to keep it natural but uneven
            if(groundSegments[index-1] && groundSegments[index+1]) {
                groundSegments[index] = (groundSegments[index] * 0.8) + ((groundSegments[index-1] + groundSegments[index+1])/2 * 0.2);
            }
        }
    }

    function applySink() {
        for (let i = 0; i < groundSegments.length; i++) {
            if (groundSegments[i] > TARGET_BASE_HEIGHT) {
                // Slower sink rate (0.05) to allow drifts to build up
                groundSegments[i] -= 0.05; 
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const rect = container.getBoundingClientRect();

        applySink();

        // 1. Regular Falling Snow (Background)
        flakes.forEach(f => {
            f.y += f.vy; f.x += f.vx;

            // Hit Container (Only accumulates, does not pass through)
            if (f.y >= rect.top - 5 && f.y <= rect.top + 5 && f.x >= rect.left && f.x <= rect.right) {
                const capIdx = Math.floor(f.x - rect.left);
                if(snowCap[capIdx] !== undefined) {
                    snowCap[capIdx] = Math.min(snowCap[capIdx] + 2.5, 45); // Thick cap
                }
                f.y = -20; f.x = Math.random() * canvas.width;
            }

            // Hit Ground
            const gIdx = Math.floor(f.x / segmentWidth);
            if (f.y > canvas.height - (groundSegments[gIdx] || 0)) {
                addToGround(f.x);
                Object.assign(f, createFlake());
            }

            // DRAW FLAKE (Check if it's in front of container)
            // If you want it behind, you can skip drawing if it's within rect bounds
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fillStyle = "white"; ctx.fill();
        });

        // 2. RELEASED SNOW (Only visible after Jitter)
        for (let i = releasedChunks.length - 1; i >= 0; i--) {
            const f = releasedChunks[i];
            f.vy += 0.2; f.y += f.vy; f.x += f.vx;
            const gIdx = Math.floor(f.x / segmentWidth);
            if (f.y > canvas.height - (groundSegments[gIdx] || 0)) {
                addToGround(f.x, 6); // Jitter snow adds significant drifts
                releasedChunks.splice(i, 1);
                continue;
            }
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fillStyle = "white"; ctx.fill();
        }

        // 3. Draw Top Cap (Visible Snow)
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.moveTo(rect.left, rect.top);
        snowCap.forEach((h, i) => ctx.lineTo(rect.left + i, rect.top - h));
        ctx.lineTo(rect.right, rect.top); ctx.fill();

        // 4. Draw Natural Ground Base
        const grad = ctx.createLinearGradient(0, canvas.height - 75, 0, canvas.height);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, "#e6edf5"); 
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.moveTo(0, canvas.height);
        groundSegments.forEach((h, i) => ctx.lineTo(i * segmentWidth, canvas.height - h));
        ctx.lineTo(canvas.width, canvas.height); ctx.fill();

        // 5. Draw Snowman
        const smX = canvas.width - 160;
        const smY = canvas.height - (groundSegments[Math.floor(smX / segmentWidth)] || 60);
        drawSnowman(smX, smY);

        requestAnimationFrame(animate);
    }
    animate();

    /* =====================
       JITTER / SHAKE LOGIC
    ====================== */
    setInterval(() => {
        container.classList.add("jitter");
        const rect = container.getBoundingClientRect();
        
        // When jittering, convert the Cap into falling "ReleasedChunks"
        snowCap.forEach((h, i) => {
            if (h > 2) {
                // Release larger chunks proportional to height
                for(let j = 0; j < Math.ceil(h/5); j++) {
                    releasedChunks.push({
                        x: rect.left + i + (Math.random() * 6 - 3), 
                        y: rect.top - h, 
                        r: Math.random() * 2.5 + 1.5,
                        vy: Math.random() * 2, 
                        vx: (Math.random() - 0.5) * 5
                    });
                }
            }
        });
        
        snowCap.fill(0); // Reset the cap after it falls
        setTimeout(() => container.classList.remove("jitter"), 500);
    }, 12000); 
});