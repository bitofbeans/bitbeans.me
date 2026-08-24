<script>
    const { expandImage } = $props()
    let images = import.meta.glob('/public/images/*.png', {import: 'default', eager: true}) 

    const imageUrls = Object.values(images)
</script>
<h1>My Work</h1>

<h2>Teleport</h2>
<p>
    It's finished, play it online <a class="large-text" href="https://scratch.mit.edu/projects/1299864236/">on scratch</a>:
</p>
<p>
    Or, play on itch.io below (less likely to be up to date)
</p>
<div class="iframe-container">
    <iframe title="itch embed" frameborder="0" src="https://itch.io/embed/4765787?bg_color=131a2b&amp;fg_color=ffffff&amp;link_color=995afa&amp;border_color=3d4350" height="167"><a href="https://bitbeans.itch.io/teleport">TELEPORT by BitBeans</a></iframe>
</div>

<h2>DJ Mix</h2>

<p>I'm still working on it, but listen to a demo here:</p>
<div class="iframe-container">
    <iframe title="soundcloud embed" height="166" scrolling="no" frameborder="no" allow="autoplay; encrypted-media" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2358514967&color=%23ad6dca&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe><div style="font-size: 10px; color: #131a2b;line-break: anywhere;word-break: normal;overflow: hidden;white-space: nowrap;text-overflow: ellipsis; font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;font-weight: 100;"><a href="https://soundcloud.com/user-95597774" title="bitbeans" target="_blank" style="color: #131a2b; text-decoration: none;">bitbeans</a> · <a href="https://soundcloud.com/user-95597774/primaconca" title="primaconca" target="_blank" style="color: #131a2b; text-decoration: none;">primaconca</a></div>
</div>

<h2>Graphic Design Work</h2>
<p>
    Here's some designs I've made in Adobe Illustrator. Click on one to view it, my favorites are at the top:
</p>

<div class="gallery">
    {#each imageUrls as src }
        <div class='gallery-item'>
            <img onclick={() => expandImage(src)} {src}  alt="gallery item" draggable="false" />
        </div>
    {/each}
</div>

<h2>Older Work</h2>
<h3>2048 </h3>
<p>
    2048 clone I made. Drag <a href="javascript:x=document.createElement('script');x.src='https://bitofbeans.github.io/js2048Game/new/script.js'; x.id = 'script'; void document.getElementsByTagName('head')[0].appendChild(x);">this link</a> to your bookmarks bar. Then use it on any website
    to add it (even this one!)
</p>
<p>
    <a href="https://github.com/bitofbeans/js2048Game">Source code</a>
</p>

<h3>Wordle </h3> 
<p>
    Wordle clone I made in Svelte. App is hosted <a href="http://bit-wordle.web.app" target="_blank" rel="noopener noreferrer">here</a>.  
</p>
<p>
    <a href="https://github.com/bitofbeans/jsWordleGame">Source code</a>
</p>