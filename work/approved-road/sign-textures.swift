import Foundation
import CoreText
import CoreGraphics
import ImageIO
// Rasterize the existing six glyphs; no font software is distributed.
let out = CommandLine.arguments[1]
func texture(_ name:String,_ width:Int,_ height:Int,_ mw:Double,_ mh:Double,_ draw:(CGContext)->Void){
 let space=CGColorSpace(name:CGColorSpace.sRGB)!
 let c=CGContext(data:nil,width:width,height:height,bitsPerComponent:8,bytesPerRow:width*4,space:space,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 c.setFillColor(CGColor(red:227/255,green:229/255,blue:219/255,alpha:1));c.fill(CGRect(x:0,y:0,width:width,height:height))
 c.scaleBy(x:Double(width)/mw,y:Double(height)/mh);c.translateBy(x:mw/2,y:mh/2);draw(c)
 let dest=CGImageDestinationCreateWithURL(URL(fileURLWithPath:out+"/"+name) as CFURL,"public.png" as CFString,1,nil)!
 CGImageDestinationAddImage(dest,c.makeImage()!,nil);precondition(CGImageDestinationFinalize(dest))
}
func glyph(_ c:CGContext,_ ch:Character,_ x:Double,_ y:Double,_ w:Double,_ h:Double,_ red:Bool){
 let font=CTFontCreateWithName((ch.isNumber ? "Arial-BoldMT":"AppleSDGothicNeo-Bold") as CFString,1000,nil)
 var chars=Array(String(ch).utf16),gs=[CGGlyph](repeating:0,count:chars.count)
 precondition(CTFontGetGlyphsForCharacters(font,&chars,&gs,chars.count));let p=CTFontCreatePathForGlyph(font,gs[0],nil)!,b=p.boundingBoxOfPath
 c.saveGState();c.translateBy(x:x-w/2,y:y-h/2);c.scaleBy(x:w/b.width,y:h/b.height);c.translateBy(x:-b.minX,y:-b.minY)
 c.setFillColor(red ? CGColor(red:181/255,green:40/255,blue:32/255,alpha:1):CGColor(red:48/255,green:54/255,blue:54/255,alpha:1));c.addPath(p);c.fillPath();c.restoreGState()
}
texture("speed-lettering-v1.png",512,512,0.32,0.29){c in glyph(c,"5",-0.079,0,0.133,0.265,false);glyph(c,"0",0.080,0,0.140,0.265,false)}
texture("parking-lettering-v1.png",256,512,0.23,0.274){c in for (j,ch) in Array("주차금지").enumerated(){glyph(c,ch,0,0.825-Double(j)*0.068-0.723,0.070,0.058,true)}}
