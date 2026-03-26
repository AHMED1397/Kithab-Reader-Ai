interface PonsTranslation {
  source: string;
  target: string;
}

interface PonsArab {
  header: string;
  translations: PonsTranslation[];
}

interface PonsRom {
  headword: string;
  headword_full: string;
  wordclass: string;
  arabs: PonsArab[];
}

interface PonsHit {
  type: string;
  roms: PonsRom[];
}

interface PonsResult {
  lang: string;
  hits: PonsHit[];
}

export async function translateWithPons(word: string): Promise<string> {
  const url = `https://api.pons.com/v1/dictionary?l=aren&q=${encodeURIComponent(word)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-Secret': '7911d8253c1d88d7fab02f6f882ac02c3920dba1719a923372b1b9b1c9193554'
      }
    });

    if (!res.ok) {
      if (res.status === 204) return '';
      throw new Error(`PONS API error: ${res.statusText}`);
    }
    
    const data = await res.json() as PonsResult[];
    
    if (data && data.length > 0) {
      const firstResult = data[0];
      if (firstResult.hits && firstResult.hits.length > 0) {
        for (const hit of firstResult.hits) {
          if (hit.roms && hit.roms.length > 0) {
            for (const rom of hit.roms) {
              if (rom.arabs && rom.arabs.length > 0) {
                for (const arab of rom.arabs) {
                  if (arab.translations && arab.translations.length > 0) {
                    return arab.translations[0].target;
                  }
                }
              }
            }
          }
        }
      }
    }
    return '';
  } catch (error) {
    console.error('PONS API fetch error:', error);
    return '';
  }
}
