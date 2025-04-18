import type { AfterPackContext } from 'electron-builder';

export default async function notarizing(context: AfterPackContext) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') return;

  if (
    !process.env.APPLE_ID ||
    !process.env.APPLE_APP_SPECIFIC_PASSWORD ||
    !process.env.APPLE_TEAM_ID
  ) {
    console.warn('[notarize] Skipping: missing Apple credentials');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`[notarize] Starting notarization for: ${appPath}`);
  console.log(`[notarize] Using Apple ID: ${process.env.APPLE_ID}`);
  console.log(`[notarize] Using Team ID: ${process.env.APPLE_TEAM_ID}`);

  try {
    const { notarize } = await import('@electron/notarize');

    return notarize({
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
  } catch (error) {
    console.error('[notarize] Failed to notarize application:', error);
    throw error;
  }
}
