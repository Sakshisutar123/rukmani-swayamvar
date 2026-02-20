import { sequelize } from '../src/config/database.js';

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
    }
  }
  return dp[a.length][b.length];
}

(async () => {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name='users';");
    const cols = rows.map(r => r.column_name);
    const normalized = {};
    for (const c of cols) {
      const n = normalize(c);
      if (!normalized[n]) normalized[n] = [];
      normalized[n].push(c);
    }

    const exactGroups = Object.values(normalized).filter(g => g.length > 1);

    const similarPairs = [];
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        const a = cols[i], b = cols[j];
        const na = normalize(a), nb = normalize(b);
        if (na === nb) continue; // already captured
        // if one contains the other
        if (na.includes(nb) || nb.includes(na)) {
          similarPairs.push({ a, b, reason: 'substring' });
          continue;
        }
        const dist = levenshtein(na, nb);
        const maxLen = Math.max(na.length, nb.length);
        const rel = maxLen === 0 ? 0 : dist / maxLen;
        if (rel <= 0.25 || dist <= 2) {
          similarPairs.push({ a, b, reason: 'levenshtein', dist, rel });
        }
      }
    }

    const result = { columns: cols, exactGroups, similarPairs };
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
