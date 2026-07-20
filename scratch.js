const req = fetch('http://localhost:3000/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        prompt: 'Return a JSON array of 3 objects with properties: title, desc, type. Output ONLY JSON array.',
        raw: false,
    }),
})
    .then((r) => r.text())
    .then(console.log)
    .catch(console.error);
