// Weather widget using Open-Meteo (no API key) and browser geolocation
(function(){
    const emojiEl = document.getElementById('weather-emoji');
    const tempEl = document.getElementById('weather-temp');
    const condEl = document.getElementById('weather-condition');
    const locEl = document.getElementById('weather-location');

    function codeToEmoji(code) {
        if (code === 0) return {emoji: '☀️', text: 'Clear'};
        if (code === 1) return {emoji: '🌤️', text: 'Mainly clear'};
        if (code === 2) return {emoji: '⛅', text: 'Partly cloudy'};
        if (code === 3) return {emoji: '☁️', text: 'Overcast'};
        if ([45,48].includes(code)) return {emoji: '🌫️', text: 'Fog'};
        if (code >= 51 && code <= 57) return {emoji: '🌦️', text: 'Drizzle'};
        if (code >= 61 && code <= 67) return {emoji: '🌧️', text: 'Rain'};
        if (code >= 71 && code <= 77) return {emoji: '❄️', text: 'Snow'};
        if (code >= 80 && code <= 82) return {emoji: '🌦️', text: 'Rain showers'};
        if (code >= 85 && code <= 86) return {emoji: '❄️', text: 'Snow showers'};
        if (code >= 95) return {emoji: '⛈️', text: 'Thunderstorm'};
        return {emoji: '🌈', text: 'Weather'};
    }

    function showMessage(msg) {
        condEl.textContent = msg;
        tempEl.textContent = '--°C';
        emojiEl.textContent = 'ℹ️';
        locEl.textContent = '';
    }

    if (!('geolocation' in navigator)) {
        showMessage('Geolocation not supported');
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`);
            if (!wRes.ok) throw new Error('Weather fetch failed');
            const wJson = await wRes.json();
            const cw = wJson.current_weather;
            if (!cw) throw new Error('No current weather');
            const t = Math.round(cw.temperature);
            const code = cw.weathercode;
            const info = codeToEmoji(code);
            tempEl.textContent = `${t}°C`;
            condEl.textContent = info.text;
            emojiEl.textContent = info.emoji;

            try {
                const gRes = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`);
                if (gRes.ok) {
                    const gJson = await gRes.json();
                    if (gJson && gJson.results && gJson.results.length) {
                        const r = gJson.results[0];
                        const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
                        locEl.textContent = name;
                    }
                }
            } catch (e) {
                // ignore reverse geocode errors
            }
        } catch (err) {
            console.error(err);
            showMessage('Unable to load weather');
        }
    }, (err) => {
        console.warn(err);
        if (err.code === err.PERMISSION_DENIED) showMessage('Location denied');
        else showMessage('Location unavailable');
    }, {enableHighAccuracy: false, timeout: 10000, maximumAge: 600000});
})();
