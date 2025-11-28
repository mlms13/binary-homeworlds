import { resolve } from 'path';

//==============================================================================
// Why this config?
//
// lint-staged attempts to run tools on only changed files by passing those
// filenames as arguments to the tools. tsc doesn't support the conbination of
// filename arguments and the --project flag. So instead we use the tsc-files
// package in combination with this more complex lint-staged config to run tsc
// on only the changed files, respecting each package's tsconfig.json file.
//
// see: https://github.com/microsoft/TypeScript/issues/27379
//
//==============================================================================

function createTscFilesCommand(packagePath, filenames) {
  // Convert absolute paths to relative paths from the package directory
  const packageAbsPath = resolve(packagePath);
  const relativeFiles = filenames
    .map((f) => {
      const absPath = resolve(f);
      // Get relative path from package directory
      return absPath.replace(packageAbsPath + '/', '');
    })
    .join(' ');
  return `cd ${packagePath} && tsc-files --noEmit ${relativeFiles}`;
}

export default {
  'packages/shared/src/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    (filenames) => createTscFilesCommand('packages/shared', filenames),
  ],
  'packages/server/src/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    (filenames) => createTscFilesCommand('packages/server', filenames),
  ],
  'packages/engine/{src,__tests__}/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    (filenames) => createTscFilesCommand('packages/engine', filenames),
  ],
  'packages/ui-client/src/**/*.{ts,tsx}': [
    'prettier --write',
    (filenames) => createTscFilesCommand('packages/ui-client', filenames),
  ],
};
