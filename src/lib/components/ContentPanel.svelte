<script>
    let { activeTab } = $props()

    import About from "./content/About.svelte";
    import Contact from "./content/Contact.svelte";
    import Work from "./content/Work.svelte";
    
    const tabs = { about: About, work: Work, contact: Contact }
    
    let imageModalSrc = $state(null)
    const expandImage = (src) => { imageModalSrc = src }
    const closeImage = () => {
        // if (imageModalSrc == null) { return }
        const modal = document.querySelector("#gallery-modal")
        modal.classList.add("hidden")
        modal.addEventListener('animationend', () => {
            imageModalSrc = null
        }, { once: true })
    }
</script>

<div class="content-container">
{#if tabs[activeTab]}
    {@const Tab = tabs[activeTab]}
    <Tab expandImage={expandImage} />
{/if}
</div>

{#if imageModalSrc != null}
    <div id="gallery-modal" onclick={() => closeImage()} class="gallery-modal">
        <img alt="modal" src={imageModalSrc} draggable="false" />
    </div>
{/if}