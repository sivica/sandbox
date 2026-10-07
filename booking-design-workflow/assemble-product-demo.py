from pathlib import Path
import subprocess
w=Path('video/final')
for name,duration in [('hook',4),('brief',6),('theme0',4),('theme1',4),('theme2',4),('export',8),('ending',12.08)]:
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-i',str(w/(name+'.png')),'-t',str(duration),'-r','25','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',str(w/(name+'.mp4'))],check=True)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i','video/staging-booking.webm','-vf','scale=440:-2,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xe6ebe4','-r','25','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',str(w/'staging.mp4')],check=True)
(w/'concat.txt').write_text(''.join("file '"+name+".mp4'\n" for name in ['hook','brief','theme0','theme1','theme2','export','staging','ending']))
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(w/'concat.txt'),'-c','copy','-movflags','+faststart','video/kindred-product-demo.mp4'],check=True)
