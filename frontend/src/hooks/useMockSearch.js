import { LAWS } from '../data/mockData';

// Score a law against a query using keyword overlap (mimics vector similarity)
function scoreResult(law, query) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  let score = 0;

  words.forEach((word) => {
    if (law.title.toLowerCase().includes(word)) score += 3;
    if (law.content.toLowerCase().includes(word)) score += 1;
    if (law.keywords.some((kw) => kw.toLowerCase().includes(word))) score += 4;
    if (law.category.toLowerCase().includes(word)) score += 2;
    if (law.law_reference.toLowerCase().includes(word)) score += 2;
  });

  return score;
}

// Simulate the backend search_danish_law() with a realistic async delay
export async function mockSearch(query, category = null, topK = 3) {
  // Simulate semantic search latency (1000-1600ms)
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 600));

  const pool = category ? LAWS.filter((l) => l.category === category) : LAWS;

  const scored = pool
    .map((law) => ({ law, score: scoreResult(law, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ law }) => law);

  // Fallback: if nothing matched by keywords, return top results from pool
  if (scored.length === 0) {
    return pool.slice(0, topK);
  }

  return scored;
}

// Generate a human-readable AI response from search results
export function generateAIResponse(query, laws) {
  if (laws.length === 0) {
    return "I couldn't find specific information about that in my Danish law database. Please try rephrasing your question or consult a licensed legal professional for advice specific to your situation.";
  }

  const primary = laws[0];
  const categoryLabels = {
    immigration: 'Danish immigration law',
    tax: 'Danish tax law',
    labor: 'Danish labor law',
    business: 'Danish business law',
  };
  const catLabel = categoryLabels[primary.category] || 'Danish law';

  const additionalCount = laws.length - 1;
  const additionalText =
    additionalCount > 0
      ? ` I also found ${additionalCount} additional relevant regulation${additionalCount > 1 ? 's' : ''} that may apply.`
      : '';

  return `Based on ${catLabel}, the most relevant regulation for your question is **${primary.law_reference}**.${additionalText} Please review the details in the law card${laws.length > 1 ? 's' : ''} below for the complete information.`;
}
