export interface WiktionaryResult {
  root: string;
  meanings: string[];
}

export async function fetchWiktionaryDefinition(word: string): Promise<WiktionaryResult | null> {
  const url = `https://ar.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=text&format=json&origin=*&redirects=1`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.error || !data.parse || !data.parse.text) {
      return null;
    }

    const htmlContent = data.parse.text["*"];
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 1. Get the definitions (inside the <ol> tags)
    const listItems = doc.querySelectorAll('ol li');
    const cleanDefinitions = Array.from(listItems).map((li, index) => {
      // Remove links and extra HTML to get just the text
      return `${index + 1}. ${li.textContent?.trim() || ''}`;
    }).filter(text => text.length > 3);

    if (cleanDefinitions.length === 0) {
      return null;
    }

    // 2. Get the Root (الجذر)
    const rootLink = doc.querySelector('a[title^="تصنيف:"]');
    const root = rootLink ? (rootLink.textContent || "غير متوفر") : "غير متوفر";

    return {
      root: root.replace('تصنيف:', '').trim(),
      meanings: cleanDefinitions
    };
  } catch (error) {
    console.error('Wiktionary fetch error:', error);
    return null;
  }
}
