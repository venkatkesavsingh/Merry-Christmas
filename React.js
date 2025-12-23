let baseTime;
let lastSync = Date.now();

async function fetchInternetTime() {
    try {
        const res = await fetch("https://worldtimeapi.org/api/ip");
        const data = await res.json();
        baseTime = new Date(data.datetime);
        lastSync = Date.now();
    } catch (e) {
        console.error("Time sync failed", e);
        baseTime = new Date(); // fallback
    }
}

function getCurrentTime() {
    return new Date(baseTime.getTime() + (Date.now() - lastSync));
}

function updateCountdown() {
    const now = getCurrentTime();
    let year = now.getFullYear();

    let christmas = new Date(`${year}-12-25T00:00:00`);

    if (now > christmas) {
        christmas = new Date(`${year + 1}-12-25T00:00:00`);
    }

    const diff = christmas - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    document.getElementById("timer").innerHTML =
        `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

(async () => {
    await fetchInternetTime();
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // re-sync every 5 minutes
    setInterval(fetchInternetTime, 300000);
})();
