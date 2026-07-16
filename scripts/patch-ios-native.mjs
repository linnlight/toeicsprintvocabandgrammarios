import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const iosRoot = path.join(root, 'ios');
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const iosBuildNumber = String(appConfig.ios.buildNumber);
const marketingVersion = String(appConfig.version);

const ensureFile = (filePath, contents) => {
  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== contents) {
    fs.writeFileSync(filePath, contents);
    console.log(`patched ${path.relative(root, filePath)}`);
  }
};

const replaceInFile = (filePath, replacements) => {
  if (!fs.existsSync(filePath)) {
    console.warn(`skipped missing ${path.relative(root, filePath)}`);
    return;
  }

  const before = fs.readFileSync(filePath, 'utf8');
  let after = before;

  for (const [from, to] of replacements) {
    after = typeof from === 'string' ? after.replaceAll(from, to) : after.replace(from, to);
  }

  if (after !== before) {
    fs.writeFileSync(filePath, after);
    console.log(`patched ${path.relative(root, filePath)}`);
  }
};

if (!fs.existsSync(iosRoot)) {
  throw new Error('ios directory does not exist. Run `npx expo prebuild --platform ios --no-install` first.');
}

ensureFile(
  path.join(iosRoot, '.xcode.env.local'),
  [
    'export NODE_BINARY=/opt/homebrew/opt/node@22/bin/node',
    // CocoaPods can retain an absolute Hermes compiler path after the project
    // directory is renamed. Resolve it from the current Xcode project instead.
    'export HERMES_CLI_PATH="$PROJECT_DIR/../node_modules/hermes-compiler/hermesc/osx-bin/hermesc"',
    '',
  ].join('\n'),
);

replaceInFile(path.join(iosRoot, 'TOEIC', 'Info.plist'), [
  [
    /(<key>CFBundleVersion<\/key>\s*<string>)[^<]+(<\/string>)/,
    `$1${iosBuildNumber}$2`,
  ],
  [
    /[ \t]*<key>UIBackgroundModes<\/key>\n[ \t]*<array>\n[ \t]*<string>audio<\/string>\n[ \t]*<\/array>\n/g,
    '',
  ],
]);

replaceInFile(path.join(iosRoot, 'TOEIC', 'AppDelegate.swift'), [
  [
    '// needed to return the correct URL for expo-dev-client.',
    '// Prefer an existing bridge bundle URL when React Native has already resolved one.',
  ],
]);

replaceInFile(path.join(iosRoot, 'TOEIC.xcodeproj', 'project.pbxproj'), [
  [
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${iosBuildNumber};`,
  ],
  [
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${marketingVersion};`,
  ],
  [
    "`\\\"$NODE_BINARY\\\" --print \\\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\\"`",
    "REACT_NATIVE_XCODE_SCRIPT=\\\"$(\\\"$NODE_BINARY\\\" --print \\\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\\")\\\"\\n\\\"$REACT_NATIVE_XCODE_SCRIPT\\\"",
  ],
]);

const constantsPodspec = path.join(root, 'node_modules', 'expo-constants', 'ios', 'EXConstants.podspec');
const constantsConfigScript = path.join(root, 'node_modules', 'expo-constants', 'scripts', 'get-app-config-ios.sh');

replaceInFile(constantsConfigScript, [
  [
    'PROJECT_DIR_BASENAME=$(basename $PROJECT_DIR)',
    'PROJECT_DIR_BASENAME=$(basename "$PROJECT_DIR")',
  ],
]);

replaceInFile(constantsPodspec, [
  [
    /require 'json'\n(?!require 'shellwords'\n)/,
    "require 'json'\nrequire 'shellwords'\n",
  ],
  [
    "package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))\nrequire 'shellwords'\n",
    "package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))\n",
  ],
  [
    'env_vars = ENV[\'PROJECT_ROOT\'] ? "PROJECT_ROOT=#{ENV[\'PROJECT_ROOT\']} " : ""',
    'env_vars = ENV[\'PROJECT_ROOT\'] ? "PROJECT_ROOT=#{Shellwords.escape(ENV[\'PROJECT_ROOT\'])} " : ""',
  ],
  [
    ':script => "bash -l -c \\"#{env_vars}$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"",',
    ':script => "#{env_vars}bash -l \\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"",',
  ],
]);

console.log('iOS native patch complete');
