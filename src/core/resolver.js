import { spinner } from '../utils/ui.js';

const PHP_RELEASES_API = 'https://www.php.net/releases/index.php';

/**
 * Resolve a user-provided version string to a full X.Y.Z version.
 *
 * "8.3"    -> "8.3.30" (latest 8.3.x)
 * "8.3.14" -> "8.3.14" (exact, verified to exist)
 * "8"      -> "8.5.4"  (latest 8.x.x)
 */
export async function resolveVersion(input) {
  const cleaned = input.replace(/^v/, '').trim();
  const parts = cleaned.split('.');

  if (parts.length === 3 && parts.every(p => /^\d+$/.test(p))) {
    return cleaned;
  }

  const sp = spinner('Resolving version...');
  sp.start();

  try {
    if (parts.length === 2 && parts.every(p => /^\d+$/.test(p))) {
      const version = await fetchLatestForMinor(cleaned);
      sp.succeed(`Resolved to PHP ${version}`);
      return version;
    }

    if (parts.length === 1 && /^\d+$/.test(parts[0])) {
      const version = await fetchLatestForMajor(cleaned);
      sp.succeed(`Resolved to PHP ${version}`);
      return version;
    }

    throw new Error(`Invalid version format: ${input}`);
  } catch (err) {
    sp.fail('Failed to resolve version');
    throw err;
  }
}

/**
 * Fetch all available versions for a given major version (e.g. "8").
 * Returns sorted array of full version strings, newest first.
 */
export async function fetchVersionsForMajor(major) {
  const url = `${PHP_RELEASES_API}?json&max=-1&version=${major}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch PHP releases: HTTP ${res.status}`);
  }

  const data = await res.json();

  if (typeof data !== 'object' || data === null) {
    throw new Error(`Unexpected API response`);
  }

  return Object.keys(data)
    .filter(v => /^\d+\.\d+\.\d+$/.test(v))
    .sort(compareVersionsDesc);
}

/**
 * Fetch the latest patch version for a major.minor string (e.g. "8.3" -> "8.3.30").
 */
async function fetchLatestForMinor(majorMinor) {
  const url = `${PHP_RELEASES_API}?json&version=${majorMinor}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch PHP releases for ${majorMinor}: HTTP ${res.status}`);
  }

  const data = await res.json();

  if (data.version) {
    return data.version;
  }

  throw new Error(`No PHP releases found for ${majorMinor}`);
}

/**
 * Fetch the latest version for a major version (e.g. "8" -> "8.5.4").
 */
async function fetchLatestForMajor(major) {
  const versions = await fetchVersionsForMajor(major);

  if (versions.length === 0) {
    throw new Error(`No PHP releases found for major version ${major}`);
  }

  return versions[0];
}

/**
 * Fetch all available versions across all supported major versions.
 * Returns a Map of "major.minor" -> [versions sorted desc].
 */
export async function fetchAllVersions() {
  const majors = ['5', '7', '8'];
  const all = new Map();

  const results = await Promise.allSettled(
    majors.map(m => fetchVersionsForMajor(m))
  );

  for (let i = 0; i < majors.length; i++) {
    if (results[i].status === 'fulfilled') {
      for (const v of results[i].value) {
        const key = majorMinor(v);
        if (!all.has(key)) all.set(key, []);
        all.get(key).push(v);
      }
    }
  }

  return all;
}

function majorMinor(v) {
  const parts = v.split('.');
  return `${parts[0]}.${parts[1]}`;
}

function compareVersionsDesc(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pb[i] - pa[i];
  }
  return 0;
}
