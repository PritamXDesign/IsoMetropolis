#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
DIST_DIR="$PROJECT_DIR/dist"
APP_NAME="IsoMetropolis"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"

echo "🏙️  Building $APP_NAME for macOS..."

rm -rf "$BUILD_DIR" "$DIST_DIR"
mkdir -p "$BUILD_DIR" "$DIST_DIR"

# 1. Generate High-Res Icon
echo "🎨  Generating high-resolution app icon..."
clang -O2 -framework Cocoa "$SCRIPT_DIR/generate_icon.m" -o "$BUILD_DIR/generate_icon"
"$BUILD_DIR/generate_icon" "$BUILD_DIR/icon_1024.png"

# 2. Build Apple Iconset (.icns)
echo "📦  Building AppIcon.icns..."
ICONSET="$BUILD_DIR/AppIcon.iconset"
mkdir -p "$ICONSET"

sips -z 16 16     "$BUILD_DIR/icon_1024.png" --out "$ICONSET/icon_16x16.png" >/dev/null
sips -z 32 32     "$BUILD_DIR/icon_1024.png" --out "$ICONSET/icon_16x16@2x.png" >/dev/null
sips -z 32 32     "$BUILD_DIR/icon_1024.png" --out "$ICONSET/icon_32x32.png" >/dev/null
sips -z 64 64     "$BUILD_DIR/icon_1024.png" --out "$ICONSET/icon_32x32@2x.png" >/dev/null
sips -z 128 128   "$BUILD_DIR/icon_1024.png" --out "$ICONSET/icon_128x128.png" >/dev/null
sips -z 256 256   "$BUILD_DIR/icon_1024.png" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256   "$BUILD_DIR/icon_1024.png" --out "$ICONSET/icon_256x256.png" >/dev/null
sips -z 512 512   "$BUILD_DIR/icon_1024.png" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
sips -z 512 512   "$BUILD_DIR/icon_1024.png" --out "$ICONSET/icon_512x512.png" >/dev/null
cp "$BUILD_DIR/icon_1024.png" "$ICONSET/icon_512x512@2x.png"

iconutil -c icns "$ICONSET" -o "$BUILD_DIR/AppIcon.icns"

# 3. Create .app Structure
echo "📁  Creating application bundle structure..."
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources/web"

# 4. Compile Native Cocoa + WebKit Binary
echo "⚡  Compiling native macOS executable..."
clang -O3 -framework Cocoa -framework WebKit \
  -mmacosx-version-min=11.0 \
  "$SCRIPT_DIR/main.m" \
  -o "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

# 5. Copy Icons and Web Game Assets
echo "🌐  Copying web game assets into app bundle..."
cp "$BUILD_DIR/AppIcon.icns" "$APP_BUNDLE/Contents/Resources/"
cp "$PROJECT_DIR/index.html" "$APP_BUNDLE/Contents/Resources/web/"
cp -R "$PROJECT_DIR/css" "$APP_BUNDLE/Contents/Resources/web/"
cp -R "$PROJECT_DIR/js" "$APP_BUNDLE/Contents/Resources/web/"

# 6. Write Info.plist
cat << 'EOF' > "$APP_BUNDLE/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleDisplayName</key>
    <string>IsoMetropolis</string>
    <key>CFBundleExecutable</key>
    <string>IsoMetropolis</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.pritamxdesign.isometropolis</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>IsoMetropolis</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>NSRequiresAquaSystemAppearance</key>
    <false/>
</dict>
</plist>
EOF

echo "APPL????" > "$APP_BUNDLE/Contents/PkgInfo"

# 7. Code Sign (Ad-Hoc)
echo "🔏  Code-signing application..."
codesign --force --deep --sign - "$APP_BUNDLE"

# 8. Create Downloadable ZIP Archive
echo "🗜️  Creating ZIP archive..."
(cd "$BUILD_DIR" && zip -q -r -9 "$DIST_DIR/IsoMetropolis-macOS.zip" "$APP_NAME.app")

# 9. Create Downloadable DMG Disk Image
echo "💿  Building production DMG installer..."
DMG_ROOT="$BUILD_DIR/dmg_root"
mkdir -p "$DMG_ROOT"
cp -R "$APP_BUNDLE" "$DMG_ROOT/"
ln -s /Applications "$DMG_ROOT/Applications"

hdiutil create -volname "$APP_NAME" \
  -srcfolder "$DMG_ROOT" \
  -ov -format UDZO \
  "$DIST_DIR/IsoMetropolis-macOS-Installer.dmg" >/dev/null

echo "✅  Build Complete!"
echo "📍  App: $APP_BUNDLE"
echo "📦  DMG: $DIST_DIR/IsoMetropolis-macOS-Installer.dmg"
echo "📦  ZIP: $DIST_DIR/IsoMetropolis-macOS.zip"
