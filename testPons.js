const word = "استأصل";
const url = `https://api.pons.com/v1/dictionary?l=aren&q=${encodeURIComponent(word)}`;

async function testPons() {
  try {
    const res = await fetch(url, {
      headers: {
        'X-Secret': '7911d8253c1d88d7fab02f6f882ac02c3920dba1719a923372b1b9b1c9193554'
      }
    });

    console.log("Status:", res.status, res.statusText);

    if (res.status === 204) {
      console.log("204 No Content returned");
      return;
    }

    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data && data.length > 0) {
      const firstResult = data[0];
      if (firstResult.hits && firstResult.hits.length > 0) {
        for (const hit of firstResult.hits) {
          if (hit.roms && hit.roms.length > 0) {
            for (const rom of hit.roms) {
              if (rom.arabits && rom.arabits.length > 0) {
                for (const arabit of rom.arabits) {
                  if (arabit.translations && arabit.translations.length > 0) {
                    console.log("Found:", arabit.translations[0].target);
                    return;
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testPons();
