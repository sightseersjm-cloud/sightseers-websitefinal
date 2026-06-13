#!/usr/bin/env python3
"""
Add ocean wave ambient sound on first interaction with the website.
Uses Web Audio API to synthesize a 3-second ocean wave (no external file).
Triggers on first user click/tap (browsers require user gesture for audio).
"""

with open('Design_Reference.html', 'r', encoding='utf-8') as f:
    c = f.read()

n = 0
def sr(c, old, new, desc=""):
    global n
    if old not in c:
        print(f"  SKIP: {desc}")
        return c
    c = c.replace(old, new, 1)
    n += 1
    print(f"  OK: {desc}")
    return c

ocean_js = """
/* ═══════ OCEAN WAVE AMBIENT SOUND ═══════ */
(function(){
  var played=false;
  function playOceanWave(){
    if(played)return;played=true;
    document.removeEventListener('click',playOceanWave);
    document.removeEventListener('touchstart',playOceanWave);
    try{
      var ctx=new(window.AudioContext||window.webkitAudioContext)();
      var dur=3.2;var sr=ctx.sampleRate;var len=dur*sr;
      var buf=ctx.createBuffer(2,len,sr);
      for(var ch=0;ch<2;ch++){
        var d=buf.getChannelData(ch);
        for(var i=0;i<len;i++){
          var t=i/sr;
          var wave=0;
          for(var h=0;h<6;h++){
            var f=0.03+h*0.017;var a=0.12/(h+1);
            wave+=Math.sin(2*Math.PI*f*t+h*1.3+ch*0.5)*a;
          }
          var noise=(Math.random()*2-1)*0.08;
          var crush=Math.sin(t*2.5+ch*0.3)*0.15*Math.sin(t*0.8);
          var env=Math.sin(Math.PI*t/dur);
          env*=env;
          var fade=t<0.6?t/0.6:t>dur-0.8?(dur-t)/0.8:1;
          d[i]=(wave+noise*0.6+crush)*env*fade*0.4;
        }
      }
      var src=ctx.createBufferSource();src.buffer=buf;
      var gain=ctx.createGain();gain.gain.setValueAtTime(0,ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35,ctx.currentTime+0.5);
      gain.gain.setValueAtTime(0.35,ctx.currentTime+dur-1);
      gain.gain.linearRampToValueAtTime(0,ctx.currentTime+dur);
      src.connect(gain);gain.connect(ctx.destination);
      src.start(0);src.stop(ctx.currentTime+dur);
      src.onended=function(){ctx.close()};
    }catch(e){}
  }
  document.addEventListener('click',playOceanWave,{once:true});
  document.addEventListener('touchstart',playOceanWave,{once:true});
})();
"""

# Insert at end of the main script section
c = sr(c,
    """if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootSightSeersSite, {once:true});""",
    """if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootSightSeersSite, {once:true});""" + ocean_js,
    "Add ocean wave ambient sound on first interaction")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
