#import <Cocoa/Cocoa.h>
#import <CoreGraphics/CoreGraphics.h>

void drawIsoBox(CGContextRef ctx, CGFloat cx, CGFloat cy, CGFloat w, CGFloat l, CGFloat h, NSColor *roof, NSColor *left, NSColor *right) {
    // Left Face
    CGContextBeginPath(ctx);
    CGContextMoveToPoint(ctx, cx - w, cy);
    CGContextAddLineToPoint(ctx, cx, cy - l);
    CGContextAddLineToPoint(ctx, cx, cy - l + h);
    CGContextAddLineToPoint(ctx, cx - w, cy + h);
    CGContextClosePath(ctx);
    CGContextSetFillColorWithColor(ctx, left.CGColor);
    CGContextFillPath(ctx);

    // Right Face
    CGContextBeginPath(ctx);
    CGContextMoveToPoint(ctx, cx, cy - l);
    CGContextAddLineToPoint(ctx, cx + w, cy);
    CGContextAddLineToPoint(ctx, cx + w, cy + h);
    CGContextAddLineToPoint(ctx, cx, cy - l + h);
    CGContextClosePath(ctx);
    CGContextSetFillColorWithColor(ctx, right.CGColor);
    CGContextFillPath(ctx);

    // Top Face (Roof)
    CGContextBeginPath(ctx);
    CGContextMoveToPoint(ctx, cx, cy + l + h);
    CGContextAddLineToPoint(ctx, cx + w, cy + h);
    CGContextAddLineToPoint(ctx, cx, cy - l + h);
    CGContextAddLineToPoint(ctx, cx - w, cy + h);
    CGContextClosePath(ctx);
    CGContextSetFillColorWithColor(ctx, roof.CGColor);
    CGContextFillPath(ctx);
}

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        int size = 1024;
        NSImage *image = [[NSImage alloc] initWithSize:NSMakeSize(size, size)];
        [image lockFocus];

        CGContextRef ctx = [[NSGraphicsContext currentContext] CGContext];

        // Apple squircle clipping path
        CGFloat margin = 70.0;
        CGRect rect = CGRectMake(margin, margin, size - margin * 2, size - margin * 2);
        CGFloat radius = 185.0;
        CGPathRef path = CGPathCreateWithRoundedRect(rect, radius, radius, NULL);

        CGContextSaveGState(ctx);
        CGContextAddPath(ctx, path);
        CGContextClip(ctx);

        // Rich Dark Gradient
        CGColorSpaceRef cs = CGColorSpaceCreateDeviceRGB();
        CGFloat colors[] = {
            0.05, 0.08, 0.15, 1.0, // Dark navy
            0.04, 0.16, 0.28, 1.0, // Deep ocean
            0.06, 0.28, 0.44, 1.0  // Cyan glow top
        };
        CGFloat locs[] = { 0.0, 0.5, 1.0 };
        CGGradientRef grad = CGGradientCreateWithColorComponents(cs, colors, locs, 3);
        CGContextDrawLinearGradient(ctx, grad, CGPointMake(512, 0), CGPointMake(512, 1024), 0);
        CGGradientRelease(grad);
        CGColorSpaceRelease(cs);

        // Subtle isometric grid lines
        CGContextSetStrokeColorWithColor(ctx, [NSColor colorWithCalibratedRed:0.2 green:0.8 blue:1.0 alpha:0.18].CGColor);
        CGContextSetLineWidth(ctx, 3.5);
        for (int i = -6; i <= 6; i++) {
            CGFloat x = 512 + i * 55;
            CGFloat y = 280 + i * 27;
            CGContextMoveToPoint(ctx, x - 280, y + 140);
            CGContextAddLineToPoint(ctx, x + 280, y - 140);
            CGContextStrokePath(ctx);

            CGContextMoveToPoint(ctx, x - 280, y - 140);
            CGContextAddLineToPoint(ctx, x + 280, y + 140);
            CGContextStrokePath(ctx);
        }

        // Left Building (Residential & Commercial Tower)
        drawIsoBox(ctx, 350, 360, 95, 48, 220,
                   [NSColor colorWithCalibratedRed:0.25 green:0.55 blue:0.85 alpha:1.0],
                   [NSColor colorWithCalibratedRed:0.12 green:0.25 blue:0.45 alpha:1.0],
                   [NSColor colorWithCalibratedRed:0.18 green:0.35 blue:0.60 alpha:1.0]);

        // Left windows
        CGContextSetFillColorWithColor(ctx, [NSColor colorWithCalibratedRed:0.98 green:0.85 blue:0.4 alpha:0.85].CGColor);
        for (int f = 0; f < 5; f++) {
            CGFloat fy = 380 + f * 38;
            CGContextFillRect(ctx, CGRectMake(295, fy, 16, 18));
            CGContextFillRect(ctx, CGRectMake(325, fy - 12, 16, 18));
        }

        // Right Building (Neo-Tokyo High-Rise)
        drawIsoBox(ctx, 670, 360, 95, 48, 260,
                   [NSColor colorWithCalibratedRed:0.05 green:0.75 blue:0.65 alpha:1.0],
                   [NSColor colorWithCalibratedRed:0.08 green:0.32 blue:0.28 alpha:1.0],
                   [NSColor colorWithCalibratedRed:0.12 green:0.45 blue:0.38 alpha:1.0]);

        // Right windows
        CGContextSetFillColorWithColor(ctx, [NSColor colorWithCalibratedRed:0.3 green:0.9 blue:1.0 alpha:0.9].CGColor);
        for (int f = 0; f < 6; f++) {
            CGFloat fy = 380 + f * 38;
            CGContextFillRect(ctx, CGRectMake(690, fy, 16, 18));
            CGContextFillRect(ctx, CGRectMake(720, fy + 12, 16, 18));
        }

        // Center Building (Apex Skyscraper)
        drawIsoBox(ctx, 512, 300, 115, 58, 380,
                   [NSColor colorWithCalibratedRed:0.06 green:0.72 blue:0.92 alpha:1.0],
                   [NSColor colorWithCalibratedRed:0.06 green:0.18 blue:0.32 alpha:1.0],
                   [NSColor colorWithCalibratedRed:0.09 green:0.26 blue:0.44 alpha:1.0]);

        // Center glowing windows
        CGContextSetFillColorWithColor(ctx, [NSColor colorWithCalibratedRed:1.0 green:0.92 blue:0.55 alpha:0.95].CGColor);
        for (int f = 0; f < 8; f++) {
            CGFloat fy = 320 + f * 42;
            CGContextFillRect(ctx, CGRectMake(435, fy, 16, 20));
            CGContextFillRect(ctx, CGRectMake(470, fy - 12, 16, 20));
            CGContextFillRect(ctx, CGRectMake(540, fy - 12, 16, 20));
            CGContextFillRect(ctx, CGRectMake(575, fy, 16, 20));
        }

        // Spire Antenna
        CGContextSetStrokeColorWithColor(ctx, [NSColor colorWithCalibratedRed:0.92 green:0.96 blue:1.0 alpha:1.0].CGColor);
        CGContextSetLineWidth(ctx, 7);
        CGContextMoveToPoint(ctx, 512, 680);
        CGContextAddLineToPoint(ctx, 512, 790);
        CGContextStrokePath(ctx);

        // Antenna Warning Beacon
        CGContextSetFillColorWithColor(ctx, [NSColor colorWithCalibratedRed:0.95 green:0.25 blue:0.25 alpha:1.0].CGColor);
        CGContextFillEllipseInRect(ctx, CGRectMake(503, 782, 18, 18));

        // Beacon outer halo glow
        CGContextSetFillColorWithColor(ctx, [NSColor colorWithCalibratedRed:0.95 green:0.25 blue:0.25 alpha:0.35].CGColor);
        CGContextFillEllipseInRect(ctx, CGRectMake(497, 776, 30, 30));

        CGContextRestoreGState(ctx);

        // Highlight border
        CGContextAddPath(ctx, path);
        CGContextSetStrokeColorWithColor(ctx, [NSColor colorWithCalibratedWhite:1.0 alpha:0.22].CGColor);
        CGContextSetLineWidth(ctx, 6.0);
        CGContextStrokePath(ctx);

        CGPathRelease(path);

        [image unlockFocus];

        // Export to PNG
        NSData *tiff = [image TIFFRepresentation];
        NSBitmapImageRep *rep = [NSBitmapImageRep imageRepWithData:tiff];
        NSData *png = [rep representationUsingType:NSBitmapImageFileTypePNG properties:@{}];
        NSString *dest = argc > 1 ? [NSString stringWithUTF8String:argv[1]] : @"icon_1024.png";
        [png writeToFile:dest atomically:YES];
        printf("Created %s\n", [dest UTF8String]);
    }
    return 0;
}
