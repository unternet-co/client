import type { AfterPackContext } from 'electron-builder';

export default async function notarizing(context: AfterPackContext) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    console.log('[notarize] Skipping: not macOS');
    return;
  }

  const missing = [
    !process.env.APPLE_ID && 'APPLE_ID',
    !process.env.APPLE_ID_PASS && 'APPLE_ID_PASS',
    !process.env.APPLE_TEAM_ID && 'APPLE_TEAM_ID',
  ].filter(Boolean);

  if (missing.length > 0) {
    console.warn(
      `[notarize] Skipping: missing env vars → ${missing.join(', ')}`
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`[notarize] Starting notarization for: ${appPath}`);
  console.log(`[notarize] Using Apple ID: ${process.env.APPLE_ID}`);
  console.log(`[notarize] Using Team ID: ${process.env.APPLE_TEAM_ID}`);

  try {
    const { notarize } = await import('@electron/notarize');

    await notarize({
      appPath,
      appleId: process.env.APPLE_ID!,
      appleIdPassword: process.env.APPLE_ID_PASS!,
      teamId: process.env.APPLE_TEAM_ID!,
    });

    console.log('[notarize] ✅ Notarization complete');
  } catch (err) {
    console.error('[notarize] ❌ Notarization failed:');
    console.error(err);
    throw err; // ensure CI fails explicitly
  }
}
