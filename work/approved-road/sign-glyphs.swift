import Foundation
import CoreText
import CoreGraphics
// Export only the six requested outlines, not the font software.
var result: [String: Any] = [:]
for ch in Array("50주차금지") {
 let fontName = ch.isNumber ? "Arial-BoldMT" : "AppleSDGothicNeo-Bold"
 let font = CTFontCreateWithName(fontName as CFString, 1000, nil)
 var chars = Array(String(ch).utf16)
 var glyphs = [CGGlyph](repeating: 0, count: chars.count)
 guard CTFontGetGlyphsForCharacters(font, &chars, &glyphs, chars.count), let path = CTFontCreatePathForGlyph(font, glyphs[0], nil) else { fatalError("Missing glyph \(ch)") }
 var commands: [[Any]] = []
 path.applyWithBlock { p in
  let e = p.pointee
  switch e.type {
  case .moveToPoint: commands.append(["M",e.points[0].x,e.points[0].y])
  case .addLineToPoint: commands.append(["L",e.points[0].x,e.points[0].y])
  case .addQuadCurveToPoint: commands.append(["Q",e.points[0].x,e.points[0].y,e.points[1].x,e.points[1].y])
  case .addCurveToPoint: commands.append(["C",e.points[0].x,e.points[0].y,e.points[1].x,e.points[1].y,e.points[2].x,e.points[2].y])
  case .closeSubpath: commands.append(["Z"])
  @unknown default: fatalError("Unsupported curve")
  }
 }
 let b=path.boundingBoxOfPath
 result[String(ch)]=["font":fontName,"bounds":[b.minX,b.minY,b.width,b.height],"commands":commands]
}
let data=try JSONSerialization.data(withJSONObject: result,options:[.sortedKeys])
print("// Six fixed sign glyph outlines exported with CoreText. No font runtime dependency.\nexport const signGlyphs = " + String(data:data,encoding:.utf8)! + ";")
