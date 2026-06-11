// Weather widget using Open-Meteo (no API key) and browser geolocation
(function(){
    const emojiEl = document.getElementById('weather-emoji');
    const tempEl = document.getElementById('weather-temp');
    const condEl = document.getElementById('weather-condition');
    const locEl = document.getElementById('weather-location');

    console.log('Weather widget initialized');

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
        console.warn('Geolocation not supported by browser');
        showMessage('Geolocation not supported');
        return;
    }

    console.log('Requesting geolocation...');
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        console.log('Got location:', lat, lon);

        try {
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`);
            console.log('Weather API response status:', wRes.status);
            if (!wRes.ok) throw new Error('Weather fetch failed');
            const wJson = await wRes.json();
            console.log('Weather data:', wJson);
            const cw = wJson.current_weather;
            if (!cw) throw new Error('No current weather');
            const t = Math.round(cw.temperature);
            const code = cw.weathercode;
            const info = codeToEmoji(code);
            tempEl.textContent = `${t}°C`;
            condEl.textContent = info.text;
            emojiEl.textContent = info.emoji;
            console.log('Weather updated:', info.text, t);

            try {
                const gRes = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`);
                if (gRes.ok) {
                    const gJson = await gRes.json();
                    if (gJson && gJson.results && gJson.results.length) {
                        const r = gJson.results[0];
                        const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
                        locEl.textContent = name;
                        console.log('Location updated:', name);
                    }
                }
            } catch (e) {
                console.warn('Reverse geocoding error:', e);
            }
        } catch (err) {
            console.error('Weather error:', err);
            showMessage('Unable to load weather');
        }
    }, (err) => {
        console.warn('Geolocation error:', err.code, err.message);
        if (err.code === err.PERMISSION_DENIED) {
            console.warn('Permission denied - did you reject the location prompt?');
            showMessage('Location denied');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
            console.warn('Position unavailable');
            showMessage('Location unavailable');
        } else if (err.code === err.TIMEOUT) {
            console.warn('Geolocation request timed out');
            showMessage('Location timeout');
        } else {
            showMessage('Location unavailable');
        }
    }, {enableHighAccuracy: false, timeout: 30000, maximumAge: 600000});
})();
