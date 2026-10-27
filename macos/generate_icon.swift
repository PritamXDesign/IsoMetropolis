import Cocoa
import CoreGraphics

func createIcon() -> NSImage {
    let size = NSSize(width: 1024, height: 1024)
    let image = NSImage(size: size)
    image.lockFocus()
    guard let ctx = NSGraphicsContext.current?.cgContext else {
        image.unlockFocus()
        return image
    }

    // Squircle path (macOS icon standard rounded rect)
    let margin: CGFloat = 80
    let iconRect = CGRect(x: margin, y: margin, width: 1024 - margin * 2, height: 1024 - margin * 2)
    let cornerRadius: CGFloat = 190
    let path = CGPath(roundedRect: iconRect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)

    ctx.saveGState()
    ctx.addPath(path)
    ctx.clip()

    // Background Gradient (Deep space midnight blue)
    let colors = [
        NSColor(red: 0.05, green: 0.08, blue: 0.16, alpha: 1.0).cgColor,
        NSColor(red: 0.02, green: 0.15, blue: 0.28, alpha: 1.0).cgColor,
        NSColor(red: 0.06, green: 0.25, blue: 0.40, alpha: 1.0).cgColor
    ] as CFArray
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    if let gradient = CGGradient(colorsSpace: colorSpace, colors: colors, locations: [0.0, 0.6, 1.0]) {
        ctx.drawLinearGradient(gradient, start: CGPoint(x: 512, y: 1024), end: CGPoint(x: 512, y: 0), options: [])
    }

    // Subtle isometric grid lines on base
    ctx.setStrokeColor(NSColor(red: 0.2, green: 0.7, blue: 0.9, alpha: 0.25).cgColor)
    ctx.setLineWidth(4)
    for i in -6...6 {
        let x1: CGFloat = 512 + CGFloat(i) * 60
        let y1: CGFloat = 260 + CGFloat(i) * 30
        let x2: CGFloat = x1 - 300
        let y2: CGFloat = y1 + 150
        ctx.move(to: CGPoint(x: x1, y: y1))
        ctx.addLine(to: CGPoint(x: x2, y: y2))
        ctx.strokePath()

        let x3: CGFloat = x1 + 300
        let y3: CGFloat = y1 + 150
        ctx.move(to: CGPoint(x: x1, y: y1))
        ctx.addLine(to: CGPoint(x: x3, y: y3))
        ctx.strokePath()
    }

    // Helper to draw isometric block
    func drawIsoBlock(cx: CGFloat, cy: CGFloat, w: CGFloat, l: CGFloat, h: CGFloat, roof: NSColor, left: NSColor, right: NSColor) {
        // Left Wall
        ctx.beginPath()
        ctx.move(to: CGPoint(x: cx - w, y: cy))
        ctx.addLine(to: CGPoint(x: cx, y: cy - l))
        ctx.addLine(to: CGPoint(x: cx, y: cy - l + h))
        ctx.addLine(to: CGPoint(x: cx - w, y: cy + h))
        ctx.closePath()
        ctx.setFillColor(left.cgColor)
        ctx.fillPath()

        // Right Wall
        ctx.beginPath()
        ctx.move(to: CGPoint(x: cx, y: cy - l))
        ctx.addLine(to: CGPoint(x: cx + w, y: cy))
        ctx.addLine(to: CGPoint(x: cx + w, y: cy + h))
        ctx.addLine(to: CGPoint(x: cx, y: cy - l + h))
        ctx.closePath()
        ctx.setFillColor(right.cgColor)
        ctx.fillPath()

        // Top Roof
        ctx.beginPath()
        ctx.move(to: CGPoint(x: cx, y: cy + l + h))
        ctx.addLine(to: CGPoint(x: cx + w, y: cy + h))
        ctx.addLine(to: CGPoint(x: cx, y: cy - l + h))
        ctx.addLine(to: CGPoint(x: cx - w, y: cy + h))
        ctx.closePath()
        ctx.setFillColor(roof.cgColor)
        ctx.fillPath()
    }

    // Left Building (Commercial Tower)
    drawIsoBlock(
        cx: 360, cy: 380, w: 90, l: 45, h: 220,
        roof: NSColor(red: 0.1, green: 0.6, blue: 0.8, alpha: 1.0),
        left: NSColor(red: 0.08, green: 0.25, blue: 0.45, alpha: 1.0),
        right: NSColor(red: 0.12, green: 0.35, blue: 0.60, alpha: 1.0)
    )

    // Right Building (High-Tech Spire)
    drawIsoBlock(
        cx: 660, cy: 380, w: 90, l: 45, h: 260,
        roof: NSColor(red: 0.2, green: 0.8, blue: 0.6, alpha: 1.0),
        left: NSColor(red: 0.08, green: 0.35, blue: 0.30, alpha: 1.0),
        right: NSColor(red: 0.12, green: 0.50, blue: 0.40, alpha: 1.0)
    )

    // Center Landmark (Tall Apex Skyscraper)
    drawIsoBlock(
        cx: 512, cy: 320, w: 110, l: 55, h: 380,
        roof: NSColor(red: 0.05, green: 0.75, blue: 0.95, alpha: 1.0),
        left: NSColor(red: 0.05, green: 0.18, blue: 0.32, alpha: 1.0),
        right: NSColor(red: 0.08, green: 0.28, blue: 0.48, alpha: 1.0)
    )

    // Spire Antenna
    ctx.setStrokeColor(NSColor(red: 0.9, green: 0.95, blue: 1.0, alpha: 1.0).cgColor)
    ctx.setLineWidth(6)
    ctx.move(to: CGPoint(x: 512, y: 700))
    ctx.addLine(to: CGPoint(x: 512, y: 780))
    ctx.strokePath()

    // Beacon Glow
    ctx.setFillColor(NSColor(red: 0.95, green: 0.25, blue: 0.25, alpha: 1.0).cgColor)
    ctx.fillEllipse(in: CGRect(x: 504, y: 772, width: 16, height: 16))

    // Glowing Windows
    ctx.setFillColor(NSColor(red: 0.98, green: 0.9, blue: 0.5, alpha: 0.9).cgColor)
    for floor in 0...6 {
        let fy: CGFloat = 400 + CGFloat(floor) * 40
        ctx.fill(CGRect(x: 440, y: fy, width: 14, height: 18))
        ctx.fill(CGRect(x: 470, y: fy - 10, width: 14, height: 18))
        ctx.fill(CGRect(x: 540, y: fy - 10, width: 14, height: 18))
        ctx.fill(CGRect(x: 570, y: fy, width: 14, height: 18))
    }

    ctx.restoreGState()

    // Sleek border highlight around squircle
    ctx.addPath(path)
    ctx.setStrokeColor(NSColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.25).cgColor)
    ctx.setLineWidth(8)
    ctx.strokePath()

    image.unlockFocus()
    return image
}

let icon = createIcon()
if let tiff = icon.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff) {
    if let png = rep.representation(using: .png, properties: [:]) {
        let url = URL(fileURLWithPath: "icon_1024.png")
        try? png.write(to: url)
        print("Generated icon_1024.png")
    }
}
