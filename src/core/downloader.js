import { createWriteStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { paths } from './config.js';
import { spinner, formatBytes } from '../utils/ui.js';

const MIRRORS = [
  'https://www.php.net/distributions',
  'https://museum.php.net/php8',
  'https://museum.php.net/php7',
  'https://museum.php.net/php5',
];

/**
 * Download PHP source tarball (macOS/Linux). Returns path to the .tar.gz file.
 * Uses cache if already downloaded.
 */
export async function downloadSource(version) {
  const filename = `php-${version}.tar.gz`;
  const cachePath = join(paths.cache, filename);

  if (existsSync(cachePath)) {
    return cachePath;
  }

  const sp = spinner(`Downloading ${filename}...`);
  sp.start();

  let downloaded = false;

  for (const mirror of MIRRORS) {
    const url = `${mirror}/${filename}`;
    try {
      await downloadFile(url, cachePath, (received, total) => {
        if (total) {
          const pct = Math.round((received / total) * 100);
          sp.text = `  Downloading ${filename}... ${pct}% (${formatBytes(received)}/${formatBytes(total)})`;
        } else {
          sp.text = `  Downloading ${filename}... ${formatBytes(received)}`;
        }
      });
      downloaded = true;
      break;
    } catch {
      continue;
    }
  }

  if (!downloaded) {
    sp.fail(`Failed to download PHP ${version} from any mirror`);
    throw new Error(`Could not download PHP ${version}. Check your internet connection.`);
  }

  sp.succeed(`Downloaded ${filename}`);
  return cachePath;
}

/**
 * Generic file download with progress callback.
 * Exported for use by the Windows installer.
 */
export async function downloadFile(url, dest, onProgress) {
  const res = await fetch(url, { redirect: 'follow' });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  const total = parseInt(res.headers.get('content-length') || '0', 10) || null;
  let received = 0;

  const transform = new TransformStream({
    transform(chunk, controller) {
      received += chunk.length;
      if (onProgress) onProgress(received, total);
      controller.enqueue(chunk);
    },
  });

  const readable = Readable.fromWeb(res.body.pipeThrough(transform));
  const writable = createWriteStream(dest);

  await pipeline(readable, writable);
}
